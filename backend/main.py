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
from database import verify_connection
import database
from typing import List, Optional, Dict, Tuple
from models import User, Research, ResearchFilter, NetworkAnalysis, Message, Comparisons
from utils import parse_date_time,detect_date_format,extract_data, anonymize_name, calculate_sequential_weights
from utils import apply_comparison_filters, get_node_id, find_common_nodes,mark_common_nodes,get_network_metrics
import uuid
from wikipedia import router as wikipedia_router


load_dotenv()
origins = os.getenv("ALLOWED_ORIGINS", "").split(",") 

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

UPLOAD_FOLDER = "./uploads/" 
os.makedirs(UPLOAD_FOLDER, exist_ok=True) 

spam_messages = [
    "צורפו על ידי",
    "This message was deleted",
    "צורף/ה",
    "הצטרף/ה לקבוצה באמצעות קישור ההזמנה",
    "תמונת הקבוצה השתנתה על ידי",
    "תיאור הקבוצה שונה על ידי",
    "GIF הושמט",
    "סטיקר הושמט",
    "כרטיס איש קשר הושמט",
    "השמע הושמט",
    "סרטון הווידאו הושמט",
    "הוחלף למספר חדש. הקש/י כדי לשלוח הודעה או להוסיף מספר חדש.",
    "שם הקבוצה השתנה על ידי",
    "צירפת את"
    "הצטרף/ה"
    "צירף/ה"
    "התמונה הושמטה"
    "הודעה זו נמחקה"
    "צורפת על ידי" 
    "הקבוצה נוצרה על ידי"
    "ההודעה נמחקה על ידי"
    "ההודעות והשיחות מוצפנות מקצה לקצה. לאף אחד מחוץ לצ'אט הזה, גם לא ל-WhatsApp, אין אפשרות לקרוא אותן ולהאזין להן.",
    "הצטרפת לקבוצה דרך קישור הזמנה של הקבוצה"
]
MEDIA_RE = re.compile(r'\b(Media|image|video|GIF|sticker|Contact card) omitted\b', re.I)
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
    async with database.engine.begin() as conn:
        await conn.run_sync(database.Base.metadata.create_all)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

app.include_router(wikipedia_router)

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpdate(BaseModel):
    name: str = Field(None)
    email: EmailStr = Field(None)
    password: str = Field(None)


class OAuthUser(BaseModel):
    name: str
    email: str
    avatar: str



