"""
Customer URL list adapter — requester provides a list of URLs to fetch.
Extracts structured data using the job's output schema + generic CSS selectors.
"""
from typing import Any
from urllib.parse import urlparse

import httpx
from selectolax.parser import HTMLParser
from tenacity import retry, stop_after_attempt, wait_exponential

from app.sources.base import BaseSourceAdapter, ScrapeResult, SourceConfig
from app.sources.public_web import _content_hash, _random_ua


class CustomerUrlsAdapter(BaseSourceAdapter):
    config = SourceConfig(
        name="customer_urls",
        source_type="customer_urls",
        allowed_fields=["title", "url", "extracted_fields", "status_code"],
        rate_limit_per_minute=15,
        respect_robots_txt=True,
        compliance_notes=(
            "Fetches only customer-provided URLs. "
            "Customer is responsible for ensuring collection is permitted."
        ),
        proof_format={"method": "customer_url_fetch", "fields": ["source_url", "status_code", "content_hash"]},
    )

    def validate_url(self, url: str) -> bool:
        parsed = urlparse(url)
        return bool(parsed.scheme in ("http", "https") and parsed.netloc)

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(min=1, max=5))
    async def _get(self, client: httpx.AsyncClient, url: str) -> httpx.Response:
        headers = {
            "User-Agent": _random_ua(),
            "Accept": "text/html,application/xhtml+xml,*/*;q=0.8",
        }
        resp = await client.get(url, headers=headers, follow_redirects=True, timeout=20.0)
        resp.raise_for_status()
        return resp

    def _extract_with_schema(self, html: str, output_schema: dict) -> dict[str, Any]:
        tree = HTMLParser(html)
        result: dict[str, Any] = {}

        title_node = tree.css_first("title")
        result["title"] = title_node.text(strip=True) if title_node else ""

        # Try to extract schema-specified fields using common patterns
        props = output_schema.get("properties", {})
        extracted: dict[str, Any] = {}
        for field_name in props:
            # Try itemprop, name attr, id attr in order
            for selector in [
                f"[itemprop='{field_name}']",
                f"[name='{field_name}']",
                f"#{field_name}",
                f".{field_name}",
            ]:
                node = tree.css_first(selector)
                if node:
                    extracted[field_name] = node.text(strip=True) or node.attributes.get("content", "")
                    break

        result["extracted_fields"] = extracted
        return result

    async def fetch(self, url: str, payload: dict[str, Any]) -> list[ScrapeResult]:
        output_schema = payload.get("output_schema", {})

        async with httpx.AsyncClient() as client:
            try:
                resp = await self._get(client, url)
            except httpx.HTTPStatusError as e:
                data = {"url": url, "status_code": e.response.status_code, "title": "", "extracted_fields": {}}
                proof = self._make_proof(url, e.response.status_code, confidence=0.0)
                return [ScrapeResult(data=data, proof=proof, error=f"HTTP {e.response.status_code}")]
            except Exception as e:
                return [self._error_result(url, str(e))]

            html = resp.text
            extracted = self._extract_with_schema(html, output_schema)
            extracted["url"] = str(resp.url)
            extracted["status_code"] = resp.status_code

            confidence = 0.9 if extracted.get("title") else 0.5
            proof = self._make_proof(url, resp.status_code, "customer_url_fetch", confidence, _content_hash(html))
            return [ScrapeResult(data=extracted, proof=proof)]
