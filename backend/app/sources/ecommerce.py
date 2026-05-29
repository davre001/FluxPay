"""
E-commerce price tracker — site profiles and adapter registry.

Supported sites (public pages only, no login required):
  - Lazada PH/SEA (HTML listing pages)
  - Shopee PH/SEA (HTML listing pages, partial JS — falls back to meta tags)
  - Generic fallback (open graph / schema.org structured data)

CSS selectors are tuned for current layouts (2025). Update selectors here
when a site changes its HTML structure — no other code changes needed.
"""
from app.sources.public_web import FieldSelector, PublicWebAdapter, SiteProfile


# ---------------------------------------------------------------------------
# Site Profiles
# ---------------------------------------------------------------------------

LAZADA_PH = SiteProfile(
    name="lazada_ph",
    domains=["lazada.com.ph", "www.lazada.com.ph"],
    item_container="[data-tracking='product-card']",
    fields={
        "name": FieldSelector(css="[data-qa-locator='product-name']"),
        "price": FieldSelector(css="[data-qa-locator='product-price']", transform="price"),
        "currency": FieldSelector(css="[data-qa-locator='product-price']", transform="strip"),
        "rating": FieldSelector(css="[data-qa-locator='review-rating']", transform="float"),
        "review_count": FieldSelector(css="[data-qa-locator='review-count']", transform="int"),
        "seller": FieldSelector(css="[data-qa-locator='seller-name']"),
        "url": FieldSelector(css="a[data-qa-locator='product-name']", attr="href"),
    },
    search_url_template="https://www.lazada.com.ph/catalog/?q={query}&page={page}",
    delay_between_requests=2.0,
)

SHOPEE_PH = SiteProfile(
    name="shopee_ph",
    domains=["shopee.ph", "www.shopee.ph"],
    # Shopee is React-rendered; target SSR meta / structured data
    item_container='script[type="application/ld+json"]',
    fields={
        "name": FieldSelector(css='meta[property="og:title"]', attr="content"),
        "price": FieldSelector(css='meta[property="product:price:amount"]', attr="content", transform="price"),
        "currency": FieldSelector(css='meta[property="product:price:currency"]', attr="content"),
        "url": FieldSelector(css='meta[property="og:url"]', attr="content"),
    },
    search_url_template="https://shopee.ph/search?keyword={query}&page={page}",
    delay_between_requests=2.5,
)

# Generic open graph / schema.org extractor for any public e-commerce page
GENERIC_ECOMMERCE = SiteProfile(
    name="generic_ecommerce",
    domains=[],  # matches any domain via validate_url override
    item_container="[itemtype*='Product'], .product-item, .product-card, article.product",
    fields={
        "name": FieldSelector(css="[itemprop='name'], h2.product-name, .product-title"),
        "price": FieldSelector(css="[itemprop='price'], .price, .product-price", transform="price"),
        "currency": FieldSelector(css="[itemprop='priceCurrency']", attr="content"),
        "rating": FieldSelector(css="[itemprop='ratingValue']", attr="content", transform="float"),
        "review_count": FieldSelector(css="[itemprop='reviewCount']", attr="content", transform="int"),
        "seller": FieldSelector(css="[itemprop='seller'], .seller-name, .store-name"),
        "url": FieldSelector(css="a[itemprop='url'], a.product-link", attr="href"),
    },
    delay_between_requests=1.5,
)


# ---------------------------------------------------------------------------
# Adapter registry
# ---------------------------------------------------------------------------

class GenericEcommerceAdapter(PublicWebAdapter):
    """Fallback adapter — works on any domain using schema.org / OG tags."""

    def validate_url(self, url: str) -> bool:
        return True  # accepts anything


_PROFILES: list[SiteProfile] = [LAZADA_PH, SHOPEE_PH]
_ADAPTERS: dict[str, PublicWebAdapter] = {
    "lazada_ph": PublicWebAdapter(LAZADA_PH),
    "shopee_ph": PublicWebAdapter(SHOPEE_PH),
    "generic_ecommerce": GenericEcommerceAdapter(GENERIC_ECOMMERCE),
}


def get_adapter(source_connector: str, url: str) -> PublicWebAdapter:
    """
    Resolve the right adapter for a task.
    Priority: exact connector name → domain match → generic fallback.
    """
    if source_connector in _ADAPTERS:
        return _ADAPTERS[source_connector]

    for profile in _PROFILES:
        adapter = _ADAPTERS[profile.name]
        if adapter.validate_url(url):
            return adapter

    return _ADAPTERS["generic_ecommerce"]


# E-commerce output schema — used when creating jobs
ECOMMERCE_OUTPUT_SCHEMA = {
    "type": "object",
    "required": ["name", "price"],
    "properties": {
        "name":         {"type": "string",  "description": "Product name"},
        "price":        {"type": "number",  "description": "Listed price"},
        "currency":     {"type": "string",  "description": "ISO 4217 currency code"},
        "rating":       {"type": "number",  "description": "Average star rating (0-5)"},
        "review_count": {"type": "integer", "description": "Total number of reviews"},
        "seller":       {"type": "string",  "description": "Seller / merchant name"},
        "url":          {"type": "string",  "description": "Canonical product URL"},
    },
}
