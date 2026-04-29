import os
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional

from pymongo import MongoClient
from pymongo.errors import OperationFailure
from dotenv import load_dotenv


load_dotenv(dotenv_path=Path(__file__).with_name(".env"), override=True)


MONGO_COLLECTIONS: List[Dict[str, Any]] = [
    {
        "key": "users",
        "title": "Mongo Demo Users",
        "description": "Basic user documents for viewing in MongoDB Compass or Atlas.",
        "purpose": "Quickly verify that the Mongo database contains readable records.",
        "collectionName": "users",
        "documentShape": "MongoUserRecord",
        "fields": [
            {"name": "id", "type": "string", "required": True},
            {"name": "name", "type": "string", "required": True},
            {"name": "email", "type": "string", "required": True},
            {"name": "role", "type": "string", "required": True},
            {"name": "status", "type": "string", "required": True},
            {"name": "is_verified", "type": "boolean", "required": True},
            {"name": "createdAt", "type": "date", "required": True},
            {"name": "updatedAt", "type": "date", "required": True},
        ],
        "sampleDocument": {
            "id": "user_1001",
            "name": "Super Admin",
            "email": "admin@clv.com",
            "role": "admin",
            "status": "active",
            "is_verified": True,
            "createdAt": "2026-04-29T00:00:00Z",
            "updatedAt": "2026-04-29T00:00:00Z",
        },
        "recommendedIndexes": ["{ email: 1 }", "{ role: 1 }", "{ status: 1 }"],
    },
    {
        "key": "customers",
        "title": "Customer Records",
        "description": "Stores normalized customer profiles after upload or import.",
        "purpose": "Source of truth for CLV and churn features.",
        "collectionName": "customer_records",
        "documentShape": "CustomerRecord",
        "fields": [
            {"name": "id", "type": "string", "required": True, "notes": "Internal document identifier."},
            {"name": "externalId", "type": "string", "required": False, "notes": "Optional source-system id."},
            {"name": "name", "type": "string", "required": True},
            {"name": "email", "type": "string", "required": False},
            {"name": "company", "type": "string", "required": True},
            {"name": "category", "type": "string", "required": True},
            {"name": "age", "type": "number", "required": True},
            {"name": "gender", "type": "string", "required": True},
            {"name": "tenure", "type": "number", "required": True},
            {"name": "monthlySpend", "type": "number", "required": True},
            {"name": "totalSpend", "type": "number", "required": True},
            {"name": "lastPurchaseDate", "type": "string (ISO date)", "required": True},
            {"name": "supportCalls", "type": "number", "required": True},
            {"name": "createdAt", "type": "date", "required": True},
            {"name": "updatedAt", "type": "date", "required": True},
            {"name": "createdBy", "type": "string", "required": True},
        ],
        "sampleDocument": {
            "id": "cust_1001",
            "externalId": "AMZ-88421",
            "name": "Aarav Sharma",
            "email": "aarav.sharma@example.com",
            "company": "Amazon",
            "category": "Electronics",
            "age": 34,
            "gender": "Male",
            "tenure": 18,
            "monthlySpend": 420.5,
            "totalSpend": 7569,
            "lastPurchaseDate": "2026-04-18",
            "supportCalls": 2,
            "createdAt": "2026-04-29T00:00:00Z",
            "updatedAt": "2026-04-29T00:00:00Z",
            "createdBy": "admin@test.com",
        },
        "recommendedIndexes": ["{ company: 1, category: 1 }", "{ createdBy: 1, createdAt: -1 }", "{ externalId: 1 }"],
    },
    {
        "key": "predictions",
        "title": "Prediction Records",
        "description": "Stores every CLV and churn prediction run for auditing.",
        "purpose": "Historical prediction trail and model analysis.",
        "collectionName": "prediction_records",
        "documentShape": "PredictionRecord",
        "fields": [
            {"name": "id", "type": "string", "required": True},
            {"name": "customerId", "type": "string", "required": True},
            {"name": "clv", "type": "number", "required": True},
            {"name": "churnProbability", "type": "number", "required": True},
            {"name": "segment", "type": "string", "required": True},
            {"name": "factors", "type": "string[]", "required": True},
            {"name": "recommendations", "type": "string[]", "required": True},
            {"name": "aiInsights", "type": "AIInsight[]", "required": False, "notes": "Optional embedded insights."},
            {"name": "modelVersion", "type": "string", "required": True},
            {"name": "createdAt", "type": "date", "required": True},
            {"name": "createdBy", "type": "string", "required": True},
        ],
        "sampleDocument": {
            "id": "pred_5001",
            "customerId": "cust_1001",
            "clv": 8420.55,
            "churnProbability": 18.4,
            "segment": "High Value",
            "factors": ["High tenure", "Strong monthly spend", "Low support calls"],
            "recommendations": ["Offer loyalty reward", "Upsell premium bundle"],
            "aiInsights": [],
            "modelVersion": "xgboost-v1.2.0",
            "createdAt": "2026-04-29T00:00:00Z",
            "createdBy": "system",
        },
        "recommendedIndexes": ["{ customerId: 1 }", "{ createdAt: -1 }", "{ segment: 1, createdAt: -1 }"],
    },
    {
        "key": "datasets",
        "title": "Dataset Records",
        "description": "Tracks uploaded and generated datasets.",
        "purpose": "Dataset lifecycle, quality status, and ownership.",
        "collectionName": "dataset_records",
        "documentShape": "DatasetRecord",
        "fields": [
            {"name": "id", "type": "string", "required": True},
            {"name": "name", "type": "string", "required": True},
            {"name": "source", "type": "string", "required": True},
            {"name": "recordCount", "type": "number", "required": True},
            {"name": "createdAt", "type": "date", "required": True},
            {"name": "createdBy", "type": "string", "required": True},
            {"name": "status", "type": "pending | processing | completed | failed", "required": True},
            {"name": "dataQuality", "type": "DataQualityReport", "required": True},
        ],
        "sampleDocument": {
            "id": "ds_20260429_01",
            "name": "Amazon Customer Upload",
            "source": "Amazon CSV upload",
            "recordCount": 100,
            "createdAt": "2026-04-29T00:00:00Z",
            "createdBy": "analyst@test.com",
            "status": "completed",
            "dataQuality": {
                "totalRecords": 100,
                "validRecords": 97,
                "invalidRecords": 3,
                "missingFields": [{"field": "email", "count": 5}],
                "duplicates": 1,
                "outliers": [{"field": "monthlySpend", "count": 2}],
                "completenessScore": 96,
                "accuracyScore": 94,
                "overallScore": 95,
            },
        },
        "recommendedIndexes": ["{ status: 1, createdAt: -1 }", "{ createdBy: 1 }", "{ source: 1 }"],
    },
    {
        "key": "audit",
        "title": "Audit Logs",
        "description": "Captures user actions across uploads, predictions, and admin events.",
        "purpose": "Traceability, security reviews, and debugging.",
        "collectionName": "audit_logs",
        "documentShape": "AuditLog",
        "fields": [
            {"name": "id", "type": "string", "required": True},
            {"name": "userId", "type": "string", "required": True},
            {"name": "action", "type": "string", "required": True},
            {"name": "resource", "type": "string", "required": True},
            {"name": "resourceId", "type": "string", "required": False},
            {"name": "details", "type": "object", "required": False},
            {"name": "ipAddress", "type": "string", "required": False},
            {"name": "userAgent", "type": "string", "required": False},
            {"name": "timestamp", "type": "date", "required": True},
        ],
        "sampleDocument": {
            "id": "audit_9001",
            "userId": "user_12",
            "action": "run_prediction",
            "resource": "prediction_batch",
            "resourceId": "pred_5001",
            "details": {"rows": 100, "engine": "ml"},
            "ipAddress": "127.0.0.1",
            "userAgent": "Mozilla/5.0",
            "timestamp": "2026-04-29T00:00:00Z",
        },
        "recommendedIndexes": ["{ userId: 1, timestamp: -1 }", "{ resource: 1, timestamp: -1 }", "{ timestamp: -1 }"],
    },
    {
        "key": "benchmarks",
        "title": "Industry Benchmarks",
        "description": "Stores benchmark values for different industries and time periods.",
        "purpose": "Compare predictions against industry standards.",
        "collectionName": "industry_benchmarks",
        "documentShape": "IndustryBenchmark",
        "fields": [
            {"name": "industry", "type": "string", "required": True},
            {"name": "avgClv", "type": "number", "required": True},
            {"name": "avgChurnRate", "type": "number", "required": True},
            {"name": "avgRetentionRate", "type": "number", "required": True},
            {"name": "avgCustomerTenure", "type": "number", "required": True},
            {"name": "avgMonthlySpend", "type": "number", "required": True},
            {"name": "topPerformerClv", "type": "number", "required": True},
            {"name": "updatedAt", "type": "date", "required": True},
        ],
        "sampleDocument": {
            "industry": "E-commerce",
            "avgClv": 6400,
            "avgChurnRate": 24,
            "avgRetentionRate": 76,
            "avgCustomerTenure": 22,
            "avgMonthlySpend": 310,
            "topPerformerClv": 18200,
            "updatedAt": "2026-04-29T00:00:00Z",
        },
        "recommendedIndexes": ["{ industry: 1, updatedAt: -1 }"],
    },
    {
        "key": "rateLimits",
        "title": "Rate Limit Counters",
        "description": "Tracks API usage per user and endpoint to protect model requests.",
        "purpose": "Throttle expensive prediction requests and enforce fairness.",
        "collectionName": "rate_limit_entries",
        "documentShape": "RateLimitEntry",
        "fields": [
            {"name": "userId", "type": "string", "required": True},
            {"name": "endpoint", "type": "string", "required": True},
            {"name": "count", "type": "number", "required": True},
            {"name": "windowStart", "type": "date", "required": True},
            {"name": "windowEnd", "type": "date", "required": True},
        ],
        "sampleDocument": {
            "userId": "user_12",
            "endpoint": "/ml/predict",
            "count": 4,
            "windowStart": "2026-04-29T00:00:00Z",
            "windowEnd": "2026-04-29T00:15:00Z",
        },
        "recommendedIndexes": ["{ userId: 1, endpoint: 1 }", "{ windowEnd: 1 }"],
    },
]


