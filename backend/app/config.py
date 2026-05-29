from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

# .env lives at the project root (one level above backend/)
_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=str(_ENV_FILE), extra="ignore")

    # Database
    database_url: str = "postgresql+asyncpg://fluxpay:fluxpay_dev@localhost:5432/fluxpay"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Auth
    secret_key: str = "dev-secret-key-change-in-production"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"

    # CORS
    frontend_url: str = "http://localhost:3000"

    # Blockchain (Morph Hoodi testnet — chain 2910)
    morph_rpc_url: str = "https://rpc-hoodi.morphl2.io"
    coordinator_address: str = ""
    coordinator_private_key: str = ""
    escrow_factory_address: str = ""
    usdc_address: str = ""

    # Platform
    platform_fee_percent: float = 20.0
    environment: str = "development"
    log_level: str = "INFO"


settings = Settings()
