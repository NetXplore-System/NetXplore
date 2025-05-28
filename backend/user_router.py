import os
import logging

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, Field, EmailStr
import bcrypt
from database import get_db

from models import User
from auth_router import get_current_user
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

UPLOAD_FOLDER = "Uploads"

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/users")
async def get_all_users(db: AsyncSession = Depends(get_db)):
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
        
class UserUpdate(BaseModel):
    name: str = Field(None)
    email: EmailStr = Field(None)
    password: str = Field(None)


@router.put("/users/{user_id}")
async def update_user(user_id: str, user_update: UserUpdate, db: AsyncSession = Depends(get_db)):
    """Updates a user's details."""
    try:
        async with db as session:
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


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, db: AsyncSession = Depends(get_db)):
    """Deletes a user."""
    try:
        async with db as session:
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
    


@router.post("/upload-avatar")
async def upload_avatar(
    file: UploadFile = File(...), 
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
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