def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    """
    Decodes JWT token to extract current user data.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return {"user_id": user_id}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")



@app.post("/api/auth/google")
async def google_auth(user: OAuthUser, db: AsyncSession = Depends(database.get_db)):
    try:
        async with db as session:
            # Check if user exists
            stmt = select(User).where(User.email == user.email)
            result = await session.execute(stmt)
            existing_user = result.scalars().first()
            if existing_user:
                token = create_access_token(data={"user_id": str(existing_user.user_id)})
                return {
                    "access_token": token,
                    "token_type": "bearer",
                    "user": {
                        "id": str(existing_user.user_id),
                        "name": existing_user.name,
                        "email": existing_user.email,
                        "avatar": existing_user.avatar or "https://cdn-icons-png.flaticon.com/512/64/64572.png"
                    },
                }
            user_id = str(uuid4())
            new_user = User(
                user_id=user_id, 
                name=user.name, 
                email=user.email, 
                avatar=user.avatar,
                password=None  # OAuth users don't have passwords
            )
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)
            token = create_access_token(data={"user_id": str(new_user.user_id)})
            return {
                "access_token": token,
                "token_type": "bearer",
                "user": {
                    "id": str(new_user.user_id), 
                    "name": new_user.name, 
                    "email": new_user.email, 
                    "avatar": new_user.avatar
                },
            }
    except HTTPException as e:
        logger.error(f"HTTPException occurred during Google auth process: {e}")
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during Google authentication")




@app.post("/register")
async def register_user(user: UserCreate, db: AsyncSession = Depends(database.get_db)):
    try:
        async with db as session:
            # async with session.begin():
                # Check if email already exists
            stmt = select(User).where(User.email == user.email)
            result = await session.execute(stmt)
            existing_user = result.scalars().first()

            if existing_user:
                raise HTTPException(status_code=400, detail="Email already exists")

            # Hash the password
            hashed_password = bcrypt.hashpw(user.password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

            # Create and save the new user
            new_user = User(name=user.name, email=user.email, password=hashed_password)
            session.add(new_user)
            await session.commit()
            await session.refresh(new_user)

            token = create_access_token(data={"user_id": str(new_user.user_id)})

            return {
                    "user":{
                        "id": str(new_user.user_id), 
                        "name": new_user.name, 
                        "email": new_user.email,
                        "avatar": new_user.avatar or "https://cdn-icons-png.flaticon.com/512/64/64572.png"
                    },
                    "access_token": token,
                    "token_type": "bearer"
                }
    except HTTPException as e:
        logger.error(f"HTTPException occurred during registration process: {e}")
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during registration")



  
@app.post("/login")  
async def login_user(user: UserLogin, db: AsyncSession = Depends(database.get_db)):
    """Logs in a user and returns a JWT token."""
    try:
        async with db as session:
            try:
                # Query the user
                stmt = select(User).where(User.email == user.email)
                result = await session.execute(stmt)
                db_user = result.scalars().first()

                if not db_user:
                    raise HTTPException(
                        status_code=401, 
                        detail="Invalid email or password"
                    )

                try:
                    # Verify password
                    if not bcrypt.checkpw(
                        user.password.encode("utf-8"), 
                        db_user.password.encode("utf-8")
                    ):
                        raise HTTPException(
                            status_code=401, 
                            detail="Invalid email or password"
                        )

                    # Generate token
                    token = create_access_token(data={"user_id": str(db_user.user_id)})

                    return {
                        "access_token": token,
                        "token_type": "bearer",
                        "user": {
                            "id": str(db_user.user_id),
                            "name": db_user.name,
                            "email": db_user.email,
                            "avatar": db_user.avatar or "https://cdn-icons-png.flaticon.com/512/64/64572.png",
                        },
                    }

                except Exception as password_error:
                    logger.error(f"Password verification error: {password_error}")
                    raise HTTPException(
                        status_code=500,
                        detail="Error verifying password"
                    )

            except HTTPException as e:
                logger.error(f"HTTPException occurred during login process: {e}")
                raise
            except Exception as query_error:
                logger.error(f"Database query error: {query_error}")
                raise HTTPException(
                    status_code=500,
                    detail="Error querying database"
                )

    except HTTPException as e:
        logger.error(f"HTTPException occurred during login process: {e}")
        raise  
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during login"
        )
        
        
@app.get("/users")
async def get_all_users(db: AsyncSession = Depends(database.get_db)):
    try:
        async with db as session:
            result = await session.execute(select(User))
            users = result.scalars().all()
            return [{"id": str(user.user_id), "name": user.name, "email": user.email} for user in users]
    except HTTPException as e:
        logger.error(f"HTTPException occurred during fetching users: {e}")
        raise  
    except Exception as e:
        logger.error(f"Get users error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error during get users"
        )

@app.put("/users/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate, db: AsyncSession = Depends(database.get_db)):
    """Updates a user's details."""
    try:
        async with db as session:
            # async with session.begin():
            user = await session.get(User, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")

            update_data = user_update.dict(exclude_unset=True)
            if "password" in update_data:
                update_data["password"] = bcrypt.hashpw(update_data["password"].encode("utf-8"), bcrypt.gensalt()).decode(
                    "utf-8")

            for key, value in update_data.items():
                setattr(user, key, value)

            await session.commit()
            await session.refresh(user)

            return {
                "id": str(user.user_id),
                "name": user.name,
                "email": user.email,
                "avatar": user.avatar or "https://cdn-icons-png.flaticon.com/512/64/64572.png"
            }
    except HTTPException as e:
        logger.error(f"HTTPException occurred during user update: {e}")
        raise
    except Exception as e:
        logger.error(f"Update user error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during user update")


@app.delete("/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(database.get_db)):
    """Deletes a user."""
    try:
        async with db as session:
            # async with session.begin():
            user = await session.get(User, user_id)
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            await session.delete(user)
            await session.commit()
            return {"message": "User deleted successfully"}
    except HTTPException as e:
        logger.error(f"HTTPException occurred during user deletion: {e}")
        raise
    except Exception as e:
        logger.error(f"Delete user error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during user deletion")
    


@app.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...), 
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(database.get_db)
):
    """
    Uploads a new avatar for the authenticated user.
    """
    try:
        current_user = get_current_user(token)
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image")

        avatar_folder = os.path.join(UPLOAD_FOLDER, "avatars")
        os.makedirs(avatar_folder, exist_ok=True)
        avatar_filename = f"{current_user['user_id']}_{file.filename}"
        avatar_path = os.path.join(avatar_folder, avatar_filename)

        with open(avatar_path, "wb") as avatar_file:
            avatar_file.write(await file.read())

        avatar_url = f"/static/avatars/{avatar_filename}"
        
        async with db as session:
            user = await session.get(User, current_user["user_id"])
            if not user:
                raise HTTPException(status_code=404, detail="User not found")
            
            user.avatar = avatar_url
            await session.commit()
        
        return {"avatarUrl": avatar_url}
    except HTTPException as e:
        logger.error(f"HTTPException occurred during avatar upload: {e}")
        raise
    except Exception as e:
        logger.error(f"Avatar upload error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during avatar upload")


    
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())
                
        return JSONResponse(
            content={"message": "File uploaded successfully!", "filename": file.filename},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(detail=str(e), status_code=500)


@app.delete("/delete/{filename}")
async def delete_file(filename: str):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return JSONResponse(content={"message": f"File '{filename}' deleted successfully!"}, status_code=200)
        else:
            return JSONResponse(content={"error": f"File '{filename}' not found."}, status_code=404)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)



