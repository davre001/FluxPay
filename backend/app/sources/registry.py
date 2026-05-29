"""
Central source adapter registry.
Maps source_connector names → adapter instances.
"""
from app.sources.base import BaseSourceAdapter
from app.sources.customer_urls import CustomerUrlsAdapter
from app.sources.ecommerce import get_adapter as get_ecommerce_adapter

_CUSTOMER_URLS_ADAPTER = CustomerUrlsAdapter()

ECOMMERCE_CONNECTORS = {"lazada_ph", "shopee_ph", "generic_ecommerce", "public_web"}


def get_source_adapter(source_connector: str, url: str) -> BaseSourceAdapter:
    """Resolve the right adapter for a given source connector name and URL."""
    if source_connector == "customer_urls":
        return _CUSTOMER_URLS_ADAPTER

    if source_connector in ECOMMERCE_CONNECTORS or source_connector == "public_web":
        return get_ecommerce_adapter(source_connector, url)

    # Default to generic e-commerce
    return get_ecommerce_adapter("generic_ecommerce", url)
