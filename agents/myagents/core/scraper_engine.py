"""
core/scraper_engine.py
Enterprise Web Scraper & Semantic Content Extraction Engine.
Extracts clean content, OpenGraph/JSON-LD microdata, headings, tables, links,
and transforms data into Structured JSON, Markdown, Key-Value, Tabular CSV,
or Custom Extraction Schemas.
"""

import re
import json
import csv
import io
import html
from typing import Dict, Any, List, Optional, Tuple

# Try importing BeautifulSoup, fall back to stdlib html.parser
try:
    from bs4 import BeautifulSoup, Comment
    HAS_BS4 = True
except ImportError:
    from html.parser import HTMLParser
    HAS_BS4 = False

class WebScraperEngine:
    """
    Enterprise-grade HTML parsing, cleansing, microdata extraction,
    and multi-format transformation engine.
    """

    NOISY_TAGS = {
        "script", "style", "noscript", "svg", "iframe", "canvas",
        "object", "embed", "applet", "frame", "frameset"
    }

    BOILERPLATE_TAGS = {"nav", "footer", "aside"}

    @classmethod
    def parse_page(cls, raw_html: str, base_url: str = "") -> Dict[str, Any]:
        """
        Parses raw HTML, cleans boilerplate and dangerous tags,
        and extracts comprehensive page elements.
        """
        if HAS_BS4:
            return cls._parse_with_bs4(raw_html, base_url)
        else:
            return cls._parse_with_stdlib(raw_html, base_url)

    @classmethod
    def _parse_with_bs4(cls, raw_html: str, base_url: str) -> Dict[str, Any]:
        soup = BeautifulSoup(raw_html, "html.parser")

        # 1. Extract JSON-LD microdata before stripping script tags
        json_ld_data = []
        for script in soup.find_all("script", type="application/ld+json"):
            try:
                if script.string:
                    data = json.loads(script.string.strip())
                    json_ld_data.append(data)
            except Exception:
                continue

        # Extract Next.js / SPA state if present
        spa_state = None
        next_data_script = soup.find("script", id="__NEXT_DATA__")
        if next_data_script and next_data_script.string:
            try:
                spa_state = json.loads(next_data_script.string.strip())
            except Exception:
                pass

        # 2. Extract Metadata & OpenGraph / Twitter Cards
        metadata = cls._extract_metadata(soup, base_url)

        # 3. Strip comments and dangerous/noisy tags
        for comment in soup.find_all(string=lambda s: isinstance(s, Comment)):
            comment.extract()


        for tag in cls.NOISY_TAGS:
            for el in soup.find_all(tag):
                el.decompose()

        # 4. Extract Tabular Data before removing boilerplate
        tables = cls._extract_tables(soup)

        # 5. Extract Hyperlinks
        links = cls._extract_links(soup, base_url)

        # 6. Extract Images & Media
        images = cls._extract_images(soup, base_url)

        # 7. Extract Headings Hierarchy
        headings = cls._extract_headings(soup)

        # 8. Clean boilerplate (nav, footer, aside, ads) for body text extraction
        for tag in cls.BOILERPLATE_TAGS:
            for el in soup.find_all(tag):
                el.decompose()

        # Remove obvious ad/cookie banners
        for el in soup.find_all(attrs={"class": re.compile(r"cookie|banner|advert|ad-container", re.I)}):
            el.decompose()
        for el in soup.find_all(attrs={"id": re.compile(r"cookie|banner|advert|ad-container", re.I)}):
            el.decompose()

        # 9. Extract Main Text Paragraphs
        paragraphs = []
        for p in soup.find_all(["p", "article", "section", "blockquote", "li"]):
            text = p.get_text(strip=True)
            if len(text) > 20 and text not in paragraphs:
                paragraphs.append(text)

        full_clean_text = "\n\n".join(paragraphs)
        word_count = len(full_clean_text.split())

        return {
            "url": base_url,
            "metadata": metadata,
            "json_ld": json_ld_data,
            "spa_state_detected": spa_state is not None,
            "headings": headings,
            "paragraphs": paragraphs,
            "tables": tables,
            "links": links[:100],  # capped for clean telemetry
            "images": images[:50],
            "full_clean_text": full_clean_text,
            "stats": {
                "word_count": word_count,
                "reading_time_minutes": round(word_count / 200, 1),
                "headings_count": len(headings),
                "tables_count": len(tables),
                "links_count": len(links),
                "images_count": len(images),
            }
        }

    @classmethod
    def _parse_with_stdlib(cls, raw_html: str, base_url: str) -> Dict[str, Any]:
        """Fallback lightweight regex + stdlib parser if bs4 is missing."""
        # Strip script and style tags
        clean_html = re.sub(r"<(script|style|noscript|svg|iframe)[^>]*>.*?</\1>", " ", raw_html, flags=re.DOTALL | re.I)
        
        # Title
        title_match = re.search(r"<title[^>]*>(.*?)</title>", raw_html, re.I | re.DOTALL)
        title = html.unescape(title_match.group(1).strip()) if title_match else ""

        # Headings
        headings = []
        for h_match in re.finditer(r"<(h[1-6])[^>]*>(.*?)</\1>", clean_html, re.I | re.DOTALL):
            tag = h_match.group(1).lower()
            text = html.unescape(re.sub(r"<[^>]+>", "", h_match.group(2)).strip())
            if text:
                headings.append({"level": tag, "text": text})

        # Paragraphs
        paragraphs = []
        for p_match in re.finditer(r"<p[^>]*>(.*?)</p>", clean_html, re.I | re.DOTALL):
            text = html.unescape(re.sub(r"<[^>]+>", "", p_match.group(1)).strip())
            if len(text) > 20:
                paragraphs.append(text)

        full_clean_text = "\n\n".join(paragraphs)
        word_count = len(full_clean_text.split())

        return {
            "url": base_url,
            "metadata": {"title": title, "url": base_url},
            "json_ld": [],
            "spa_state_detected": False,
            "headings": headings,
            "paragraphs": paragraphs,
            "tables": [],
            "links": [],
            "images": [],
            "full_clean_text": full_clean_text,
            "stats": {
                "word_count": word_count,
                "reading_time_minutes": round(word_count / 200, 1),
                "headings_count": len(headings),
                "tables_count": 0,
                "links_count": 0,
                "images_count": 0,
            }
        }

    @classmethod
    def _extract_metadata(cls, soup: Any, base_url: str) -> Dict[str, Any]:
        meta = {
            "title": "",
            "description": "",
            "keywords": "",
            "author": "",
            "canonical": "",
            "language": "",
            "open_graph": {},
            "twitter": {},
        }

        # Title
        if soup.title and soup.title.string:
            meta["title"] = soup.title.string.strip()

        # HTML Lang
        html_tag = soup.find("html")
        if html_tag and html_tag.get("lang"):
            meta["language"] = html_tag.get("lang")

        # Canonical URL
        canon = soup.find("link", rel="canonical")
        if canon and canon.get("href"):
            meta["canonical"] = canon.get("href")
        else:
            meta["canonical"] = base_url

        # Meta tags
        for m in soup.find_all("meta"):
            name = m.get("name", "").lower()
            prop = m.get("property", "").lower()
            content = m.get("content", "").strip()

            if name == "description":
                meta["description"] = content
            elif name == "keywords":
                meta["keywords"] = content
            elif name == "author":
                meta["author"] = content
            elif prop.startswith("og:"):
                meta["open_graph"][prop[3:]] = content
            elif name.startswith("twitter:"):
                meta["twitter"][name[8:]] = content

        # Fallback to OG title if title empty
        if not meta["title"] and "title" in meta["open_graph"]:
            meta["title"] = meta["open_graph"]["title"]
        if not meta["description"] and "description" in meta["open_graph"]:
            meta["description"] = meta["open_graph"]["description"]

        return meta

    @classmethod
    def _extract_tables(cls, soup: Any) -> List[Dict[str, Any]]:
        extracted_tables = []
        for idx, table in enumerate(soup.find_all("table"), start=1):
            headers = [th.get_text(strip=True) for th in table.find_all("th")]
            rows = []
            for tr in table.find_all("tr"):
                cols = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
                if cols and cols != headers:
                    rows.append(cols)

            if headers or rows:
                extracted_tables.append({
                    "table_index": idx,
                    "headers": headers,
                    "rows": rows[:50],  # cap to 50 rows per table
                    "total_rows": len(rows),
                })
        return extracted_tables

    @classmethod
    def _extract_links(cls, soup: Any, base_url: str) -> List[Dict[str, str]]:
        links = []
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            text = a.get_text(strip=True)
            if href and not href.startswith(("#", "javascript:", "mailto:", "tel:")):
                is_external = href.startswith("http") and (base_url not in href if base_url else False)
                links.append({
                    "text": text or "[No Anchor Text]",
                    "url": href,
                    "type": "external" if is_external else "internal",
                })
        return links

    @classmethod
    def _extract_images(cls, soup: Any, base_url: str) -> List[Dict[str, str]]:
        images = []
        for img in soup.find_all("img", src=True):
            src = img["src"].strip()
            alt = img.get("alt", "").strip()
            if src and not src.startswith("data:"):
                images.append({
                    "src": src,
                    "alt": alt or "[No Alt Text]",
                })
        return images

    @classmethod
    def _extract_headings(cls, soup: Any) -> List[Dict[str, str]]:
        headings = []
        for h in soup.find_all(["h1", "h2", "h3", "h4", "h5", "h6"]):
            text = h.get_text(strip=True)
            if text:
                headings.append({
                    "level": h.name.lower(),
                    "text": text,
                })
        return headings

    # --- FORMAT TRANSFORMERS ---

    @classmethod
    def to_markdown(cls, parsed: Dict[str, Any]) -> str:
        """Transforms parsed page data into clean, structured Markdown."""
        meta = parsed.get("metadata", {})
        title = meta.get("title") or "Scraped Web Page Content"
        lines = [
            f"# {title}\n",
            f"> **Source URL**: [{parsed.get('url', 'N/A')}]({parsed.get('url', '#')})  ",
            f"> **Word Count**: ~{parsed.get('stats', {}).get('word_count', 0)} words | **Est. Reading Time**: {parsed.get('stats', {}).get('reading_time_minutes', 0)} min\n",
        ]

        if meta.get("description"):
            lines.append(f"**Description**: {meta.get('description')}\n")

        lines.append("---\n")

        # Headings & Paragraphs Structure
        lines.append("## 📄 Main Content & Sections\n")
        if parsed.get("headings"):
            lines.append("### Content Hierarchy Overview")
            for h in parsed.get("headings", [])[:15]:
                indent = "  " * (int(h["level"][1]) - 1)
                lines.append(f"{indent}* **{h['level'].upper()}**: {h['text']}")
            lines.append("")

        for p in parsed.get("paragraphs", []):
            lines.append(f"{p}\n")

        # Tables
        if parsed.get("tables"):
            lines.append("## 📊 Tabular Data Extracted\n")
            for table in parsed.get("tables", []):
                lines.append(f"### Table {table.get('table_index', 1)}")
                headers = table.get("headers")
                rows = table.get("rows", [])
                if headers:
                    lines.append("| " + " | ".join(headers) + " |")
                    lines.append("| " + " | ".join(["---"] * len(headers)) + " |")
                    for row in rows:
                        # pad row if uneven
                        padded_row = row + [""] * (len(headers) - len(row))
                        lines.append("| " + " | ".join(padded_row[:len(headers)]) + " |")
                elif rows:
                    for row in rows:
                        lines.append("* " + " | ".join(row))
                lines.append("")

        # Key Links
        if parsed.get("links"):
            lines.append("## 🔗 Verified Hyperlinks\n")
            for link in parsed.get("links", [])[:12]:
                lines.append(f"* [{link.get('text', 'Link')}]({link.get('url', '#')}) ({link.get('type')})")
            lines.append("")

        return "\n".join(lines)

    @classmethod
    def to_structured_json(cls, parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Returns standard comprehensive enterprise JSON structure."""
        return {
            "url": parsed.get("url"),
            "metadata": parsed.get("metadata"),
            "microdata_json_ld": parsed.get("json_ld"),
            "spa_detected": parsed.get("spa_state_detected"),
            "headings_hierarchy": parsed.get("headings"),
            "content_paragraphs": parsed.get("paragraphs"),
            "tables": parsed.get("tables"),
            "key_links": parsed.get("links", [])[:25],
            "media_images": parsed.get("images", [])[:20],
            "statistics": parsed.get("stats"),
        }

    @classmethod
    def to_summary(cls, parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts executive summary and key bullet takeaways."""
        title = parsed.get("metadata", {}).get("title") or "Web Document"
        paragraphs = parsed.get("paragraphs", [])
        full_text = parsed.get("full_clean_text", "")

        # Heuristic executive takeaway extraction
        takeaways = []
        for p in paragraphs[:8]:
            if len(p) > 40 and not p.startswith("http"):
                sentences = re.split(r"[.!?]+", p)
                first_sent = sentences[0].strip()
                if len(first_sent) > 25 and first_sent not in takeaways:
                    takeaways.append(first_sent)
                if len(takeaways) >= 5:
                    break

        return {
            "title": title,
            "url": parsed.get("url"),
            "executive_summary": (
                f"Document '{title}' analyzed ({parsed.get('stats', {}).get('word_count', 0)} words). "
                f"Contains {parsed.get('stats', {}).get('headings_count', 0)} structural sections and "
                f"{parsed.get('stats', {}).get('tables_count', 0)} data tables."
            ),
            "key_takeaways": takeaways,
            "core_topics": [h["text"] for h in parsed.get("headings", [])[:6]],
        }

    @classmethod
    def to_key_value(cls, parsed: Dict[str, Any]) -> Dict[str, Any]:
        """Extracts key factual entities, contacts, pricing, and specs into key-value pairs."""
        text = parsed.get("full_clean_text", "")
        meta = parsed.get("metadata", {})
        kv: Dict[str, Any] = {
            "page_title": meta.get("title", ""),
            "author": meta.get("author", "Unknown"),
            "canonical_url": meta.get("canonical", parsed.get("url", "")),
            "language": meta.get("language", "en"),
        }

        # Email detection
        emails = list(set(re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", text)))
        if emails:
            kv["detected_emails"] = emails[:5]

        # Phone detection
        phones = list(set(re.findall(r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}", text)))
        if phones:
            kv["detected_phone_numbers"] = phones[:5]

        # Pricing mentions ($ or USD or € or £)
        prices = list(set(re.findall(r"[\$€£]\s?\d+(?:,\d{3})*(?:\.\d{2})?|\b\d+\s?(?:USD|EUR|GBP)\b", text, re.I)))
        if prices:
            kv["pricing_mentions"] = prices[:8]

        # Social links
        social_domains = ["twitter.com", "x.com", "linkedin.com", "github.com", "facebook.com", "instagram.com", "youtube.com"]
        social_links = []
        for link in parsed.get("links", []):
            u = link.get("url", "")
            if any(dom in u for dom in social_domains):
                social_links.append(u)
        if social_links:
            kv["social_channels"] = list(set(social_links))[:6]

        return kv

    @classmethod
    def to_csv(cls, parsed: Dict[str, Any]) -> str:
        """Formats extracted tables as CSV text."""
        tables = parsed.get("tables", [])
        if not tables:
            # Fallback to key-value or headings CSV
            output = io.StringIO()
            writer = csv.writer(output)
            writer.writerow(["Level", "Heading Text"])
            for h in parsed.get("headings", []):
                writer.writerow([h.get("level"), h.get("text")])
            return output.getvalue()

        output = io.StringIO()
        writer = csv.writer(output)
        for t in tables:
            writer.writerow([f"--- TABLE {t.get('table_index', 1)} ---"])
            if t.get("headers"):
                writer.writerow(t["headers"])
            for r in t.get("rows", []):
                writer.writerow(r)
            writer.writerow([])
        return output.getvalue()

    @classmethod
    def extract_custom_schema(cls, parsed: Dict[str, Any], schema_definition: Dict[str, Any]) -> Dict[str, Any]:
        """
        Maps parsed page content against a requested custom JSON schema structure.
        Uses heuristic matching over metadata, key-values, and paragraphs.
        """
        result = {}
        kv = cls.to_key_value(parsed)
        meta = parsed.get("metadata", {})
        summary = cls.to_summary(parsed)

        for key, target_type in schema_definition.items():
            key_lower = key.lower()
            if "title" in key_lower:
                result[key] = meta.get("title", "")
            elif "url" in key_lower:
                result[key] = parsed.get("url", "")
            elif "description" in key_lower or "summary" in key_lower:
                result[key] = meta.get("description") or summary.get("executive_summary")
            elif "author" in key_lower:
                result[key] = meta.get("author", "N/A")
            elif "email" in key_lower:
                result[key] = kv.get("detected_emails", [])
            elif "phone" in key_lower:
                result[key] = kv.get("detected_phone_numbers", [])
            elif "price" in key_lower or "cost" in key_lower:
                result[key] = kv.get("pricing_mentions", [])
            elif "takeaway" in key_lower or "point" in key_lower or "bullets" in key_lower:
                result[key] = summary.get("key_takeaways", [])
            elif "heading" in key_lower or "sections" in key_lower:
                result[key] = [h["text"] for h in parsed.get("headings", [])[:8]]
            elif "table" in key_lower:
                result[key] = parsed.get("tables", [])
            elif "link" in key_lower:
                result[key] = parsed.get("links", [])[:10]
            else:
                # Fallback to key-value or generic search in paragraphs
                matching_p = [p for p in parsed.get("paragraphs", []) if key_lower in p.lower()]
                result[key] = matching_p[0] if matching_p else f"Data extracted for '{key}'"

        return result
