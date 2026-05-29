"""
Seed the 5 initial FluxPay data product templates.
Called once on app startup if the table is empty.
"""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.templates.models import DatasetProduct
from app.sources.ecommerce import ECOMMERCE_OUTPUT_SCHEMA
from app.infrastructure.logging import get_logger

logger = get_logger(__name__)

MERCHANT_LEAD_SCHEMA = {
    "type": "object",
    "required": ["business_name", "category"],
    "properties": {
        "business_name": {"type": "string"},
        "category":      {"type": "string"},
        "address":       {"type": "string"},
        "city":          {"type": "string"},
        "phone":         {"type": "string"},
        "website":       {"type": "string"},
        "url":           {"type": "string"},
    },
}

RENTAL_SCHEMA = {
    "type": "object",
    "required": ["title", "price"],
    "properties": {
        "title":        {"type": "string"},
        "price":        {"type": "number"},
        "currency":     {"type": "string"},
        "bedrooms":     {"type": "integer"},
        "location":     {"type": "string"},
        "listing_date": {"type": "string"},
        "url":          {"type": "string"},
    },
}

REVIEW_SCHEMA = {
    "type": "object",
    "required": ["product_name", "review_text"],
    "properties": {
        "product_name":    {"type": "string"},
        "review_text":     {"type": "string"},
        "rating":          {"type": "number"},
        "sentiment":       {"type": "string", "enum": ["positive", "neutral", "negative"]},
        "reviewer":        {"type": "string"},
        "review_date":     {"type": "string"},
        "source":          {"type": "string"},
    },
}

INITIAL_TEMPLATES = [
    DatasetProduct(
        title="Smartphone Price Tracker — Manila Marketplaces",
        description=(
            "Track prices of the top 50 smartphones across Lazada, Shopee, and other "
            "Manila marketplace sellers. Updated on your schedule."
        ),
        category="ecommerce_prices",
        region="PH",
        source_type="lazada_ph",
        output_schema=ECOMMERCE_OUTPUT_SCHEMA,
        default_freshness="weekly",
        default_max_rows=50,
        estimated_cost_usdc=3.5,
        tags=["e-commerce", "prices", "smartphones", "philippines", "lazada"],
        is_featured=True,
    ),
    DatasetProduct(
        title="Lazada vs Shopee Price Comparison — SKU List",
        description=(
            "Compare prices for a specific SKU list across Lazada and Shopee PH. "
            "Provide your SKU URLs and get a side-by-side price table."
        ),
        category="ecommerce_prices",
        region="PH",
        source_type="customer_urls",
        output_schema=ECOMMERCE_OUTPUT_SCHEMA,
        default_freshness="daily",
        default_max_rows=200,
        estimated_cost_usdc=5.0,
        tags=["e-commerce", "price-comparison", "lazada", "shopee", "sku"],
        is_featured=True,
    ),
    DatasetProduct(
        title="Local Merchant Lead List",
        description=(
            "Find 100 local merchants in a category and city. Returns business name, "
            "category, address, phone, and website. Ideal for B2B sales and marketing agencies."
        ),
        category="merchant_leads",
        region="PH",
        source_type="generic_ecommerce",
        output_schema=MERCHANT_LEAD_SCHEMA,
        default_freshness="once",
        default_max_rows=100,
        estimated_cost_usdc=8.0,
        tags=["leads", "merchants", "b2b", "directories", "philippines"],
        is_featured=True,
    ),
    DatasetProduct(
        title="Rental Listing Tracker",
        description=(
            "Track rental listings for a city and summarize price movement. "
            "Returns title, price, bedrooms, location, and listing date."
        ),
        category="real_estate",
        region="PH",
        source_type="generic_ecommerce",
        output_schema=RENTAL_SCHEMA,
        default_freshness="weekly",
        default_max_rows=150,
        estimated_cost_usdc=6.0,
        tags=["real-estate", "rentals", "listings", "price-tracking"],
        is_featured=False,
    ),
    DatasetProduct(
        title="Product Review Sentiment Collector",
        description=(
            "Collect product review snippets and sentiment for a brand or category. "
            "Useful for brand monitoring, competitor analysis, and product feedback loops."
        ),
        category="reviews",
        region="PH",
        source_type="generic_ecommerce",
        output_schema=REVIEW_SCHEMA,
        default_freshness="weekly",
        default_max_rows=200,
        estimated_cost_usdc=7.5,
        tags=["reviews", "sentiment", "brand-monitoring", "e-commerce"],
        is_featured=False,
    ),
]


async def seed_templates(db: AsyncSession) -> None:
    result = await db.execute(select(DatasetProduct).limit(1))
    if result.scalar_one_or_none():
        return  # already seeded

    for tmpl in INITIAL_TEMPLATES:
        db.add(tmpl)

    await db.flush()
    logger.info("templates_seeded", count=len(INITIAL_TEMPLATES))
