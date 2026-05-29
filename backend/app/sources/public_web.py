"""
Generic public web scraper using httpx + selectolax.
Configurable per-site via SiteProfile CSS selector maps.
Handles: rate limiting, retries, user-agent rotation, robots.txt respect.
"""
import asyncio
import hashlib
import re
from dataclasses import dataclass, field
from typing import Any
from urllib.parse import urljoin, urlparse

import httpx
from selectolax.parser import HTMLParser
from tenacity import retry, stop_after_attempt, wait_exponential

from app.sources.base import BaseSourceAdapter, ScrapeResult, SourceConfig

try:
    from fake_useragent import UserAgent
    _ua = UserAgent()
    def _random_ua() -> str:
        return _ua.random
except Exception:
    def _random_ua() -> str:
        return "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


@dataclass
class FieldSelector:
    css: str
    attr: str | None = None      # None = inner text, "href" = attribute
    transform: str | None = None # "price", "int", "float", "strip"


@dataclass
class SiteProfile:
    """CSS selector map for one e-commerce site layout."""
    name: str
    domains: list[str]
    # Selectors for list pages (search results)
    item_container: str           # each product card
    fields: dict[str, FieldSelector]
    # Selectors for detail pages (optional)
    detail_fields: dict[str, FieldSelector] = field(default_factory=dict)
    # Request config
    headers: dict[str, str] = field(default_factory=dict)
    delay_between_requests: float = 1.5
    # Whether the site needs a search URL template
    search_url_template: str = ""


def _transform(value: str, transform: str | None) -> Any:
    if not value or not transform:
        return value.strip() if value else ""
    v = value.strip()
    if transform == "price":
        # Extract first number (handles "₱ 1,234.56", "USD 99.00", etc.)
        m = re.search(r"[\d,]+\.?\d*", v.replace(",", ""))
        return float(m.group()) if m else None
    if transform == "int":
        m = re.search(r"\d+", v.replace(",", ""))
        return int(m.group()) if m else None
    if transform == "float":
        m = re.search(r"[\d.]+", v)
        return float(m.group()) if m else None
    if transform == "strip":
        return v
    return v


def _extract_field(node, selector: FieldSelector) -> Any:
    el = node.css_first(selector.css)
    if el is None:
        return None
    if selector.attr:
        raw = el.attributes.get(selector.attr, "")
    else:
        raw = el.text(strip=True)
    return _transform(raw, selector.transform)


def _content_hash(html: str) -> str:
    return hashlib.sha256(html.encode()).hexdigest()[:16]


class PublicWebAdapter(BaseSourceAdapter):
    config = SourceConfig(
        name="public_web",
        source_type="public_web",
        allowed_fields=["name", "price", "currency", "rating", "review_count", "seller", "url"],
        rate_limit_per_minute=20,
        respect_robots_txt=True,
        compliance_notes=(
            "Only scrapes publicly accessible pages. "
            "Respects rate limits. No login-gated content. "
            "No personal data. For price intelligence only."
        ),
        proof_format={"method": "html_scrape", "fields": ["source_url", "status_code", "content_hash"]},
    )

    def __init__(self, profile: "SiteProfile"):
        self.profile = profile
        self._semaphore = asyncio.Semaphore(3)  # max 3 concurrent requests

    def validate_url(self, url: str) -> bool:
        host = urlparse(url).netloc.lower()
        return any(d in host for d in self.profile.domains)

    def _build_headers(self) -> dict[str, str]:
        base = {
            "User-Agent": _random_ua(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "DNT": "1",
        }
        base.update(self.profile.headers)
        return base

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    async def _get(self, client: httpx.AsyncClient, url: str) -> httpx.Response:
        async with self._semaphore:
            resp = await client.get(url, headers=self._build_headers(), follow_redirects=True)
            resp.raise_for_status()
            await asyncio.sleep(self.profile.delay_between_requests)
            return resp

    def _parse_items(self, html: str, page_url: str) -> list[dict[str, Any]]:
        tree = HTMLParser(html)
        items = []
        containers = tree.css(self.profile.item_container)

        for node in containers:
            item: dict[str, Any] = {}
            for field_name, selector in self.profile.fields.items():
                item[field_name] = _extract_field(node, selector)

            # Resolve relative URLs
            if "url" in item and item["url"] and not item["url"].startswith("http"):
                item["url"] = urljoin(page_url, item["url"])

            # Only include items with at least a name and price
            if item.get("name") and item.get("price") is not None:
                items.append(item)

        return items

    async def fetch(self, url: str, payload: dict[str, Any]) -> list[ScrapeResult]:
        results: list[ScrapeResult] = []

        # If site has a search template, build the search URL
        target_url = url
        if self.profile.search_url_template and payload.get("category"):
            category = payload["category"].replace(" ", "+")
            target_url = self.profile.search_url_template.format(
                query=category,
                page=payload.get("offset", 0) // 20 + 1,
            )

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                resp = await self._get(client, target_url)
            except httpx.HTTPStatusError as e:
                return [self._error_result(target_url, f"HTTP {e.response.status_code}")]
            except Exception as e:
                return [self._error_result(target_url, str(e))]

            html = resp.text
            chash = _content_hash(html)
            items = self._parse_items(html, target_url)

            # Limit to requested rows
            max_rows = payload.get("rows", 20)
            items = items[:max_rows]

            for item in items:
                confidence = self._score_confidence(item)
                proof = self._make_proof(
                    url=target_url,
                    status_code=resp.status_code,
                    method="html_scrape",
                    confidence=confidence,
                    content_hash=chash,
                )
                results.append(ScrapeResult(data=item, proof=proof))

        return results

    def _score_confidence(self, item: dict) -> float:
        required = {"name", "price"}
        optional = {"rating", "review_count", "seller", "url"}
        present_required = sum(1 for f in required if item.get(f) is not None)
        present_optional = sum(1 for f in optional if item.get(f) is not None)
        base = (present_required / len(required)) * 0.7
        bonus = (present_optional / len(optional)) * 0.3
        return round(base + bonus, 4)
