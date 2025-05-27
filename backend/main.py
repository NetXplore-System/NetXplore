from fastapi import FastAPI # type: ignore      
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
import logging
from dotenv import load_dotenv
import os
from database import verify_connection, engine, Base
from wikipedia_router import router as wikipedia_router
from user_router import router as user_router
from analysis_router import router as analysis_router
from files_router import router as files_router
from auth_router import router as auth_router
from research_router import router as research_router
from history_router import router as history_router
from dashboard_router import router as dashboard_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()
origins = os.getenv("ALLOWED_ORIGINS", "").split(",") 
os.makedirs("./uploads/", exist_ok=True) 


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
app.include_router(dashboard_router) 