def get_mongo_uri() -> Optional[str]:
    return os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")


def get_mongo_db_name() -> str:
    return os.getenv("MONGO_DB_NAME") or os.getenv("MONGODB_DB_NAME") or "CI"


@lru_cache(maxsize=1)
def get_mongo_client() -> Optional[MongoClient]:
    uri = get_mongo_uri()
    if not uri:
        return None
    return MongoClient(uri, serverSelectionTimeoutMS=2000)


def get_mongo_db():
    client = get_mongo_client()
    if client is None:
        return None
    return client[get_mongo_db_name()]


def is_mongo_configured() -> bool:
    return get_mongo_uri() is not None


def mongo_is_connected() -> bool:
    db = get_mongo_db()
    if db is None:
        return False
    try:
        db.command("ping")
        return True
    except OperationFailure:
        return False
    except Exception:
        return False


def get_mongo_connection_status() -> Dict[str, Any]:
    db = get_mongo_db()
    if db is None:
        return {"configured": False, "connected": False, "error": None, "databaseName": get_mongo_db_name()}

    try:
        db.command("ping")
        return {"configured": True, "connected": True, "error": None, "databaseName": get_mongo_db_name()}
    except OperationFailure as exc:
        return {
            "configured": True,
            "connected": False,
            "error": "Authentication failed for the MongoDB URI. Check the username/password and database name in Atlas.",
            "databaseName": get_mongo_db_name(),
        }
    except Exception as exc:
        return {
            "configured": True,
            "connected": False,
            "error": f"Mongo connection failed: {exc}",
            "databaseName": get_mongo_db_name(),
        }


