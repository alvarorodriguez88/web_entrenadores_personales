from sqlalchemy.orm import Session
from fastapi import HTTPException
import httpx
import os
from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport
import json

from app.models.chat import ChatSesion, ChatMensaje
from app.schemas.chat import ChatSessionCreate, ChatMessageIn


OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ollama:11434/v1/chat/completions")
MCP_URL = os.getenv("MCP_URL", "http://mcp:8000/mcp")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

SYSTEM_PROMPT = """You are an assistant for personal trainers using the web-entrenadores platform.
You have access to the trainer's clients, routines and analytics data.
Use the available tools to answer questions accurately based on real data.
When comparing clients or recommending routines, always base your answer on the data retrieved.
Respond in the same language the trainer uses."""


def create_session(db: Session, trainer_id: int, data: ChatSessionCreate) -> ChatSesion:
    session = ChatSesion(
        id_entrenador=trainer_id,
        titulo=data.titulo
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def get_sessions(db: Session, trainer_id: int) -> list[ChatSesion]:
    return db.query(ChatSesion).filter(
        ChatSesion.id_entrenador == trainer_id
    ).order_by(ChatSesion.fecha_updated.desc()).all()


def get_session(db: Session, session_id: int, trainer_id: int) -> ChatSesion:
    session = db.query(ChatSesion).filter(
        ChatSesion.id_chat_sesion == session_id,
        ChatSesion.id_entrenador == trainer_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session


def delete_session(db: Session, session_id: int, trainer_id: int) -> None:
    session = get_session(db, session_id, trainer_id)
    db.delete(session)
    db.commit()


def get_messages(db: Session, session_id: int, trainer_id: int) -> list[ChatMensaje]:
    get_session(db, session_id, trainer_id)
    return db.query(ChatMensaje).filter(
        ChatMensaje.id_sesion == session_id
    ).order_by(ChatMensaje.fecha_creacion.asc()).all()


def clear_messages(db: Session, session_id: int, trainer_id: int) -> None:
    get_session(db, session_id, trainer_id)
    db.query(ChatMensaje).filter(ChatMensaje.id_sesion == session_id).delete()
    db.commit()


def _save_message(db: Session, session_id: int, role: str, content: str) -> ChatMensaje:
    message = ChatMensaje(
        id_sesion=session_id,
        rol=role,
        content=content
    )
    db.add(message)
    db.commit()
    db.refresh(message)
    return message


def _build_messages_for_llm(history: list[ChatMensaje], new_user_content: str) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        messages.append({"role": msg.rol, "content": msg.content})
    messages.append({"role": "user", "content": new_user_content})
    return messages


async def _call_llm(messages: list[dict], tools: list[dict]) -> dict:
    payload = {
        "model": OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }
    if tools:
        payload["tools"] = tools

    async with httpx.AsyncClient(timeout=1200.0) as client:
        response = await client.post(OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json()


async def _get_mcp_tools(token: str) -> list[dict]:
    transport = StreamableHttpTransport(
        url=MCP_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    async with Client(transport) as client:
        tools = await client.list_tools()
        return [_format_tool(t) for t in tools]


def _format_tool(tool) -> dict:
    return {
        "type": "function",
        "function": {
            "name": tool.name,
            "description": tool.description or "",
            "parameters": tool.inputSchema if hasattr(tool, "inputSchema") else {"type": "object", "properties": {}},
        }
    }


async def _execute_tool_call(token: str, tool_name: str, tool_args: dict) -> dict:
    transport = StreamableHttpTransport(
        url=MCP_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    async with Client(transport) as client:
        result = await client.call_tool(tool_name, tool_args)
        return result


async def send_message(db: Session, trainer_id: int, trainer_token: str, session_id: int, user_content: str) -> ChatMensaje:
    session = get_session(db, session_id, trainer_id)

    _save_message(db, session_id, "user", user_content)

    if not session.titulo:
        session.titulo = user_content[:50] + ("..." if len(user_content) > 50 else "")
        db.commit()

    history = get_messages(db, session_id, trainer_id)

    messages_for_llm = _build_messages_for_llm(history[:-1], user_content)

    tools = await _get_mcp_tools(trainer_token)

    response = await _call_llm(messages_for_llm, tools)

    message_content = response.get("choices", [{}])[0].get("message", {})
    tool_calls = message_content.get("tool_calls", [])

    if not tool_calls:
        assistant_content = message_content.get("content", "")
    else:
        context_messages = messages_for_llm + [{"role": "assistant", "content": message_content.get("content", "")}]
        for call in tool_calls:
            fn = call.get("function", {})
            tool_name = fn.get("name", "")
            tool_args = fn.get("arguments", {})
            if isinstance(tool_args, str):
                tool_args = json.loads(tool_args)

            try:
                tool_result = await _execute_tool_call(trainer_token, tool_name, tool_args)
                if isinstance(tool_result, str):
                    result_text = tool_result
                else:
                    try:
                        json.dumps(tool_result)
                        result_text = json.dumps(tool_result, ensure_ascii=False, default=str)
                    except (TypeError, ValueError):
                        result_text = str(tool_result)
            except Exception as e:
                result_text = f"Error executing tool {tool_name}: {str(e)}"

            context_messages.append({
                "role": "tool",
                "tool_call_id": call.get("id", ""),
                "content": result_text
            })

        response = await _call_llm(context_messages, [])
        assistant_content = response.get("choices", [{}])[0].get("message", {}).get("content", "")

    return _save_message(db, session_id, "assistant", assistant_content)
