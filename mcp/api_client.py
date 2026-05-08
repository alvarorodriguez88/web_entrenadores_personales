import os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8080/api/v1")


async def api_get(path: str, params: dict = None, token: str = "") -> dict | list:
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{API_BASE_URL}{path}",
            headers=headers, 
            params=params or {},
        )
        response.raise_for_status()
        return response.json()