@app.get("/analyze/network/{filename}")
async def analyze_network(
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
        logger.info(f"Analyzing file: {filename}, Anonymization: {anonymize}, Limit Type: {limit_type}")
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            raise HTTPException(detail=f"File '{filename}' not found.", status_code=404)

        nodes = set()
        user_message_count = defaultdict(int)
        edges_counter = defaultdict(int)
        previous_sender = None
        anonymized_map = {}


        keyword_list = [kw.strip().lower() for kw in keywords.split(",")] if keywords else []
        selected_user_list = [user.strip().lower() for user in selected_users.split(",")] if selected_users else []
        start_datetime = None
        end_datetime = None


        try:
            start_datetime = parse_date_time(start_date, start_time)
            end_datetime = parse_date_time(end_date, end_time)
        except ValueError as e:
            logger.error(f"Error parsing date/time: {e}")
            raise HTTPException(detail=str(e), status_code=400)

            
        logger.info(f"🔹 Converted: start_datetime={start_datetime}, end_datetime={end_datetime}")

        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        
        date_formats = detect_date_format(lines[0])
        filtered_lines = []
        current_message = ""
        current_datetime = None

        for line in lines:
            line = re.sub(r"[\u200f\u202f\u202a\u202b\u202c\u202d\u202e\u200d]", "", line).strip()
            match = re.search(timestamp_pattern, line)

            if match:
                date_part = match.group()
                parsed = False
                for fmt in date_formats:
                    try:
                        dt = datetime.strptime(date_part, fmt)
                        parsed = True
                        break
                    except ValueError:
                        continue
                if not parsed:
                    continue

                if not ": " in line:
                    continue
                if any(spam in line for spam in spam_messages):
                    continue
                if MEDIA_RE.search(line):
                    continue

                if current_message and current_datetime:
                    if (not start_datetime or current_datetime >= start_datetime) and \
                    (not end_datetime or current_datetime <= end_datetime):
                        filtered_lines.append(current_message.strip())

                current_message = line
                current_datetime = dt
            else:
                if current_datetime:
                    current_message += " " + line.strip()

        if current_message and current_datetime:
            if (not start_datetime or current_datetime >= start_datetime) and \
            (not end_datetime or current_datetime <= end_datetime):
                filtered_lines.append(current_message.strip())

        
        if limit_type == "last":
            selected_lines = filtered_lines[::-1]
        else:
            selected_lines = filtered_lines

        logger.info(f"🔹 Processing {len(selected_lines)} messages (Limit Type: {limit_type})")

        for i, line in enumerate(selected_lines):
            match = re.search(timestamp_pattern, line)
            try:
                timestamp = match.group()
                message_part = line.split(timestamp, 1)[1].strip(" -[]")
                sender, message_content = message_part.split(": ", 1)
                sender = sender.strip("~").replace("\u202a", "").strip()
                message_length = len(message_content)
                if (min_length and message_length < min_length) or (max_length and message_length > max_length):
                    logger.info(f"🔹 Message length {message_length} is out of bounds ({min_length}, {max_length}) index: {i}")
                    continue

                if username and sender.lower() != username.lower():
                    logger.info(f"🔹 Sender {sender} does not match username {username}. index: {i}")
                    continue

                if keywords and not any(kw in message_content.lower() for kw in keyword_list):
                    logger.info(f"🔹 Message does not contain keywords: {message_content}. index: {i}")
                    continue

                logger.info(f"🔹 Sender: {sender}, Message: {message_content}, line: {line}")

                user_message_count[sender] += 1
                
                if sender:
                    if anonymize:
                        sender = anonymize_name(sender, anonymized_map)

                    nodes.add(sender)
                    if previous_sender and previous_sender != sender:
                        edge = tuple(sorted([previous_sender, sender]))
                        edges_counter[edge] += 1
                    previous_sender = sender
                    
                if limit and sum(user_message_count.values()) >= limit:
                    logger.info(f"🔹 Reached limit of {limit} messages")
                    break
                    
            except Exception as e:
                logger.error(f"Error processing line: {line.strip()} - {e}. index: {i}")
                continue
            
        logger.info(f'🔹 Found {user_message_count} ')

        filtered_users = {
            user: count for user, count in user_message_count.items()
            if (not min_messages or count >= min_messages) and (not max_messages or count <= max_messages)
        }

        if active_users:
            sorted_users = sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)[:active_users]
            filtered_users = dict(sorted_users)

        if selected_users:
            filtered_users = {user: count for user, count in filtered_users.items()
                              if user.lower() in selected_user_list}

        filtered_nodes = set(filtered_users.keys())
        if anonymize:
            filtered_nodes = {anonymize_name(node, anonymized_map) for node in filtered_nodes}

        G = nx.Graph()
        G.add_nodes_from(filtered_nodes)
        
        if G.number_of_nodes() == 0:
            logger.error("Warning: The graph is empty. No connectivity or centrality metrics can be calculated.")
            raise HTTPException(detail="The graph is empty. No data to analyze.", status_code=400)
            
        for (source, target), weight in edges_counter.items():
            if source in filtered_nodes and target in filtered_nodes:
                G.add_edge(source, target, weight=weight)

        degree_centrality = nx.degree_centrality(G)
        betweenness_centrality = nx.betweenness_centrality(G, weight="weight", normalized=True)
        if not nx.is_connected(G):
            logger.warning("Warning: The graph is not fully connected. Betweenness centrality might be inaccurate.")

        if nx.is_connected(G):
            closeness_centrality = nx.closeness_centrality(G)
            eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
            pagerank_centrality = nx.pagerank(G, alpha=0.85)
        else:
            largest_cc = max(nx.connected_components(G), key=len)
            G_subgraph = G.subgraph(largest_cc).copy()
            closeness_centrality = nx.closeness_centrality(G_subgraph)
            eigenvector_centrality = nx.eigenvector_centrality(G_subgraph, max_iter=1000)
            pagerank_centrality = nx.pagerank(G_subgraph, alpha=0.85)

        nodes_list = [
            { 
                "id": node,
                "messages": user_message_count.get(node, 0),
                "degree": round(degree_centrality.get(node, 0), 4),
                "betweenness": round(betweenness_centrality.get(node, 0), 4),
                "closeness": round(closeness_centrality.get(node, 0), 4),
                "eigenvector": round(eigenvector_centrality.get(node, 0), 4),
                "pagerank": round(pagerank_centrality.get(node, 0), 4),
            }
            for node in filtered_nodes
        ]

        links_list = []
        for edge, weight in edges_counter.items():
            source, target = edge

            if anonymize:
                source = anonymized_map.get(source, source)
                target = anonymized_map.get(target, target)

            if source in filtered_nodes and target in filtered_nodes:
                links_list.append({
                    "source": source,
                    "target": target,
                    "weight": weight
                })
        return JSONResponse(content={"nodes": nodes_list, "links": links_list}, status_code=200)
    except Exception as e:
        logger.error("Error:", e)
        raise HTTPException(detail=str(e), status_code=500)



