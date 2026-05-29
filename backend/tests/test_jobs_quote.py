import uuid
from unittest.mock import AsyncMock, Mock

import pytest

from app.domain.jobs import service as job_service
from app.domain.jobs.models import JobFreshness
from app.domain.jobs.schemas import JobCreate


@pytest.mark.asyncio
async def test_quote_job_refreshes_full_job_and_returns_loaded_instance():
    db = AsyncMock()
    db.add = Mock()
    db.flush = AsyncMock()
    requester_id = uuid.uuid4()
    data = JobCreate(
        title="Runtime quote test",
        description="Validation payload",
        category="finance",
        region="global",
        source_type="web",
        budget_usdc=25.0,
        compliance_accepted=True,
        freshness=JobFreshness.once,
    )

    refreshed_job = Mock()
    refreshed_job.id = uuid.uuid4()
    result_mock = Mock()
    result_mock.scalar_one = Mock(return_value=refreshed_job)
    db.execute.return_value = result_mock

    refresh_calls = []

    async def refresh_side_effect(instance, *attr_names, **kwargs):
        refresh_calls.append((instance, attr_names, kwargs))

    db.refresh.side_effect = refresh_side_effect

    result = await job_service.quote_job(db, requester_id, data)

    assert result is refreshed_job
    assert len(refresh_calls) == 1
    assert refresh_calls[0][0] is not None
    assert refresh_calls[0][1] == ()
    db.execute.assert_awaited()
