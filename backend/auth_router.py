import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import uuid4

import bcrypt
from jose import jwt , JWTError
from pydantic import BaseModel, EmailStr

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from database import get_db
from models import User
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


# Constants
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))

logger = logging.getLogger(__name__)
router = APIRouter()

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

class OAuthUser(BaseModel):
    name: str
    email: str
    avatar: str

@router.post("/api/auth/google")
async def google_auth(user: OAuthUser, db: AsyncSession = Depends(get_db)):
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



class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

@router.post("/register")
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
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


class UserLogin(BaseModel):
    email: EmailStr
    password: str
  
@router.post("/login")  
async def login_user(user: UserLogin, db: AsyncSession = Depends(get_db)):
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

