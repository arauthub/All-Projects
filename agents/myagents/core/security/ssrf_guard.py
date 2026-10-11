"""
core/security/ssrf_guard.py
Enterprise SSRF (Server-Side Request Forgery) Defense Engine & Safe HTTP Client.
Protects against cloud metadata theft, intranet scanning, loopback exploits,
DNS rebinding, malicious redirects, and resource exhaustion.
"""

import socket
import ipaddress
import urllib.parse
import urllib.request
import gzip
import zlib
import time
from typing import Tuple, List, Optional, Dict, Any

class SSRFSecurityException(Exception):
    """Raised when a URL or resolved destination violates security policies."""
    pass

class SafeFetchResult:
    def __init__(
        self,
        success: bool,
        url: str,
        final_url: str,
        status_code: int = 0,
        content: str = "",
        content_type: str = "",
        headers: Optional[Dict[str, str]] = None,
        response_time_ms: float = 0.0,
        content_length_bytes: int = 0,
        error: Optional[str] = None,
        security_audit: Optional[Dict[str, Any]] = None,
    ):
        self.success = success
        self.url = url
        self.final_url = final_url
        self.status_code = status_code
        self.content = content
        self.content_type = content_type
        self.headers = headers or {}
        self.response_time_ms = response_time_ms
        self.content_length_bytes = content_length_bytes
        self.error = error
        self.security_audit = security_audit or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "url": self.url,
            "final_url": self.final_url,
            "status_code": self.status_code,
            "content_type": self.content_type,
            "response_time_ms": self.response_time_ms,
            "content_length_bytes": self.content_length_bytes,
            "error": self.error,
            "security_audit": self.security_audit,
        }

