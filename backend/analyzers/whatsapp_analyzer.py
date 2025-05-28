import os
import logging
import networkx as nx
from collections import defaultdict
from fastapi.responses import JSONResponse
from fastapi import HTTPException
from typing import Dict
import json

from analyzers.base_analyzer import BaseAnalyzer
from utils import (
    parse_date_time,
    detect_date_format,
    calculate_sequential_weights,
    normalize_links_by_target,
    extract_data
)

UPLOAD_FOLDER = "uploads"
logger = logging.getLogger(__name__)

class WhatsAppAnalyzer(BaseAnalyzer):
    async def analyze(self, filename: str, **kwargs):
        try:
            logger.info(f"[WhatsApp] Analyzing file: {filename}")
            path = os.path.join(UPLOAD_FOLDER, filename)
            if not os.path.exists(path):
                raise HTTPException(404, f"File '{filename}' not found")

            start_dt = parse_date_time(kwargs.get("start_date"), kwargs.get("start_time"))
            end_dt = parse_date_time(kwargs.get("end_date"), kwargs.get("end_time"))

            raw_lines = open(path, encoding="utf-8").readlines()
            date_fmts = detect_date_format(raw_lines[0])

            result = await extract_data(
                raw_lines,
                start_dt,
                end_dt,
                kwargs.get("limit"),
                kwargs.get("limit_type", "first"),
                kwargs.get("min_length"),
                kwargs.get("max_length"),
                kwargs.get("keywords"),
                kwargs.get("min_messages"),
                kwargs.get("max_messages"),
                kwargs.get("active_users"),
                kwargs.get("selected_users"),
                kwargs.get("username"),
                kwargs.get("anonymize", False),
                date_fmts,
                kwargs.get("directed", False)
            )

            if kwargs.get("directed") and kwargs.get("use_history"):
                selected_messages = result["messages"]
                if not selected_messages:
                    raise HTTPException(400, "No messages found after filtering.")

                seq_weights = calculate_sequential_weights(selected_messages, kwargs.get("history_length", 3))
                user_counts: Dict[str, int] = defaultdict(int)
                for sender, _ in selected_messages:
                    user_counts[sender] += 1

                sel_user_list = [u.strip().lower() for u in kwargs.get("selected_users", "").split(',')] if kwargs.get("selected_users") else []
                filtered_users = {
                    u: c for u, c in user_counts.items()
                    if (not kwargs.get("min_messages") or c >= kwargs.get("min_messages")) and
                       (not kwargs.get("max_messages") or c <= kwargs.get("max_messages"))
                }
                if kwargs.get("active_users"):
                    filtered_users = dict(sorted(filtered_users.items(), key=lambda x: x[1], reverse=True)[:kwargs["active_users"]])
                if sel_user_list:
                    filtered_users = {u: c for u, c in filtered_users.items() if u.lower() in sel_user_list}

                nodes = set(filtered_users.keys())
                if not nodes:
                    raise HTTPException(400, "No data to analyze after filtering.")

                links = [
                    {"source": prev, "target": curr, "weight": w}
                    for (prev, curr), w in seq_weights.items()
                    if prev in nodes and curr in nodes
                ]

                if kwargs.get("normalize"):
                    links = normalize_links_by_target(links)

                G = nx.DiGraph()
                G.add_nodes_from(nodes)
                for link in links:
                    G.add_edge(link["source"], link["target"], weight=link["weight"])

                deg = nx.degree_centrality(G)
                btw = nx.betweenness_centrality(G, weight="weight", normalized=True)
                if nx.is_connected(G.to_undirected()):
                    cls = nx.closeness_centrality(G)
                    eig = nx.eigenvector_centrality(G, max_iter=1000)
                    pr = nx.pagerank(G, alpha=0.85)
                else:
                    comp = max(nx.connected_components(G.to_undirected()), key=len)
                    sub = G.subgraph(comp).copy()
                    cls = nx.closeness_centrality(sub)
                    eig = nx.eigenvector_centrality(sub, max_iter=1000)
                    pr = nx.pagerank(sub, alpha=0.85)

                nodes_out = [
                    {"id": u, "messages": user_counts[u],
                    "degree": round(deg.get(u, 0), 4),
                    "betweenness": round(btw.get(u, 0), 4),
                    "closeness": round(cls.get(u, 0), 4),
                    "eigenvector": round(eig.get(u, 0), 4),
                    "pagerank": round(pr.get(u, 0), 4)}
                    for u in nodes
                ]
                return JSONResponse({"nodes": nodes_out, "links": links, "messages": selected_messages if kwargs.get("is_for_save") else None, "is_connected": nx.is_connected(G.to_undirected())})

            return JSONResponse({
                "nodes": result["nodes"],
                "links": result["links"],
                "messages": result["messages"] if kwargs.get("is_for_save") else None,
                "is_connected": result["is_connected"]
            })

        except Exception as e:
            logger.error(f"[WhatsApp] analyze_network error: {e}")
            raise HTTPException(500, str(e))

    async def detect_communities(self, filename: str, **kwargs):
        try:
            from community import community_louvain
            from networkx.algorithms import community as nx_community

            logger.info(f"[WhatsApp] Detecting communities in: {filename}")

            graph_result = await self.analyze(filename, **kwargs)

            if hasattr(graph_result, "body"):
                graph_data = json.loads(graph_result.body)
            else:
                graph_data = graph_result

            if not graph_data.get("links"):
                return JSONResponse(
                    {
                        "nodes": graph_data["nodes"],
                        "links": [],
                        "communities": [],
                        "node_communities": {},
                        "algorithm": kwargs.get("algorithm", "louvain"),
                        "num_communities": 0,
                        "modularity": None,
                        "warning": "No links found in the input data."
                    },
                    status_code=200
                )

            G = nx.Graph()

            for node in graph_data["nodes"]:
                G.add_node(node["id"], **{k: v for k, v in node.items() if k != "id"})

            for link in graph_data["links"]:
                source = link["source"]
                target = link["target"]
                weight = link.get("weight", 1)

                if isinstance(source, dict):
                    source = source["id"]
                if isinstance(target, dict):
                    target = target["id"]

                G.add_edge(source, target, weight=weight)

            communities = {}
            node_communities = {}

            algorithm = kwargs.get("algorithm", "louvain")

            if algorithm == "louvain":
                partition = community_louvain.best_partition(G)
                node_communities = partition
                for node, cid in partition.items():
                    communities.setdefault(cid, []).append(node)

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
                raise HTTPException(status_code=400, detail=f"Unknown algorithm: {algorithm}")

            for i, node in enumerate(graph_data["nodes"]):
                node_id = node["id"]
                if node_id in node_communities:
                    graph_data["nodes"][i]["community"] = node_communities[node_id]

            communities_list = []
            for cid, nodes in communities.items():
                community_nodes = [node for node in graph_data["nodes"] if node["id"] in nodes]

                avg_betweenness = sum(n["betweenness"] for n in community_nodes) / len(community_nodes) if community_nodes else 0
                avg_pagerank = sum(n["pagerank"] for n in community_nodes) / len(community_nodes) if community_nodes else 0
                avg_messages = sum(n["messages"] for n in community_nodes) / len(community_nodes) if community_nodes else 0

                communities_list.append({
                    "id": cid,
                    "size": len(nodes),
                    "nodes": nodes,
                    "avg_betweenness": round(avg_betweenness, 4),
                    "avg_pagerank": round(avg_pagerank, 4),
                    "avg_messages": round(avg_messages, 2),
                })

            communities_list.sort(key=lambda x: x["size"], reverse=True)

            return JSONResponse({
                "nodes": graph_data["nodes"],
                "links": graph_data["links"],
                "communities": communities_list,
                "node_communities": node_communities,
                "algorithm": algorithm,
                "num_communities": len(communities),
                "modularity": round(community_louvain.modularity(node_communities, G), 4)
                    if algorithm == "louvain" else None
            }, status_code=200)

        except Exception as e:
            logger.error(f"[WhatsApp] Community detection error: {e}")
            raise HTTPException(status_code=500, detail=str(e))
