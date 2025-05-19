from fastapi import FastAPI, HTTPException, File, UploadFile, Query, Depends, Request, BackgroundTasks, Form  # type: ignore      
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.responses import JSONResponse  # type: ignore
from fastapi.security import OAuth2PasswordBearer  # type: ignore
import json
import logging
import os
import re
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import community.community_louvain as community_louvain
# from community import best_partition, modularity  # type: ignore        
import networkx as nx  # type: ignore
import networkx.algorithms.community as nx_community  # type: ignore
from dotenv import load_dotenv
from jose import jwt, JWTError  # type: ignore
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession  # type: ignore
import bcrypt  # type: ignore
from sqlalchemy.future import select # type: ignore
from sqlalchemy import delete # type: ignore
from database import verify_connection, get_db, engine, async_session, Base
from typing import List, Optional, Dict, Tuple
from models import User, Research, ResearchFilter, NetworkAnalysis, Message, Comparisons
from utils import parse_date_time,detect_date_format,extract_data, anonymize_name, calculate_sequential_weights
from utils import apply_comparison_filters, get_node_id, find_common_nodes,mark_common_nodes,get_network_metrics
import uuid
from wikipedia_router import router as wikipedia_router
from user_router import router as user_router
from analysis_router import router as analysis_router
from files_router import router as files_router
from auth_router import router as auth_router
from research_router import router as research_router
from history_router import router as history_router



load_dotenv()
origins = os.getenv("ALLOWED_ORIGINS", "").split(",") 

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

UPLOAD_FOLDER = "./uploads/" 
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 


timestamp_pattern = r"\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4},?\s\d{1,2}:\d{2}(?::\d{2})?\b"

def delete_old_files():
    """Delete files older than 20 hours based on their timestamp in the filename."""
    now = datetime.now()

    for filename in os.listdir(UPLOAD_FOLDER):
        # Split the filename to extract the timestamp
        if "-" in filename and filename.endswith(".txt"):
            name, timestamp_str = filename.rsplit("-", 1)
            timestamp_str = timestamp_str.replace(".txt", "")

            try:
                # Convert the timestamp from milliseconds to a datetime object
                file_time = datetime.fromtimestamp(int(timestamp_str) / 1000)
                # Check if the file is older than 20 hours
                if now - file_time > timedelta(hours=20):
                    file_path = os.path.join(UPLOAD_FOLDER, filename)
                    os.remove(file_path)
                    logger.info(f"Deleted old file: {file_path}")
            except ValueError:
                logger.warning(f"Skipping file with invalid timestamp format: {filename}")



app = FastAPI()

@app.on_event("startup")
async def startup():
    await verify_connection()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(wikipedia_router)
app.include_router(user_router)
app.include_router(analysis_router)
app.include_router(history_router)
app.include_router(files_router)
app.include_router(auth_router)
app.include_router(research_router)





  

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

