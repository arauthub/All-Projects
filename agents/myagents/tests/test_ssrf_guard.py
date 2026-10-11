"""
tests/test_ssrf_guard.py
Unit tests verifying enterprise SSRF defense mechanisms, IP filtering,
and protocol guardrails.
"""

import unittest
from core.security.ssrf_guard import SSRFGuard

class TestSSRFGuard(unittest.TestCase):

    def test_forbid_private_ips(self):
        # RFC1918 Private Ranges
        for private_ip in ["10.0.0.1", "172.16.0.1", "192.168.1.1", "10.254.254.1"]:
            is_safe, reason = SSRFGuard.is_safe_ip(private_ip)
            self.assertFalse(is_safe, f"Private IP {private_ip} was not blocked!")
            self.assertIn("Private intranet", reason)

    def test_forbid_loopback(self):
        # Loopback IPv4 & IPv6
        for loopback_ip in ["127.0.0.1", "127.0.1.1", "::1"]:
            is_safe, reason = SSRFGuard.is_safe_ip(loopback_ip)
            self.assertFalse(is_safe, f"Loopback {loopback_ip} was not blocked!")
            self.assertIn("Loopback", reason)

    def test_forbid_cloud_metadata(self):
        # Cloud metadata IP (GCP / AWS / Azure)
        for meta_ip in ["169.254.169.254", "169.254.0.1"]:
            is_safe, reason = SSRFGuard.is_safe_ip(meta_ip)
            self.assertFalse(is_safe, f"Metadata IP {meta_ip} was not blocked!")
            self.assertIn("metadata", reason.lower())

    def test_forbid_carrier_nat_and_multicast(self):
        # Carrier Grade NAT & Multicast
        is_safe_cgnat, _ = SSRFGuard.is_safe_ip("100.64.0.1")
        self.assertFalse(is_safe_cgnat)

        is_safe_multi, _ = SSRFGuard.is_safe_ip("224.0.0.1")
        self.assertFalse(is_safe_multi)

    def test_allow_public_ips(self):
        # Public globally routable DNS IPs
        for pub_ip in ["8.8.8.8", "1.1.1.1", "142.250.190.46"]:
            is_safe, _ = SSRFGuard.is_safe_ip(pub_ip)
            self.assertTrue(is_safe, f"Valid public IP {pub_ip} was incorrectly blocked!")

    def test_audit_forbidden_schemes(self):
        for bad_url in [
            "file:///etc/passwd",
            "ftp://ftp.example.com",
            "gopher://example.com",
            "data:text/html,<h1>Hello</h1>",
            "javascript:alert(1)",
        ]:
            audit = SSRFGuard.audit_url(bad_url)
            self.assertFalse(audit["safe"], f"Insecure scheme URL '{bad_url}' was not flagged unsafe!")
            self.assertTrue(any("protocol" in r.lower() for r in audit["reasons"]))

    def test_audit_forbidden_hostnames(self):
        for bad_url in [
            "http://169.254.169.254/computeMetadata/v1/",
            "http://metadata.google.internal/computeMetadata/v1/",
            "http://localhost:8080/admin",
            "http://127.0.0.1:8080/secret",
        ]:
            audit = SSRFGuard.audit_url(bad_url)
            self.assertFalse(audit["safe"], f"URL '{bad_url}' was not flagged unsafe!")

if __name__ == "__main__":
    unittest.main()
