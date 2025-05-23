import os
import json
import logging
import re
from datetime import datetime
from collections import defaultdict
from typing import Dict

import networkx as nx
from community import community_louvain
from networkx.algorithms import community as nx_community

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import JSONResponse

from utils import (
    parse_date_time,
    detect_date_format,
    anonymize_name,
    apply_comparison_filters,
    find_common_nodes,
    mark_common_nodes,
    get_network_metrics,
    calculate_sequential_weights,
    extract_data,
    MEDIA_RE,
    timestamp_pattern,
    spam_messages
)


UPLOAD_FOLDER = "Uploads"  # Ensure this folder exists or adjust as needed

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/analyze/network/{filename}")
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
        
        result = await extract_data(
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
            date_formats
        )
        
        return JSONResponse(content={"nodes": result["nodes"] , "links": result["links"]}, status_code=200)
    except Exception as e:
        logger.error("Error:", e)
        raise HTTPException(detail=str(e), status_code=500)


@router.get("/analyze/decaying-network/{filename}")
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
        
        result = await extract_data(
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

        # Destructure the result
        selected_messages = result["messages"]
        all_messages = result["all_messages"]
        
        logger.info(f"found {len(selected_messages)} messages after filtering")
        if not selected_messages:
            logger.error("No messages found after filtering.")
            raise HTTPException(status_code=400, detail="No messages found after filtering.")
        
        seq_weights = calculate_sequential_weights(selected_messages, all_messages, n_prev)
        logger.info(f"found {(seq_weights)} edges after filtering")
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


@router.get("/analyze/triad-census/{filename}")
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
    
    
    
    
@router.get("/analyze/triad-census/{filename}")
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

