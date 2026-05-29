"""
Abstract base for all FluxPay source adapters.
Every adapter must define: allowed_fields, rate_limit_per_minute, proof_format.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any


@dataclass
class ScrapeProof:
    source_url: str
    collected_at: datetime
    method: str
    status_code: int
    confidence: float = 1.0
    content_hash: str = ""


@dataclass
class ScrapeResult:
    data: dict[str, Any]
    proof: ScrapeProof
    error: str | None = None

    @property
    def success(self) -> bool:
        return self.error is None


@dataclass
class SourceConfig:
    name: str
    source_type: str
    allowed_fields: list[str]
    rate_limit_per_minute: int = 30
    respect_robots_txt: bool = True
    requires_js: bool = False
    compliance_notes: str = ""
    proof_format: dict[str, Any] = field(default_factory=dict)


class BaseSourceAdapter(ABC):
    config: SourceConfig

    @abstractmethod
    async def fetch(self, url: str, payload: dict[str, Any]) -> list[ScrapeResult]:
        """
        Fetch data from the given URL using the task payload.
        Returns a list of results (one per item/row scraped).
        """
        ...

    @abstractmethod
    def validate_url(self, url: str) -> bool:
        """Return True if this adapter can handle the given URL."""
        ...

    def _make_proof(
        self,
        url: str,
        status_code: int,
        method: str = "html_scrape",
        confidence: float = 1.0,
        content_hash: str = "",
    ) -> ScrapeProof:
        return ScrapeProof(
            source_url=url,
            collected_at=datetime.now(timezone.utc),
            method=method,
            status_code=status_code,
            confidence=confidence,
            content_hash=content_hash,
        )

    def _error_result(self, url: str, error: str) -> ScrapeResult:
        return ScrapeResult(
            data={},
            proof=self._make_proof(url, 0, confidence=0.0),
            error=error,
        )