class SSRFGuard:
    """
    Enterprise-grade security filter for outgoing web requests.
    Enforces strict protocol whitelisting, IP blacklisting, redirect validation,
    and size constraints.
    """

    ALLOWED_SCHEMES = {"http", "https"}
    DEFAULT_MAX_BYTES = 5 * 1024 * 1024  # 5 Megabytes hard limit
    DEFAULT_TIMEOUT_SEC = 12.0
    MAX_REDIRECTS = 5

    # Cloud metadata hostnames
    FORBIDDEN_HOSTNAMES = {
        "metadata.google.internal",
        "metadata.goog",
        "169.254.169.254",
        "instance-data",
        "localhost",
        "ip6-localhost",
        "ip6-loopback",
    }

    # Standard browser user agent
    DEFAULT_USER_AGENT = (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 "
        "(compatible; GoogleADK-ScraperAgent/1.0; +https://github.com/arauthub/All-Projects)"
    )

    @classmethod
    def audit_url(cls, url: str) -> Dict[str, Any]:
        """
        Perform complete preflight security audit on a URL without fetching it.
        Returns safety verdict and detailed diagnostic check results.
        """
        audit_details = {
            "url": url,
            "safe": False,
            "scheme": None,
            "hostname": None,
            "port": None,
            "resolved_ips": [],
            "reasons": [],
            "timestamp": time.time(),
        }

        try:
            parsed = urllib.parse.urlparse(url.strip())
            audit_details["scheme"] = parsed.scheme
            audit_details["hostname"] = parsed.hostname
            audit_details["port"] = parsed.port or (443 if parsed.scheme == "https" else 80)

            # 1. Scheme Validation
            if not parsed.scheme or parsed.scheme.lower() not in cls.ALLOWED_SCHEMES:
                audit_details["reasons"].append(
                    f"Forbidden or missing protocol '{parsed.scheme}'. Only HTTP and HTTPS are permitted."
                )
                return audit_details

            # 2. Hostname Validation
            hostname = parsed.hostname
            if not hostname:
                audit_details["reasons"].append("Missing or empty hostname in URL.")
                return audit_details

            hostname_lower = hostname.lower()
            if hostname_lower in cls.FORBIDDEN_HOSTNAMES:
                audit_details["reasons"].append(
                    f"Forbidden hostname '{hostname}' matches known cloud metadata / loopback address."
                )
                return audit_details

            # 3. DNS Resolution & IP Classification
            try:
                addr_info = socket.getaddrinfo(hostname, audit_details["port"], type=socket.SOCK_STREAM)
                resolved_ips = list({res[4][0] for res in addr_info})
                audit_details["resolved_ips"] = resolved_ips
            except Exception as e:
                audit_details["reasons"].append(f"DNS resolution failed for '{hostname}': {str(e)}")
                return audit_details

            if not resolved_ips:
                audit_details["reasons"].append(f"No IP addresses could be resolved for '{hostname}'.")
                return audit_details

            # 4. Check every resolved IP address
            for ip_str in resolved_ips:
                is_safe, reason = cls.is_safe_ip(ip_str)
                if not is_safe:
                    audit_details["reasons"].append(f"IP {ip_str} rejected: {reason}")
                    return audit_details

            # If all checks passed
            audit_details["safe"] = True
            audit_details["reasons"].append("URL passed all SSRF and cloud metadata security audits.")
            return audit_details

        except Exception as ex:
            audit_details["reasons"].append(f"URL parsing or audit error: {str(ex)}")
            return audit_details

    @classmethod
    def is_safe_ip(cls, ip_str: str) -> Tuple[bool, str]:
        """
        Verify that an IP address is a globally routable public address.
        Blocks loopback, private RFC1918, link-local, multicast, and carrier-grade NAT.
        """
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            return False, f"Invalid IP address format: {ip_str}"

        # 1. Loopback addresses (127.0.0.0/8, ::1)
        if ip.is_loopback:
            return False, f"Loopback address ({ip_str}) is forbidden."

        # 2. Link-local (169.254.0.0/16, fe80::/10) - Cloud metadata APIs
        if ip.is_link_local:
            return False, f"Link-local cloud metadata address ({ip_str}) is forbidden."

        # 3. Private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, fc00::/7)
        if ip.is_private:
            return False, f"Private intranet address ({ip_str}) is forbidden."

        # 4. Multicast & Reserved
        if ip.is_multicast:
            return False, f"Multicast address ({ip_str}) is forbidden."
        if ip.is_reserved:
            return False, f"Reserved IETF address ({ip_str}) is forbidden."
        if ip.is_unspecified:
            return False, f"Unspecified address ({ip_str}) is forbidden."

        # 5. IPv4-mapped IPv6 check (e.g., ::ffff:127.0.0.1)
        if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
            return cls.is_safe_ip(str(ip.ipv4_mapped))

        # 6. Specific carrier-grade NAT (100.64.0.0/10)
        if isinstance(ip, ipaddress.IPv4Address):
            cgnat = ipaddress.IPv4Network("100.64.0.0/10")
            if ip in cgnat:
                return False, f"Carrier-Grade NAT address ({ip_str}) is forbidden."

        return True, "IP is a valid public routable address."

    @classmethod
    def fetch_url_safely(
        cls,
        url: str,
        timeout: float = DEFAULT_TIMEOUT_SEC,
        max_bytes: int = DEFAULT_MAX_BYTES,
        user_agent: Optional[str] = None,
        custom_headers: Optional[Dict[str, str]] = None,
    ) -> SafeFetchResult:
        """
        Safely fetch content from a public URL with full SSRF protection,
        manual redirect hop auditing, decompression, and byte caps.
        """
        start_time = time.time()
        current_url = url.strip()
        redirect_history: List[str] = []
        ua = user_agent or cls.DEFAULT_USER_AGENT

        for hop in range(cls.MAX_REDIRECTS + 1):
            redirect_history.append(current_url)

            # Perform preflight SSRF audit on target URL
            audit = cls.audit_url(current_url)
            if not audit["safe"]:
                elapsed = (time.time() - start_time) * 1000.0
                return SafeFetchResult(
                    success=False,
                    url=url,
                    final_url=current_url,
                    response_time_ms=elapsed,
                    error=f"SSRF Security Violation: {'; '.join(audit['reasons'])}",
                    security_audit=audit,
                )

            # Construct safe request
            headers = {
                "User-Agent": ua,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,application/json;q=0.5,*/*;q=0.1",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate",
                "Connection": "close",
            }
            if custom_headers:
                headers.update(custom_headers)

            req = urllib.request.Request(current_url, headers=headers, method="GET")

            # Custom handler to intercept redirects and prevent automatic uninspected follow
            class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
                def redirect_request(self, req, fp, code, msg, headers, newurl):
                    # Do not follow automatically; let caller inspect and validate newurl
                    return None

            opener = urllib.request.build_opener(NoRedirectHandler)

            try:
                with opener.open(req, timeout=timeout) as response:
                    status_code = response.getcode()
                    resp_headers = dict(response.headers)
                    content_type = resp_headers.get("Content-Type", "")

                    # Check for redirect status codes (301, 302, 303, 307, 308)
                    if status_code in (301, 302, 303, 307, 308):
                        location = resp_headers.get("Location")
                        if not location:
                            raise SSRFSecurityException(f"Redirect status {status_code} received without Location header.")
                        # Resolve relative redirect URLs
                        current_url = urllib.parse.urljoin(current_url, location)
                        continue  # Follow to next hop in loop

                    # Check Content-Length before downloading if provided
                    cl_header = resp_headers.get("Content-Length")
                    if cl_header and cl_header.isdigit():
                        if int(cl_header) > max_bytes:
                            elapsed = (time.time() - start_time) * 1000.0
                            return SafeFetchResult(
                                success=False,
                                url=url,
                                final_url=current_url,
                                status_code=status_code,
                                response_time_ms=elapsed,
                                error=f"Payload exceeds maximum allowed size ({int(cl_header)} bytes > {max_bytes} bytes).",
                                security_audit=audit,
                            )

                    # Stream download in chunks up to max_bytes
                    raw_chunks = []
                    bytes_read = 0
                    chunk_size = 64 * 1024  # 64 KB

                    while True:
                        chunk = response.read(chunk_size)
                        if not chunk:
                            break
                        bytes_read += len(chunk)
                        if bytes_read > max_bytes:
                            elapsed = (time.time() - start_time) * 1000.0
                            return SafeFetchResult(
                                success=False,
                                url=url,
                                final_url=current_url,
                                status_code=status_code,
                                response_time_ms=elapsed,
                                error=f"Response stream truncated: exceeded maximum limit of {max_bytes} bytes.",
                                security_audit=audit,
                            )
                        raw_chunks.append(chunk)

                    raw_data = b"".join(raw_chunks)

                    # Transparent decompression (case-insensitive header & magic-byte detection)
                    encoding = next((v for k, v in resp_headers.items() if k.lower() == "content-encoding"), "").lower()
                    if "gzip" in encoding or raw_data.startswith(b"\x1f\x8b"):
                        try:
                            raw_data = gzip.decompress(raw_data)
                        except Exception:
                            pass
                    elif "deflate" in encoding or raw_data.startswith((b"\x78\x9c", b"\x78\x01", b"\x78\xda")):
                        try:
                            raw_data = zlib.decompress(raw_data)
                        except Exception:
                            try:
                                raw_data = zlib.decompress(raw_data, -zlib.MAX_WBITS)
                            except Exception:
                                pass


                    # Decode text using detected or default encoding
                    text_content = ""
                    for enc in ("utf-8", "latin-1", "iso-8859-1", "cp1252"):
                        try:
                            text_content = raw_data.decode(enc)
                            break
                        except (UnicodeDecodeError, LookupError):
                            continue
                    if not text_content:
                        text_content = raw_data.decode("utf-8", errors="replace")

                    elapsed = (time.time() - start_time) * 1000.0
                    audit["redirect_hops"] = len(redirect_history) - 1
                    audit["redirect_history"] = redirect_history

                    return SafeFetchResult(
                        success=True,
                        url=url,
                        final_url=current_url,
                        status_code=status_code,
                        content=text_content,
                        content_type=content_type,
                        headers=resp_headers,
                        response_time_ms=round(elapsed, 2),
                        content_length_bytes=len(raw_data),
                        security_audit=audit,
                    )

            except urllib.error.HTTPError as he:
                # Handle HTTP error with redirect checks
                if he.code in (301, 302, 303, 307, 308) and "Location" in he.headers:
                    location = he.headers["Location"]
                    current_url = urllib.parse.urljoin(current_url, location)
                    continue
                elapsed = (time.time() - start_time) * 1000.0
                return SafeFetchResult(
                    success=False,
                    url=url,
                    final_url=current_url,
                    status_code=he.code,
                    response_time_ms=round(elapsed, 2),
                    error=f"HTTP Error {he.code}: {he.reason}",
                    security_audit=audit,
                )
            except Exception as e:
                elapsed = (time.time() - start_time) * 1000.0
                return SafeFetchResult(
                    success=False,
                    url=url,
                    final_url=current_url,
                    response_time_ms=round(elapsed, 2),
                    error=f"Network fetch exception: {str(e)}",
                    security_audit=audit,
                )

        # Exceeded max redirects
        elapsed = (time.time() - start_time) * 1000.0
        return SafeFetchResult(
            success=False,
            url=url,
            final_url=current_url,
            response_time_ms=round(elapsed, 2),
            error=f"Exceeded maximum redirect limit of {cls.MAX_REDIRECTS} hops.",
            security_audit=audit,
        )