@app.get("/analyze/decaying-network/{filename}")
async def analyze_decaying_network(
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
    anonymize: bool = Query(False),
    n_prev: int = Query(3)
):
    try:
       
        selected_user_list = [u.strip().lower() for u in selected_users.split(",")] if selected_users else []
        
        file_path = os.path.join(UPLOAD_FOLDER, filename)
        if not os.path.exists(file_path):
            logger.error(f"File '{filename}' not found.")
            raise HTTPException(status_code=404, detail=f"File '{filename}' not found.")
        
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        try:
            start_datetime = parse_date_time(start_date, start_time)
            end_datetime = parse_date_time(end_date, end_time)
        except ValueError as e:
            logger.error(f"Error parsing date/time: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        date_formats = detect_date_format(lines[0])
        
        selected_messages = await extract_data(
            lines,
            start_datetime,
            end_datetime,
            limit,
            limit_type,
            min_length,
            max_length,
            keywords,
            min_messages,
            max_messages,
            active_users,
            selected_users,
            username,
            anonymize,
            date_formats,
            True
        )
        
        logger.info(f"found {len(selected_messages)} messages after filtering")
        if not selected_messages:
            logger.error("No messages found after filtering.")
            raise HTTPException(status_code=400, detail="No messages found after filtering.")
        
        seq_weights = calculate_sequential_weights(selected_messages, n_prev)

        user_counts: Dict[str, int] = defaultdict(int)
        for sender, _ in selected_messages:
            user_counts[sender] += 1

        filtered_users = {u: c for u, c in user_counts.items()
                          if (not min_messages or c >= min_messages)
                          and (not max_messages or c <= max_messages)}
        if active_users:
            top = sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)[:active_users]
            filtered_users = dict(top)
        if selected_user_list:
            filtered_users = {u: c for u, c in filtered_users.items()
                              if u.lower() in selected_user_list}

        filtered_nodes = set(filtered_users.keys())

        G = nx.Graph()
        G.add_nodes_from(filtered_nodes)
        if not filtered_nodes:
            raise HTTPException(status_code=400, detail="No data to analyze after filtering.")

        for (prev, curr), w in seq_weights.items():
            if prev in filtered_nodes and curr in filtered_nodes:
                G.add_edge(prev, curr, weight=round(w, 2))

        deg = nx.degree_centrality(G)
        btw = nx.betweenness_centrality(G, weight="weight", normalized=True)
        if nx.is_connected(G):
            cls = nx.closeness_centrality(G)
            eig = nx.eigenvector_centrality(G, max_iter=1000)
            pr = nx.pagerank(G, alpha=0.85)
        else:
            comp = max(nx.connected_components(G), key=len)
            sub = G.subgraph(comp).copy()
            cls = nx.closeness_centrality(sub)
            eig = nx.eigenvector_centrality(sub, max_iter=1000)
            pr = nx.pagerank(sub, alpha=0.85)

        nodes_list = [
            {"id": u, "messages": user_counts.get(u, 0),
             "degree": round(deg.get(u, 0), 4),
             "betweenness": round(btw.get(u, 0), 4),
             "closeness": round(cls.get(u, 0), 4),
             "eigenvector": round(eig.get(u, 0), 4),
             "pagerank": round(pr.get(u, 0), 4)}
            for u in filtered_nodes
        ]

        links_list = [
            {"source": prev, "target": curr, "weight": w}
            for (prev, curr), w in seq_weights.items()
            if prev in filtered_nodes and curr in filtered_nodes
        ]

        return JSONResponse(content={"nodes": nodes_list, "links": links_list}, status_code=200)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error in decaying network analysis:", e)
        raise HTTPException(status_code=500, detail=str(e))





