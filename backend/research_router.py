import os
import json
import logging
from typing import List, Optional
from datetime import datetime

from fastapi import APIRouter, Form, Query, Depends, HTTPException
from fastapi.responses import JSONResponse

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import delete

from pydantic import BaseModel

from database import get_db
from models import Research, Message, ResearchFilter, NetworkAnalysis, Comparisons
from utils import  extract_data
from auth_router import get_current_user
from analysis_router import analyze_network
from analysis_router import analyze_network

UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./uploads/")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

logger = logging.getLogger(__name__)

router = APIRouter()

class NetworkAnalysisData(BaseModel):
    nodes: List[dict]
    links: List[dict]
    metric_name: Optional[str] = None

@router.post("/save-research")
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
    include_messages: bool = Query(True),
    directed: bool = Query(False),
    use_history: bool = Query(False),
    normalize: bool = Query(False),
    history_length: int = Query(3),
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, file_name)
        if not os.path.exists(file_path):
            logger.error(f"File '{file_name}' not found.")
            raise HTTPException(status_code=404, detail=f"File '{file_name}' not found.")
        

        data = await analyze_network(
            filename=file_name,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            limit_type=limit_type,
            min_length=min_length,
            max_length=max_length,
            keywords=keywords,
            min_messages=min_messages,
            max_messages=max_messages,
            active_users=active_users,
            selected_users=selected_users,
            username=username,
            anonymize=anonymize,
            directed=directed,
            use_history=use_history,
            normalize=normalize,
            history_length=history_length,
            is_for_save=True
        )
        
        
        data = json.loads(data.body)
        logger.info(f"🔹 Data received from analysis: {data}")
        if not data or "nodes" not in data or "links" not in data:
            logger.error("Invalid data format received from analysis.")
            raise HTTPException(status_code=400, detail="Invalid data format received from analysis.")
        
        logger.info(f"🔹 Data extracted successfully")
        

        data = await analyze_network(
            filename=file_name,
            start_date=start_date,
            end_date=end_date,
            start_time=start_time,
            end_time=end_time,
            limit=limit,
            limit_type=limit_type,
            min_length=min_length,
            max_length=max_length,
            keywords=keywords,
            min_messages=min_messages,
            max_messages=max_messages,
            active_users=active_users,
            selected_users=selected_users,
            username=username,
            anonymize=anonymize,
            directed=directed,
            use_history=use_history,
            normalize=normalize,
            history_length=history_length,
            is_for_save=True
        )
        
        
        data = json.loads(data.body)
        logger.info(f"🔹 Data received from analysis: {data}")
        if not data or "nodes" not in data or "links" not in data:
            logger.error("Invalid data format received from analysis.")
            raise HTTPException(status_code=400, detail="Invalid data format received from analysis.")
        
        logger.info(f"🔹 Data extracted successfully")
        
        new_research = Research(
            research_name=research_name,
            description=description,
            user_id=researcher_id,
            platform=platform,
            created_at=datetime.utcnow()
        )
        db.add(new_research)
        await db.commit()
        await db.refresh(new_research)

        if include_messages:
        if include_messages:
            for message in data["messages"]:
                new_message = Message(
                    research_id=new_research.research_id,
                    message_text=message[1],
                    send_by=message[0],
                    created_at=datetime.utcnow()
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
            algorithm=algorithm,
            directed=directed,
            use_history=use_history,
            normalize=normalize,
            history_length=history_length if use_history else None
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

        if comparison:
            try:
                comparison_data = json.loads(comparison)
                if isinstance(comparison_data, list):
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
                pass

        return {
            "message": "Data saved successfully", 
            "research_id": str(new_research.research_id)
        }

    except Exception as e:
        logger.error(f"Error saving data: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving data: {str(e)}")


@router.delete("/research/{research_id}")
async def delete_research(
    research_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
    


@router.put("/research/{research_id}")
async def update_research_data(
    research_id: str,
    updated_data: dict,
    current_user: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
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
