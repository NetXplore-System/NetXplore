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

@app.get("/analyze/triad-census/{filename}")
async def analyze_triad_census(
        filename: str,
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False)
):
    try:
        network_result = await analyze_network(
            filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize
        )

        if hasattr(network_result, 'body'):
            network_data = json.loads(network_result.body)
        else:
            network_data = network_result

        if "error" in network_data:
            return JSONResponse(content=network_data, status_code=400)

        DG = nx.DiGraph()

        for node in network_data["nodes"]:
            DG.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

        for link in network_data["links"]:
            source = link["source"]
            target = link["target"]

            if isinstance(source, dict) and "id" in source:
                source = source["id"]
            if isinstance(target, dict) and "id" in target:
                target = target["id"]

            DG.add_edge(source, target)

        triad_census = nx.triadic_census(DG)

        triad_census = {str(k): v for k, v in triad_census.items()}

        total_triads = sum(triad_census.values())

        for k in triad_census:
            triad_census[k] = {
                "count": triad_census[k],
                "percentage": round((triad_census[k] / total_triads) * 100, 2) if total_triads > 0 else 0
            }

        response = {
            "triad_census": triad_census,
            "total_triads": total_triads,
            "original_network": network_data
        }

        return JSONResponse(content=response, status_code=200)

    except Exception as e:
        print(f"Error in triad census: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.get("/analyze/triad-census/{filename}")
async def analyze_triad_census(
        filename: str,
        start_date: str = Query(None),
        start_time: str = Query(None),
        end_date: str = Query(None),
        end_time: str = Query(None),
        limit: int = Query(None),
        limit_type: str = Query("first"),
        min_length: int = Query(None),
        max_length: int = Query(None),
        keywords: str = Query(None),
        min_messages: int = Query(None),
        max_messages: int = Query(None),
        active_users: int = Query(None),
        selected_users: str = Query(None),
        username: str = Query(None),
        anonymize: bool = Query(False)
):
    try:
        network_result = await analyze_network(
            filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize
        )

        if hasattr(network_result, 'body'):
            network_data = json.loads(network_result.body)
        else:
            network_data = network_result

        if "error" in network_data:
            return JSONResponse(content=network_data, status_code=400)

        DG = nx.DiGraph()

        for node in network_data["nodes"]:
            DG.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

        for link in network_data["links"]:
            source = link["source"]
            target = link["target"]

            if isinstance(source, dict) and "id" in source:
                source = source["id"]
            if isinstance(target, dict) and "id" in target:
                target = target["id"]

            DG.add_edge(source, target)

        triad_census = nx.triadic_census(DG)

        triad_census = {str(k): v for k, v in triad_census.items()}

        total_triads = sum(triad_census.values())

        for k in triad_census:
            triad_census[k] = {
                "count": triad_census[k],
                "percentage": round((triad_census[k] / total_triads) * 100, 2) if total_triads > 0 else 0
            }

        response = {
            "triad_census": triad_census,
            "total_triads": total_triads,
            "original_network": network_data
        }

        return JSONResponse(content=response, status_code=200)

    except Exception as e:
        print(f"Error in triad census: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(content={"error": str(e)}, status_code=500)

