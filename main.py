from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

from routes import users
from routes import ml_routes
from routes import mongo

# Create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CLV Predictor API")

# Setup CORS so the React frontend can talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(ml_routes.router)
app.include_router(mongo.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to CLV Predictor API Backend"}

