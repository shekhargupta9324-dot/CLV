from fastapi import APIRouter, Depends, HTTPException, Query
from jose import JWTError, jwt
from sqlalchemy.orm import Session

import auth
import database
import models
from mongo_explorer_store import (
    MONGO_COLLECTIONS,
    get_collection_count,
    get_collection_preview,
    get_collection_spec,
    get_mongo_connection_status,
    get_mongo_db_name,
    is_mongo_configured,
    mongo_is_connected,
    seed_collection_documents,
)

router = APIRouter(prefix="/mongo", tags=["Mongo Explorer"])


def _get_authenticated_user(token: str, db: Session) -> models.User:
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.get("/explorer")
def get_mongo_explorer(token: str = Query(...), db: Session = Depends(database.get_db)):
    user = _get_authenticated_user(token, db)
    if user.role not in ("admin", "sub-admin"):
        raise HTTPException(status_code=403, detail="Only admins and sub-admins can access the Mongo explorer")

    status = get_mongo_connection_status()
    database_name = get_mongo_db_name()
    collections = []

    for spec in MONGO_COLLECTIONS:
        collections.append(
            {
                **spec,
                "documentCount": get_collection_count(spec["collectionName"]),
                "previewDocuments": get_collection_preview(spec["collectionName"], limit=5),
                "storageMode": "live" if status["connected"] else "sample",
            }
        )

    return {
        "connected": status["connected"],
        "configured": status["configured"],
        "error": status["error"],
        "databaseName": database_name,
        "databaseUriConfigured": bool(is_mongo_configured()),
        "collections": collections,
    }


@router.post("/seed-sample")
def seed_sample_documents(token: str = Query(...), replace: bool = Query(False), db: Session = Depends(database.get_db)):
    user = _get_authenticated_user(token, db)
    if user.role not in ("admin", "sub-admin"):
        raise HTTPException(status_code=403, detail="Only admins and sub-admins can seed sample MongoDB data")

    if not is_mongo_configured():
        raise HTTPException(status_code=503, detail="MongoDB is not configured. Set MONGO_URI or MONGODB_URI first.")

    try:
        inserted_counts = seed_collection_documents(replace=replace)
        return {
            "message": "MongoDB sample documents seeded successfully",
            "seededBy": user.email,
            "insertedCounts": inserted_counts,
        }
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@router.get("/collections/{collection_name}")
def get_collection_documents(collection_name: str, token: str = Query(...), limit: int = Query(10, ge=1, le=50), db: Session = Depends(database.get_db)):
    user = _get_authenticated_user(token, db)
    if user.role not in ("admin", "sub-admin"):
        raise HTTPException(status_code=403, detail="Only admins and sub-admins can access collection documents")

    spec = get_collection_spec(collection_name)
    if spec is None:
        raise HTTPException(status_code=404, detail="Collection not found")

    return {
        "collection": spec,
        "documents": get_collection_preview(spec["collectionName"], limit=limit),
        "count": get_collection_count(spec["collectionName"]),
        "configured": is_mongo_configured(),
        "connected": mongo_is_connected(),
    }