@app.get("/analyze/compare-networks")
async def analyze_network_comparison(
        original_filename: str = Query(...),
        comparison_filename: str = Query(...),
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
        anonymize: bool = Query(False),
        min_weight: int = Query(1),
        node_filter: str = Query(""),
        highlight_common: bool = Query(False),
        metrics: str = Query(None)
):
    try:
        logger.info(f"Analyzing comparison between {original_filename} and {comparison_filename}")

        original_result = await analyze_network(
            original_filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize
        )

        comparison_result = await analyze_network(
            comparison_filename, start_date, start_time, end_date, end_time,
            limit, limit_type, min_length, max_length, keywords,
            min_messages, max_messages, active_users, selected_users,
            username, anonymize
        )

        if hasattr(original_result, 'body'):
            original_data = json.loads(original_result.body)
        else:
            original_data = original_result

        if hasattr(comparison_result, 'body'):
            comparison_data = json.loads(comparison_result.body)
        else:
            comparison_data = comparison_result

        filtered_original = apply_comparison_filters(original_data, node_filter, min_weight)
        filtered_comparison = apply_comparison_filters(comparison_data, node_filter, min_weight)

        if highlight_common:
            common_nodes = find_common_nodes(filtered_original, filtered_comparison)
            mark_common_nodes(filtered_original, common_nodes)
            mark_common_nodes(filtered_comparison, common_nodes)

        return JSONResponse(content={
            "original": filtered_original,
            "comparison": filtered_comparison,
            "metrics": get_network_metrics(filtered_original, filtered_comparison, metrics)
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in network comparison: {e}")
        raise HTTPException(detail=str(e), status_code=500)


@app.get("/analyze/communities/{filename}")
async def analyze_communities(
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
        anonymize: bool = Query(False),
        algorithm: str = Query("louvain")
):
    try:
        network_result = await analyze_network(
            filename, start_date, start_time, end_date, end_time, limit, limit_type,
            min_length, max_length, keywords, min_messages, max_messages,
            active_users, selected_users, username, anonymize
        )

        if hasattr(network_result, 'body'):
            network_data = json.loads(network_result.body)
        else:
            network_data = network_result

        if "error" in network_data:
            logger.error(f"Error in network analysis: {network_data['error']}")
            raise HTTPException(detail=network_data["error"], status_code=400)

        G = nx.Graph()

        if not network_data["links"]:
            logger.error("No links found in the input data.")
            return JSONResponse(
                content={
                    "nodes": network_data["nodes"],
                    "links": [],
                    "communities": [],
                    "node_communities": {},
                    "algorithm": algorithm,
                    "num_communities": 0,
                    "modularity": None,
                    "warning": "No links found in the input data."
                },
                status_code=200
            )

        for node in network_data["nodes"]:
            G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

        for link in network_data["links"]:
            source = link["source"]
            target = link["target"]
            weight = link.get("weight", 1)

            if isinstance(source, dict) and "id" in source:
                source = source["id"]
            if isinstance(target, dict) and "id" in target:
                target = target["id"]

            G.add_edge(source, target, weight=weight)

        communities = {}
        node_communities = {}

        if algorithm == "louvain":
            partition = community_louvain.best_partition(G)
            node_communities = partition

            for node, community_id in partition.items():
                if community_id not in communities:
                    communities[community_id] = []
                communities[community_id].append(node)

        elif algorithm == "girvan_newman":
            communities_iter = nx_community.girvan_newman(G)
            communities_list = list(next(communities_iter))

            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i

        elif algorithm == "greedy_modularity":
            communities_list = list(nx_community.greedy_modularity_communities(G))

            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i
        else:
            raise HTTPException(
                detail=f"Unknown algorithm: {algorithm}. Supported: louvain, girvan_newman, greedy_modularity",
                status_code=400
            )
            

        communities_list = [
            {
                "id": community_id,
                "size": len(nodes),
                "nodes": nodes,
                "avg_betweenness": sum(network_data["nodes"][i]["betweenness"]
                                       for i, node in enumerate(network_data["nodes"])
                                       if node["id"] in nodes) / len(nodes) if nodes else 0,
                "avg_pagerank": sum(network_data["nodes"][i]["pagerank"]
                                    for i, node in enumerate(network_data["nodes"])
                                    if node["id"] in nodes) / len(nodes) if nodes else 0,
            }
            for community_id, nodes in communities.items()
        ]

        communities_list.sort(key=lambda x: x["size"], reverse=True)

        for i, node in enumerate(network_data["nodes"]):
            node_id = node["id"]
            if node_id in node_communities:
                network_data["nodes"][i]["community"] = node_communities[node_id]

        return JSONResponse(content={
            "nodes": network_data["nodes"],
            "links": network_data["links"],
            "communities": communities_list,
            "node_communities": node_communities,
            "algorithm": algorithm,
            "num_communities": len(communities),
            "modularity": community_louvain.modularity(node_communities, G) if algorithm == "louvain" else None
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in community detection: {e}")
        raise HTTPException(detail=str(e), status_code=500)

class CommunityAnalysisData(BaseModel):
    nodes: List[dict]
    links: List[dict]
    algorithm: str = Query("louvain")

@app.post("/history/analyze/communities") 
async def analyze_communities_history(
        data: CommunityAnalysisData
):
    try:    
        algorithm = data.algorithm
    
        G = nx.Graph()

        for node in data.nodes:
            G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

        for link in data.links:
            source = link["source"]
            target = link["target"]
            weight = link.get("weight", 1)

            if isinstance(source, dict) and "id" in source:
                source = source["id"]
            if isinstance(target, dict) and "id" in target:
                target = target["id"]

            G.add_edge(source, target, weight=weight)

        communities = {}
        node_communities = {}

        if algorithm == "louvain":
            partition = community_louvain.best_partition(G)
            node_communities = partition

            for node, community_id in partition.items():
                if community_id not in communities:
                    communities[community_id] = []
                communities[community_id].append(node)

        elif algorithm == "girvan_newman":
            communities_iter = nx_community.girvan_newman(G)
            communities_list = list(next(communities_iter))

            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i

        elif algorithm == "greedy_modularity":
            communities_list = list(nx_community.greedy_modularity_communities(G))

            for i, community in enumerate(communities_list):
                communities[i] = list(community)
                for node in community:
                    node_communities[node] = i
        else:
            logger.error(f"Unknown algorithm: {algorithm}. Supported: louvain, girvan_newman, greedy_modularity")
            raise HTTPException(
                detail=f"Unknown algorithm: {algorithm}. Supported: louvain, girvan_newman, greedy_modularity",
                status_code=400
            )

        communities_list = [
            {
                "id": community_id,
                "size": len(nodes),
                "nodes": nodes,
                "avg_betweenness": sum(data.nodes[i]["betweenness"]
                                       for i, node in enumerate(data.nodes)
                                       if node["id"] in nodes) / len(nodes) if nodes else 0,
                "avg_pagerank": sum(data.nodes[i]["pagerank"]
                                    for i, node in enumerate(data.nodes)
                                    if node["id"] in nodes) / len(nodes) if nodes else 0,
            }
            for community_id, nodes in communities.items()
        ]

        communities_list.sort(key=lambda x: x["size"], reverse=True)

        for i, node in enumerate(data.nodes):
            node_id = node["id"]
            if node_id in node_communities:
                data.nodes[i]["community"] = node_communities[node_id]

        return JSONResponse(content={
            "nodes": data.nodes,
            "links": data.links,
            "communities": communities_list,
            "node_communities": node_communities,
            "algorithm": algorithm,
            "num_communities": len(communities),
            "modularity": community_louvain.modularity(node_communities, G) if algorithm == "louvain" else None
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in community detection: {e}")
        raise HTTPException(detail=str(e), status_code=500)




class NetworkAnalysisData(BaseModel):
    nodes: List[dict]
    links: List[dict]
    metric_name: Optional[str] = None

@app.post("/save-research")
async def save_research(
    file_name: str = Form(...),
    researcher_id: str = Form(...),
    research_name: str = Form(...),
    description: Optional[str] = Form(None),
    comparison: Optional[str] = Form(None),
    platform: str = Form(...),
    selected_metric: str = Form(None),
    start_date: str = Query(None),
    end_date: str = Query(None), 
    start_time: str = Query(None),
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
    anonymize: bool = Query(False),
    algorithm: str = Query("louvain"),
    db: AsyncSession = Depends(database.get_db)
):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, file_name)
        if not os.path.exists(file_path):
            logger.error(f"File '{file_name}' not found.")
            raise HTTPException(status_code=404, detail=f"File '{file_name}' not found.")
        
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        try:
            start_datetime = parse_date_time(start_date, start_time)
            end_datetime = parse_date_time(end_date, end_time)
        except ValueError as e:
            logger.error(f"Error parsing date/time: {e}")
            raise HTTPException(status_code=400, detail=str(e))

        date_formats = detect_date_format(lines[0])
        

        data = await extract_data(
            lines,
            start_datetime,
            end_datetime,
            limit,
            limit_type,
            min_length,
            max_length,
            keywords,
            min_messages,
            max_messages,
            active_users,
            selected_users,
            username,
            anonymize,
            date_formats,
        )

        # logger.info(f"🔹 Messages: {data['messages']}")
        # return JSONResponse(content={"data": data},
        # status_code=200)
        new_research = Research(
            research_name=research_name,
            description=description,
            user_id=researcher_id,
            platform=platform,
            # created_at=datetime.datetime.utcnow()
        )
        db.add(new_research)
        await db.commit()
        await db.refresh(new_research)

        for message in data["messages"]:
            new_message = Message(
                research_id=new_research.research_id,
                message_text=message[1],
                send_by=message[0],
                # created_at=datetime.datetime.utcnow()
            )
            db.add(new_message)
        await db.commit()


        new_filter = ResearchFilter(
            research_id=new_research.research_id,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time,  
            end_time=end_time,
            message_limit=limit,
            limit_type=limit_type,
            min_message_length=min_length,
            max_message_length=max_length,
            keywords=keywords,
            min_messages=min_messages,
            max_messages=max_messages,
            top_active_users=active_users,
            selected_users=selected_users,
            filter_by_username=username,
            anonymize=anonymize,
            algorithm=algorithm
        )
        db.add(new_filter) 

        new_analysis = NetworkAnalysis(
            research_id=new_research.research_id,
            nodes=data['nodes'],
            links=data['links'],
            is_connected=data['is_connected'],
            metric_name=selected_metric
        )
        db.add(new_analysis)
        await db.commit()
        await db.refresh(new_analysis)

        # Handle comparison data if present
        if comparison:
            try:
                comparison_data = json.loads(comparison)
                if isinstance(comparison_data, list):
                    # Handle multiple comparisons
                    for comp_data in comparison_data:
                        logger.info(f"🔹 Comparison Data: {comp_data}")
                        new_comparison = Comparisons(
                            research_id=new_research.research_id,
                            original_analysis=new_analysis.id,
                            nodes=comp_data.get('nodes', []),
                            links=comp_data.get('links', []),
                            is_connected=comp_data.get('is_connected', True)
                        )
                        db.add(new_comparison)
                elif isinstance(comparison_data, dict):
                    # Handle single comparison
                    new_comparison = Comparisons(
                        research_id=new_research.research_id,
                        original_analysis=new_analysis.id,
                        nodes=comparison_data.get('nodes', []),
                        links=comparison_data.get('links', []),
                        is_connected=comparison_data.get('is_connected', True)
                    )
                    db.add(new_comparison)
                
                await db.commit()
            except json.JSONDecodeError:
                logger.error(f"Invalid comparison data format: {comparison}")
                # Continue without saving comparison data
                pass

        return {
            "message": "Data saved successfully", 
            "research_id": str(new_research.research_id)
        }

    except Exception as e:
        logger.error(f"Error saving data: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving data: {str(e)}")


@app.get("/history/{user_id}")
async def get_user_history(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Get all research history for a user including filters, analysis and comparisons."""
    try:
        # Convert string user_id to UUID
        user_uuid = uuid.UUID(user_id)

        # Ensure user_id matches current user's ID
        if str(user_uuid) != current_user["user_id"]:
            raise HTTPException(
                status_code=403,
                detail="Access forbidden: You can only view your own research history"
            )
        
        # Query all research entries for the user
        query = select(Research).where(Research.user_id == user_uuid)
        result = await db.execute(query)
        researches = result.scalars().all()
        
        # Prepare response data
        history = []
        
        for research in researches:
            # Get research filters
            filter_query = select(ResearchFilter).where(
                ResearchFilter.research_id == research.research_id
            )
            filter_result = await db.execute(filter_query)
            filters = filter_result.scalars().first()
            
            # Get network analysis
            analysis_query = select(NetworkAnalysis).where(
                NetworkAnalysis.research_id == research.research_id
            )
            analysis_result = await db.execute(analysis_query)
            analysis = analysis_result.scalars().first()
            
            # Get comparisons if they exist
            comparison_query = select(Comparisons).where(
                Comparisons.research_id == research.research_id
            )
            comparison_result = await db.execute(comparison_query)
            comparisons = comparison_result.scalars().all()
            
            # Build complete research entry
            research_entry = {
                **research.to_dict(),
                "filters": filters.to_dict() if filters else None,
                "analysis": analysis.to_dict() if analysis else None,
                "comparisons": [comp.to_dict() for comp in comparisons] if comparisons else []
            }
            
            history.append(research_entry) 
        
        return JSONResponse(
            content={
                "status": "success",
                "history": history,
            },
            status_code=200
        )
            
    except ValueError as ve:
        logger.error(f"Invalid UUID format: {ve}")
        raise HTTPException(
            status_code=400,
            detail="Invalid user ID format"
        )
    except Exception as e:
        logger.error(f"Error fetching user history: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching history: {str(e)}"
        )

@app.delete("/research/{research_id}")
async def delete_research(
    research_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    """Delete a research and all its related data"""
    try:
        # Verify research exists and belongs to current user
        research = await db.get(Research, research_id)
        if not research:
            raise HTTPException(status_code=404, detail="Research not found")
        if str(research.user_id) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized to delete this research")

        # Delete comparisons first
        await db.execute(
            delete(Comparisons)
            .where(Comparisons.research_id == research_id)
        )

        # Delete network analysis
        await db.execute(
            delete(NetworkAnalysis)
            .where(NetworkAnalysis.research_id == research_id)
        )

        # Delete research filters
        await db.execute(
            delete(ResearchFilter)
            .where(ResearchFilter.research_id == research_id)
        )

        # Delete messages
        await db.execute(
            delete(Message)
            .where(Message.research_id == research_id)
        )

        # Finally delete the research itself
        await db.execute(
            delete(Research)
            .where(Research.research_id == research_id)
        )

        await db.commit()

        return JSONResponse(
            content={"message": f"Research {research_id} and all related data deleted successfully"},
            status_code=200
        )

    except HTTPException as he:
        logger.error(f"Error deleting research: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Error deleting research: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error deleting research: {str(e)}"
        )
    
  

@app.get("/history/analyze/compare")
async def analyze_network_comparison_history(
        research_id: str = Query(...),
        min_weight: int = Query(1),
        node_filter: str = Query(""),
        highlight_common: bool = Query(False),
        metrics: str = Query(None),
        comparison_index: int = Query(0),
        db: AsyncSession = Depends(database.get_db)
):
    try:
       
        research = await db.get(Research, research_id)
        if not research:
            raise HTTPException(status_code=404, detail="Research not found")
        
        
        analysis_query = select(NetworkAnalysis).where(NetworkAnalysis.research_id == research_id)
        original_result = await db.execute(analysis_query)
        original_data = original_result.scalars().first()

        # Extract the comparison data
        comparison_query = select(Comparisons).where(Comparisons.research_id == research_id)
        comparison_result = await db.execute(comparison_query)
        comparison_data = comparison_result.scalars().all()

        # Convert to dictionary if necessary
        if original_data:
            original_data = original_data.to_dict()
        if comparison_index < 0 or comparison_index >= len(comparison_data):
            raise HTTPException(status_code=404, detail="Comparison index out of range")

        specific_comparison = comparison_data[comparison_index].to_dict()

        filtered_original = apply_comparison_filters(original_data, node_filter, min_weight)
        filtered_comparison = apply_comparison_filters(specific_comparison, node_filter, min_weight)

        if highlight_common:
            common_nodes = find_common_nodes(filtered_original, filtered_comparison)
            mark_common_nodes(filtered_original, common_nodes)
            mark_common_nodes(filtered_comparison, common_nodes)

        return JSONResponse(content={
            "original": filtered_original,
            "comparison": filtered_comparison,
            "metrics": get_network_metrics(filtered_original, filtered_comparison, metrics)
        }, status_code=200)

    except Exception as e:
        logger.error(f"Error in network comparison: {e}")
        raise HTTPException(detail=str(e), status_code=500)



@app.put("/research/{research_id}")
async def update_research_data(
    research_id: str,
    updated_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(database.get_db)
):
    try:
        # --- 1. Validation & permissions ---
        research = await db.get(Research, research_id)
        if not research:
            raise HTTPException(status_code=404, detail="Research not found")
        if str(research.user_id) != current_user["user_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")

        # --- 2. File existence check ---
        file_name = updated_data.get("file_name")
        file_path = os.path.join(UPLOAD_FOLDER, file_name)
        if not os.path.exists(file_path):
            logger.error(f"File '{file_name}' not found.")
            raise HTTPException(status_code=404, detail=f"File '{file_name}' not found.")
            

        # --- 3. Extract messages and network data ---
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        filters_data = {
            **updated_data.get("filters", {}), 
            "limit": int(updated_data.get("filters", {}).get("message_limit") or 0),
            "min_length": int(updated_data.get("filters", {}).get("min_message_length") or 0),
            "max_length": int(updated_data.get("filters", {}).get("max_message_length") or 0),
            "active_users": int(updated_data.get("filters", {}).get("top_active_users") or 0),
            "min_messages": int(updated_data.get("filters", {}).get("min_messages") or 0),
            "max_messages": int(updated_data.get("filters", {}).get("max_messages") or 0),
            "username": updated_data.get("filters", {}).get("filter_by_username"),
        }

        filters_data.pop("message_limit")
        filters_data.pop("min_message_length")
        filters_data.pop("max_message_length")
        filters_data.pop("top_active_users")
        filters_data.pop("filter_by_username")
        filters_data.pop("algorithm")

        new_data = await extract_data(lines, **filters_data)

        # --- 4. Update Research (name, description, file_name) ---
        research.research_name = updated_data.get("research_name", research.research_name)
        research.description = updated_data.get("description", research.description)
        research.file_name = file_name or research.file_name

        # --- 5. Update or Create Filters ---
        filter_query = select(ResearchFilter).where(ResearchFilter.research_id == research.research_id)
        filter_result = await db.execute(filter_query)
        filters = filter_result.scalars().first()

        INT_FIELDS = [
            "message_limit", "min_message_length", "max_message_length",
            "min_messages", "max_messages", "top_active_users"
        ]

        if filters:
            for key, value in updated_data.get("filters", {}).items():
                if key in INT_FIELDS and value != "" and value is not None:
                    setattr(filters, key, int(value))
                elif key not in INT_FIELDS:
                    setattr(filters, key, value)
        else:
            filters = ResearchFilter(
                research_id=research.research_id,
                **updated_data.get("filters", {})
            )
            db.add(filters)


        # --- 6. Replace all Messages ---
        await db.execute(delete(Message).where(Message.research_id == research.research_id))
        db.add_all([
            Message(research_id=research.research_id, **{"send_by": msg[0], "message_text": msg[1]})
            for msg in new_data["messages"]
        ])

        # --- 7. Update or Create Analysis ---
        analysis_query = select(NetworkAnalysis).where(NetworkAnalysis.research_id == research.research_id)
        analysis_result = await db.execute(analysis_query)
        analysis = analysis_result.scalars().first()

        if analysis:
            analysis.nodes = new_data["nodes"]
            analysis.links = new_data["links"]
            analysis.is_connected = new_data["is_connected"]
        else:
            analysis = NetworkAnalysis(
                research_id=research.research_id,
                nodes=new_data["nodes"],
                links=new_data["links"],
                is_connected=new_data["is_connected"]
            )
            db.add(analysis)

        # --- 8. Get Comparisons (Read only) ---
        comparisons_query = select(Comparisons).where(Comparisons.research_id == research.research_id)
        comparisons_result = await db.execute(comparisons_query)
        comparisons = comparisons_result.scalars().all()

        await db.commit()

        # --- 9. Build final response ---
        research_entry = {
            **research.to_dict(),
            "filters": filters.to_dict() if filters else None,
            "analysis": analysis.to_dict() if analysis else None,
            "comparisons": [comp.to_dict() for comp in comparisons] if comparisons else []
        }

        return JSONResponse(
            content={
                "status": "success",
                "message": "Research updated successfully",
                "data": research_entry
            },
            status_code=200
        )

    except HTTPException as he:
        logger.error(f"Error updating research data: {str(he.detail)}")
        raise he
    except Exception as e:
        logger.error(f"Error updating research data: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

