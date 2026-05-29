import pytest
from pydantic import ValidationError

from app.domain.shared.schemas import UserCreate


def test_user_create_rejects_passwords_longer_than_bcrypt_limit():
    with pytest.raises(ValidationError, match="String should have at most 72 characters"):
        UserCreate(email="longpassword@example.com", password="a" * 73)
