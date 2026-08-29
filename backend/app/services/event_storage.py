from __future__ import annotations

from typing import Any

from bson.objectid import ObjectId
from fastapi import UploadFile
from gridfs import GridFS
from pymongo import MongoClient
from pymongo.database import Database

from ..config import settings


def get_mongo_client():
    if not settings.MONGODB_URI:
        raise RuntimeError("MONGODB_URI is not configured")
    return MongoClient(settings.MONGODB_URI)


def get_events_db() -> Database:
    client = get_mongo_client()
    return client[settings.MONGODB_DB_NAME]


def save_event_image_bytes(image_bytes: bytes, filename: str, content_type: str = "application/octet-stream") -> str:
    """Store raw event image bytes in MongoDB GridFS and return the readable route URL."""
    db = get_events_db()
    fs = GridFS(db, collection=settings.MONGODB_EVENTS_BUCKET)
    file_id = fs.put(
        image_bytes,
        filename=filename or "event-image",
        contentType=content_type or "application/octet-stream",
    )
    return f"{settings.BACKEND_BASE_URL.rstrip('/')}/api/hod/event-images/{str(file_id)}"


def save_event_image(file: UploadFile) -> str:
    """Store an uploaded event image in MongoDB GridFS and return its route URL."""
    content = file.file.read()
    return save_event_image_bytes(
        content,
        file.filename or "event-image",
        file.content_type or "application/octet-stream",
    )


def get_event_image_file(image_id: str) -> Any:
    db = get_events_db()
    fs = GridFS(db, collection=settings.MONGODB_EVENTS_BUCKET)
    try:
        return fs.get(ObjectId(image_id))
    except Exception as exc:
        raise FileNotFoundError("Event image not found") from exc


def delete_event_image_by_url(image_url: str) -> bool:
    """Delete the GridFS image attached to an event URL, returning True when removed."""
    if not image_url:
        return False

    try:
        from urllib.parse import urlparse

        parsed = urlparse(image_url)
        candidate = parsed.path.split("/event-images/")[-1].split("?")[0].split("#")[0]
        if not candidate:
            return False

        file_id = candidate.strip()
        if not ObjectId.is_valid(file_id):
            return False

        db = get_events_db()
        fs = GridFS(db, collection=settings.MONGODB_EVENTS_BUCKET)
        fs.delete(ObjectId(file_id))
        return True
    except Exception:
        return False
