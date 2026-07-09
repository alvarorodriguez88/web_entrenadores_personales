from sqlalchemy.orm import Session
from fastapi import HTTPException
import httpx
from fastmcp import Client
from fastmcp.client.transports import StreamableHttpTransport
import json

from app.config import settings
from app.models.chat import ChatSesion, ChatMensaje
from app.schemas.chat import ChatSessionCreate, ChatMessageIn

SYSTEM_PROMPT = """You are an assistant for personal trainers using the web-entrenadores platform.
You have access to the trainer's clients, routines and analytics data through tools.
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


def _save_assistant_with_tool_calls(db: Session, session_id: int, llm_message: dict) -> ChatMensaje:
    payload = json.dumps({
        "content": llm_message.get("content"),
        "tool_calls": llm_message["tool_calls"],
    }, ensure_ascii=False)
    return _save_message(db, session_id, "assistant", payload)


def _save_tool_result(db: Session, session_id: int, tool_call_id: str, result_text: str) -> ChatMensaje:
    payload = json.dumps({
        "tool_call_id": tool_call_id,
        "content": result_text,
    }, ensure_ascii=False)
    return _save_message(db, session_id, "tool", payload)


def _is_json_content(text: str) -> bool:
    return (text or "").strip().startswith("{")


def _build_messages_for_llm(history: list[ChatMensaje]) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in history:
        if msg.rol == "user":
            messages.append({"role": "user", "content": msg.content})
        elif msg.rol == "assistant":
            if _is_json_content(msg.content):
                data = json.loads(msg.content)
                messages.append({
                    "role": "assistant",
                    "content": data.get("content"),
                    "tool_calls": data["tool_calls"],
                })
            else:
                messages.append({"role": "assistant", "content": msg.content})
        elif msg.rol == "tool":
            data = json.loads(msg.content)
            messages.append({
                "role": "tool",
                "tool_call_id": data["tool_call_id"],
                "content": data["content"],
            })
    return messages


async def _call_llm(messages: list[dict], tools: list[dict]) -> dict:
    payload = {
        "model": settings.OLLAMA_MODEL,
        "messages": messages,
        "stream": False,
    }
    if tools:
        payload["tools"] = tools

    async with httpx.AsyncClient(timeout=1200.0) as client:
        response = await client.post(settings.OLLAMA_URL, json=payload)
        response.raise_for_status()
        return response.json()


async def _get_mcp_tools(token: str) -> list[dict]:
    transport = StreamableHttpTransport(
        url=settings.MCP_URL,
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


async def _execute_tool_call(token: str, tool_name: str, tool_args: dict) -> str:
    transport = StreamableHttpTransport(
        url=settings.MCP_URL,
        headers={"Authorization": f"Bearer {token}"}
    )
    async with Client(transport) as client:
        result = await client.call_tool(tool_name, tool_args)
    parts = [item.text if hasattr(item, "text") else str(item) for item in result.content]
    return "\n".join(parts) if parts else ""


async def send_message(db: Session, trainer_id: int, trainer_token: str, session_id: int, user_content: str) -> ChatMensaje:
    session = get_session(db, session_id, trainer_id)

    _save_message(db, session_id, "user", user_content)

    if not session.titulo:
        session.titulo = user_content[:50] + ("..." if len(user_content) > 50 else "")
        db.commit()

    history = get_messages(db, session_id, trainer_id)
    context_messages = _build_messages_for_llm(history)

    tools = await _get_mcp_tools(trainer_token)

    MAX_ITERATIONS = 10
    for _ in range(MAX_ITERATIONS):
        response = await _call_llm(context_messages, tools)
        llm_message = response.get("choices", [{}])[0].get("message", {})
        tool_calls = llm_message.get("tool_calls") or []

        if not tool_calls:
            final_content = llm_message.get("content") or ""
            return _save_message(db, session_id, "assistant", final_content)

        _save_assistant_with_tool_calls(db, session_id, llm_message)
        context_messages.append({
            "role": "assistant",
            "content": llm_message.get("content"),
            "tool_calls": tool_calls,
        })

        for call in tool_calls:
            fn = call.get("function", {})
            tool_name = fn.get("name", "")
            tool_call_id = call.get("id", "")
            tool_args = fn.get("arguments", {})
            if isinstance(tool_args, str):
                try:
                    tool_args = json.loads(tool_args)
                except json.JSONDecodeError:
                    tool_args = {}

            try:
                result_text = await _execute_tool_call(trainer_token, tool_name, tool_args)
            except Exception as e:
                result_text = f"Error executing tool {tool_name}: {str(e)}"

            _save_tool_result(db, session_id, tool_call_id, result_text)
            context_messages.append({
                "role": "tool",
                "tool_call_id": tool_call_id,
                "content": result_text,
            })

    response = await _call_llm(context_messages, [])
    fallback_content = response.get("choices", [{}])[0].get("message", {}).get("content") or ""
    return _save_message(db, session_id, "assistant", fallback_content)
