import os
import json
import logging
from collections import defaultdict
from typing import Dict, Optional

import networkx as nx
from community import community_louvain
from networkx.algorithms import community as nx_community

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse

from analyzers.factory import get_analyzer

from utils import (
    parse_date_time,
    detect_date_format,
    apply_comparison_filters,
    find_common_nodes,
    mark_common_nodes,
    get_network_metrics,
    calculate_sequential_weights,
    extract_data,
    normalize_links_by_target
)


UPLOAD_FOLDER = "uploads"  

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/analyze/network/{filename}")
async def analyze_network(
    filename: str,
    platform: str = Query("whatsapp"),
    limit: Optional[int] = Query(None),
    limit_type: str = Query("first"),
    min_length: Optional[int] = Query(None),
    max_length: Optional[int] = Query(None),
    min_messages: Optional[int] = Query(None),
    max_messages: Optional[int] = Query(None),
    active_users: Optional[int] = Query(None),
    selected_users: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    anonymize: bool = Query(False),
    directed: bool = Query(False),
    use_history: bool = Query(False),
    normalize: bool = Query(False),
    include_messages: bool = Query(False),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    history_length: int = Query(3),
    is_for_save: bool = Query(False),
    keywords: Optional[str] = Query(None),

):
    analyzer = get_analyzer(platform)
    return await analyzer.analyze(
        filename=filename,
        limit=limit,
        limit_type=limit_type,
        min_length=min_length,
        max_length=max_length,
        min_messages=min_messages,
        max_messages=max_messages,
        active_users=active_users,
        selected_users=selected_users,
        username=username,
        anonymize=anonymize,
        directed=directed,
        use_history=use_history,
        normalize=normalize,
        include_messages=include_messages,
        start_date=start_date,
        end_date=end_date,
        start_time=start_time,
        end_time=end_time,
        history_length=history_length,
        is_for_save=is_for_save,
        keywords=keywords
    )


@router.get("/analyze/compare-networks")
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


@router.get("/analyze/communities/{filename}")
async def analyze_communities(
    filename: str,
    platform: str = Query("whatsapp"),
    limit: Optional[int] = Query(None),
    limit_type: str = Query("first"),
    min_length: Optional[int] = Query(None),
    max_length: Optional[int] = Query(None),
    min_messages: Optional[int] = Query(None),
    max_messages: Optional[int] = Query(None),
    active_users: Optional[int] = Query(None),
    selected_users: Optional[str] = Query(None),
    username: Optional[str] = Query(None),
    anonymize: bool = Query(False),
    directed: bool = Query(False),
    use_history: bool = Query(False),
    normalize: bool = Query(False),
    include_messages: bool = Query(False),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    start_time: Optional[str] = Query(None),
    end_time: Optional[str] = Query(None),
    algorithm: str = Query("louvain"),
    history_length: int = Query(3),
):
    analyzer = get_analyzer(platform)
    return await analyzer.detect_communities(
        filename=filename,
        platform=platform,
        limit=limit,
        limit_type=limit_type,
        min_length=min_length,
        max_length=max_length,
        min_messages=min_messages,
        max_messages=max_messages,
        active_users=active_users,
        selected_users=selected_users,
        username=username,
        anonymize=anonymize,
        directed=directed,
        use_history=use_history,
        normalize=normalize,
        include_messages=include_messages,
        start_date=start_date,
        end_date=end_date,
        start_time=start_time,
        end_time=end_time,
        algorithm=algorithm,
        history_length=history_length
    )
