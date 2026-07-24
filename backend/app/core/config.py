from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        extra="ignore",
        env_file_encoding="utf-8",
    )

    database_url: str = Field(
        default="postgresql://formforge:formforge@127.0.0.1:5433/formforge",
        validation_alias="DATABASE_URL",
    )
    auth_secret: str = Field(default="dev-secret-min-16-chars", validation_alias="AUTH_SECRET")
    redis_url: str | None = Field(default=None, validation_alias="REDIS_URL")
    upstash_redis_rest_url: str | None = Field(default=None, validation_alias="UPSTASH_REDIS_REST_URL")
    upstash_redis_rest_token: str | None = Field(default=None, validation_alias="UPSTASH_REDIS_REST_TOKEN")
    # Namespace all Redis keys — safe to share Upstash DB with QuickPad (uses its own prefix)
    redis_key_prefix: str = Field(default="formforge:", validation_alias="REDIS_KEY_PREFIX")
    app_env: str = Field(default="development", validation_alias="APP_ENV")

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()
