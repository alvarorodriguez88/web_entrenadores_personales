import os
import httpx
from mcp.server.fastmcp import Context
from contextvars import ContextVar
from typing import Callable, Any

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080/api/v1")

_trainer_token = ContextVar("trainer_token", default="")


def set_token_from_context(ctx: Context) -> None:
    header = ctx.request_context.request.headers.get("Authorization", "")
    if header.startswith("Bearer "):
        _trainer_token.set(header[7:])
    else:
        _trainer_token.set("")


async def api_get(path: str, params: dict = None) -> dict | list:
    token = _trainer_token.get()
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{API_BASE_URL}{path}",
            headers=headers,
            params=params or {},
        )
        response.raise_for_status()
        return response.json()