def get_collection_spec(collection_name: str) -> Optional[Dict[str, Any]]:
    for collection in MONGO_COLLECTIONS:
        if collection["collectionName"] == collection_name or collection["key"] == collection_name:
            return collection
    return None


def get_collection_count(collection_name: str) -> int:
    spec = get_collection_spec(collection_name)
    if spec is None:
        return 0

    db = get_mongo_db()
    if db is None:
        return 0

    return db[spec["collectionName"]].count_documents({})


def get_collection_preview(collection_name: str, limit: int = 5) -> List[Dict[str, Any]]:
    spec = get_collection_spec(collection_name)
    if spec is None:
        return []

    db = get_mongo_db()
    if db is None:
        return [spec["sampleDocument"]]

    collection = db[spec["collectionName"]]
    documents = list(collection.find({}, {"_id": 0}).limit(limit))
    return documents or [spec["sampleDocument"]]


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def upsert_mongo_user(
    *,
    user_id: int | str,
    name: str,
    email: str,
    role: str,
    is_verified: bool,
) -> bool:
    db = get_mongo_db()
    if db is None:
        return False

    users_collection = db["users"]
    now = _utc_now_iso()
    users_collection.update_one(
        {"email": email},
        {
            "$set": {
                "id": str(user_id),
                "name": name,
                "email": email,
                "role": role,
                "status": "active" if is_verified else "inactive",
                "is_verified": is_verified,
                "updatedAt": now,
            },
            "$setOnInsert": {
                "createdAt": now,
            },
        },
        upsert=True,
    )
    return True


def delete_mongo_user(email: str) -> bool:
    db = get_mongo_db()
    if db is None:
        return False

    db["users"].delete_one({"email": email})
    return True


def seed_collection_documents(replace: bool = False) -> Dict[str, int]:
    db = get_mongo_db()
    if db is None:
        raise RuntimeError("MongoDB is not configured")

    inserted_counts: Dict[str, int] = {}
    for collection in MONGO_COLLECTIONS:
        mongo_collection = db[collection["collectionName"]]
        if replace:
            mongo_collection.delete_many({})

        if mongo_collection.count_documents({}) == 0 or replace:
            sample_document = collection["sampleDocument"]

            if collection["key"] == "users":
                sample_documents = [
                    sample_document,
                    {
                        "id": "user_1002",
                        "name": "Analyst One",
                        "email": "analyst@clv.com",
                        "role": "analyst",
                        "status": "active",
                        "is_verified": True,
                        "createdAt": "2026-04-29T00:00:00Z",
                        "updatedAt": "2026-04-29T00:00:00Z",
                    },
                    {
                        "id": "user_1003",
                        "name": "Viewer One",
                        "email": "viewer@clv.com",
                        "role": "viewer",
                        "status": "active",
                        "is_verified": True,
                        "createdAt": "2026-04-29T00:00:00Z",
                        "updatedAt": "2026-04-29T00:00:00Z",
                    },
                ]
                mongo_collection.insert_many(sample_documents)
                inserted_counts[collection["collectionName"]] = len(sample_documents)
            else:
                mongo_collection.insert_one(sample_document)
                inserted_counts[collection["collectionName"]] = 1
        else:
            inserted_counts[collection["collectionName"]] = 0

    return inserted_counts
