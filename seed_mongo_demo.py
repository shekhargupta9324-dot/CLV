"""Seed basic demo documents into MongoDB so collections are visible in Compass/Atlas.

Usage:
  set MONGO_URI=mongodb://localhost:27017
  c:/Users/Admin/Desktop/AAYUSH/CLV-FINAL-year-project-/.venv/Scripts/python.exe backend/seed_mongo_demo.py

Optional:
  set MONGO_DB_NAME=clv_predictor
  set MONGO_REPLACE=1
"""

import os

from mongo_explorer_store import MONGO_COLLECTIONS, get_mongo_db, seed_collection_documents


def main() -> None:
    db = get_mongo_db()
    if db is None:
        raise SystemExit("MongoDB is not configured. Set MONGO_URI or MONGODB_URI first.")

    replace = os.getenv("MONGO_REPLACE", "0") in {"1", "true", "TRUE", "yes", "YES"}
    result = seed_collection_documents(replace=replace)

    print(f"Seeded database: {db.name}")
    for collection in MONGO_COLLECTIONS:
        name = collection["collectionName"]
        print(f"- {name}: {result.get(name, 0)} document(s) inserted")


if __name__ == "__main__":
    main()
