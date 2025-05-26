import re
import os
import json
import logging
import asyncio
from collections import defaultdict
from typing import List, Dict, Tuple, Any
from datetime import datetime

logger = logging.getLogger(__name__)

class UnifiedNetworkData:
    """מבנה אחיד לכל הפלטפורמות"""
    def __init__(self):
        self.messages: List[Tuple[str, str, datetime]] = []  # (user, text, timestamp)
        self.user_message_count: Dict[str, int] = defaultdict(int)
        self.edges: Dict[Tuple[str, str], int] = defaultdict(int)
        self.platform: str = ""
        self.metadata: Dict[str, Any] = {}

    def add_message(self, user: str, text: str, timestamp: datetime = None):
        """הוספת הודעה למבנה"""
        self.messages.append((user, text, timestamp or datetime.now()))
        self.user_message_count[user] += 1

    def add_edge(self, user1: str, user2: str, weight: int = 1):
        """הוספת קישור בין שני משתמשים"""
        edge = tuple(sorted([user1, user2]))
        self.edges[edge] += weight

    def get_users(self) -> set:
        """החזרת רשימת כל המשתמשים"""
        return set(self.user_message_count.keys())


class WhatsAppParser:
    """פרסר לקבצי וואטסאפ"""
    
    @staticmethod
    async def parse_file(file_path: str, **filters) -> UnifiedNetworkData:
        """
        פרסר קובץ וואטסאפ לפורמט אחיד
        """
        network_data = UnifiedNetworkData()
        network_data.platform = "whatsapp"
        
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # קיים כבר בקובץ utils.py - נשתמש בלוגיקה הקיימת
        from utils import extract_data, detect_date_format, parse_date_time
        
        # המרת פרמטרי הפילטרים
        start_datetime = None
        end_datetime = None
        if filters.get("start_date") and filters.get("start_time"):
            start_datetime = parse_date_time(filters["start_date"], filters["start_time"])
        if filters.get("end_date") and filters.get("end_time"):
            end_datetime = parse_date_time(filters["end_date"], filters["end_time"])

        date_formats = detect_date_format(lines[0])
        
        # קריאה לפונקציה הקיימת
        result = await extract_data(
            lines,
            start_datetime,
            end_datetime,
            filters.get("limit"),
            filters.get("limit_type", "first"),
            filters.get("min_length", 0),
            filters.get("max_length", 1000),
            filters.get("keywords"),
            filters.get("min_messages"),
            filters.get("max_messages"),
            filters.get("active_users"),
            filters.get("selected_users"),
            filters.get("username"),
            filters.get("anonymize", False),
            date_formats
        )
        
        # המרה למבנה אחיד
        for sender, message_text in result["messages"]:
            network_data.add_message(sender, message_text)
        
        # יצירת קישורים - לוגיקה של משתמשים עוקבים
        previous_sender = None
        for sender, _ in result["messages"]:
            if previous_sender and previous_sender != sender:
                network_data.add_edge(previous_sender, sender)
            previous_sender = sender
            
        network_data.metadata = {
            "original_result": result,
            "is_connected": result.get("is_connected", True)
        }
        
        return network_data


class WikipediaParser:
    """פרסר לקבצי ויקיפדיה"""
    
    @staticmethod
    def parse_file(file_path: str, **filters) -> UnifiedNetworkData:
        """
        פרסר קובץ ויקיפדיה לפורמט אחיד
        """
        network_data = UnifiedNetworkData()
        network_data.platform = "wikipedia"
        
        with open(file_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

        # פילטור הודעות
        min_length = filters.get("min_length", 0)
        max_length = filters.get("max_length", 1000)
        limit = filters.get("limit")
        limit_type = filters.get("limit_type", "first")
        anonymize = filters.get("anonymize", False)
        
        # פילטרים נוספים
        keywords = filters.get("keywords")
        min_messages = filters.get("min_messages")
        max_messages = filters.get("max_messages")
        active_users = filters.get("active_users")
        selected_users = filters.get("selected_users")
        username = filters.get("username")
        
        keyword_list = [kw.strip().lower() for kw in keywords.split(",")] if keywords else []
        selected_user_list = [user.strip().lower() for user in selected_users.split(",")] if selected_users else []
        
        anonymized_map = {}
        filtered_lines = []
        
        for line in lines:
            match = re.match(r"\[([\d/\.]+), ([\d:]+)\] ([^:]+):(.*)", line)
            if match:
                date, time, username_raw, text = match.groups()
                text = text.strip()
                username_raw = username_raw.strip()
                
                # פילטור לפי אורך
                if min_length <= len(text) <= max_length:
                    # פילטור לפי מילות מפתח
                    if not keywords or any(kw in text.lower() for kw in keyword_list):
                        # פילטור לפי משתמש ספציפי
                        if not username or username_raw.lower() == username.lower():
                            filtered_lines.append((username_raw, text, f"{date} {time}"))

        # החלת מגבלות
        if limit and limit > 0:
            if limit_type == "last":
                filtered_lines = filtered_lines[-limit:]
            else:  # first
                filtered_lines = filtered_lines[:limit]

        # עיבוד ההודעות
        previous_user = None
        user_message_count_temp = defaultdict(int)
        
        # ספירה ראשונית של הודעות למשתמש
        for username_raw, text, timestamp_str in filtered_lines:
            user_message_count_temp[username_raw] += 1
        
        # פילטור לפי כמות הודעות
        filtered_users = set()
        for user, count in user_message_count_temp.items():
            if (not min_messages or count >= min_messages) and (not max_messages or count <= max_messages):
                filtered_users.add(user)
        
        # פילטור לפי משתמשים פעילים
        if active_users and active_users > 0:
            sorted_users = sorted(user_message_count_temp.items(), key=lambda x: x[1], reverse=True)[:active_users]
            filtered_users = set(user for user, _ in sorted_users)
        
        # פילטור לפי משתמשים נבחרים
        if selected_user_list:
            filtered_users = {user for user in filtered_users if user.lower() in selected_user_list}
        
        # עיבוד סופי של ההודעות
        for username_raw, text, timestamp_str in filtered_lines:
            if username_raw in filtered_users:
                username = username_raw
                
                # אנונימיזציה
                if anonymize:
                    if username not in anonymized_map:
                        anonymized_map[username] = f"User_{len(anonymized_map) + 1}"
                    username = anonymized_map[username]
                
                # הוספת הודעה
                try:
                    # ניסיון להמיר timestamp - פורמטים שונים
                    if "/" in timestamp_str:
                        # פורמט DD/MM/YYYY HH:MM:SS
                        timestamp = datetime.strptime(timestamp_str, "%d/%m/%Y %H:%M:%S")
                    elif "." in timestamp_str:
                        # פורמט DD.MM.YYYY HH:MM:SS
                        timestamp = datetime.strptime(timestamp_str, "%d.%m.%Y %H:%M:%S")
                    else:
                        timestamp = datetime.now()
                except:
                    timestamp = datetime.now()
                    
                network_data.add_message(username, text, timestamp)
                
                # יצירת קישור למשתמש הקודם
                if previous_user and previous_user != username:
                    network_data.add_edge(previous_user, username)
                previous_user = username

        logger.info(f"Parsed Wikipedia file: {len(network_data.messages)} messages, {len(network_data.get_users())} users")
        
        return network_data


class UnifiedNetworkAnalyzer:
    """מנתח אחיד לכל הפלטפורמות"""
    
    @staticmethod
    def build_networkx_graph(network_data: UnifiedNetworkData):
        """בניית גרף NetworkX מהמבנה האחיד"""
        import networkx as nx
        
        G = nx.Graph()
        
        # הוספת צמתים
        users = network_data.get_users()
        G.add_nodes_from(users)
        
        # הוספת קישורים
        for edge, weight in network_data.edges.items():
            G.add_edge(edge[0], edge[1], weight=weight)
            
        return G
    
    @staticmethod
    def calculate_metrics(network_data: UnifiedNetworkData) -> Dict[str, Any]:
        """חישוב מטריקות רשת"""
        import networkx as nx
        
        G = UnifiedNetworkAnalyzer.build_networkx_graph(network_data)
        users = network_data.get_users()
        
        # בדיקת קישוריות
        is_connected = nx.is_connected(G) if len(G.nodes()) > 0 else False
        
        # אתחול מטריקות
        metrics = {
            "degree_centrality": {},
            "betweenness_centrality": {},
            "closeness_centrality": {},
            "eigenvector_centrality": {},
            "pagerank": {}
        }
        
        if len(G.nodes()) > 0 and len(G.edges()) > 0:
            try:
                metrics["degree_centrality"] = nx.degree_centrality(G)
                metrics["betweenness_centrality"] = nx.betweenness_centrality(G, weight="weight")
                
                if is_connected:
                    metrics["closeness_centrality"] = nx.closeness_centrality(G)
                    metrics["eigenvector_centrality"] = nx.eigenvector_centrality(G, max_iter=1000)
                    metrics["pagerank"] = nx.pagerank(G)
                else:
                    # עבור גרף לא מחובר - עבודה על הרכיב הגדול ביותר
                    components = list(nx.connected_components(G))
                    if components:
                        largest_cc = max(components, key=len)
                        G_sub = G.subgraph(largest_cc).copy()
                        
                        closeness = nx.closeness_centrality(G_sub)
                        eigenvector = nx.eigenvector_centrality(G_sub, max_iter=1000)
                        pagerank = nx.pagerank(G_sub)
                        
                        metrics["closeness_centrality"] = closeness
                        metrics["eigenvector_centrality"] = eigenvector
                        metrics["pagerank"] = pagerank
                        
            except Exception as e:
                logger.warning(f"Error calculating metrics: {e}")
        
        return {
            "metrics": metrics,
            "is_connected": is_connected,
            "graph": G
        }
    
@staticmethod
def create_nodes_and_links(network_data: UnifiedNetworkData) -> Dict[str, Any]:

    G = UnifiedNetworkAnalyzer.build_networkx_graph(network_data)

    # Calculate basic metrics
    degree_centrality = nx.degree_centrality(G)
    betweenness_centrality = nx.betweenness_centrality(G)
    closeness_centrality = nx.closeness_centrality(G)
    try:
        eigenvector_centrality = nx.eigenvector_centrality(G, max_iter=1000)
    except:
        eigenvector_centrality = {node: 0 for node in G.nodes()}
    pagerank = nx.pagerank(G)

    nodes = []
    for node in G.nodes():
        nodes.append({
            "id": node,
            "degree": degree_centrality.get(node, 0),
            "betweenness": betweenness_centrality.get(node, 0),
            "closeness": closeness_centrality.get(node, 0),
            "eigenvector": eigenvector_centrality.get(node, 0),
            "pagerank": pagerank.get(node, 0),
            "messages": network_data.user_message_count.get(node, 0)
        })

    links = []
    for (source, target), weight in network_data.edges.items():
        links.append({
            "source": source,
            "target": target,
            "weight": weight
        })

    is_connected = nx.is_connected(G) if G.number_of_nodes() > 0 else False

    return {
        "nodes": nodes,
        "links": links,
        "is_connected": is_connected
    }


class DecayingNetworkAnalyzer:
    """מנתח רשת מתפוררת אחיד"""
    
    @staticmethod
    def calculate_sequential_weights_unified(network_data: UnifiedNetworkData, n_prev: int = 3) -> Dict[Tuple[str, str], float]:
        """
        חישוב משקלים רציפים לרשת מתפוררת
        """
        weight_schemes = {2: [0.7, 0.3], 3: [0.5, 0.3, 0.2]}
        weights = weight_schemes.get(n_prev, [1.0])
        edge_weights = defaultdict(float)
        
        # המרת ההודעות לרשימה כרונולוגית
        messages_sorted = sorted(network_data.messages, key=lambda x: x[2])  # מיון לפי timestamp
        
        for i, (current_user, current_text, current_time) in enumerate(messages_sorted):
            # בדיקת ההודעות הקודמות
            for j in range(1, min(n_prev + 1, i + 1)):
                if i - j >= 0:
                    prev_user, prev_text, prev_time = messages_sorted[i - j]
                    if prev_user != current_user:
                        # הוספת משקל לקישור
                        edge_weights[(prev_user, current_user)] += weights[j - 1]
        
        return dict(edge_weights)
    
    @staticmethod
    def analyze_decaying_network(network_data: UnifiedNetworkData, n_prev: int = 3) -> Dict[str, Any]:
        """
        ניתוח רשת מתפוררת אחיד
        """
        import networkx as nx
        
        # חישוב משקלים רציפים
        seq_weights = DecayingNetworkAnalyzer.calculate_sequential_weights_unified(network_data, n_prev)
        
        if not seq_weights:
            logger.warning("No sequential weights found")
            return {
                "nodes": [],
                "links": [],
                "warning": "No data found for decaying network analysis"
            }
        
        # יצירת גרף עם משקלים רציפים
        G = nx.Graph()
        users = network_data.get_users()
        G.add_nodes_from(users)
        
        for (prev_user, curr_user), weight in seq_weights.items():
            if prev_user in users and curr_user in users:
                G.add_edge(prev_user, curr_user, weight=round(weight, 2))
        
        # חישוב מטריקות
        is_connected = nx.is_connected(G) if len(G.nodes()) > 0 else False
        
        # חישוב מרכזיות
        deg = nx.degree_centrality(G)
        btw = nx.betweenness_centrality(G, weight="weight", normalized=True)
        
        cls = {}
        eig = {}
        pr = {}
        
        if is_connected:
            cls = nx.closeness_centrality(G)
            eig = nx.eigenvector_centrality(G, max_iter=1000)
            pr = nx.pagerank(G, alpha=0.85)
        else:
            # עבור גרף לא מחובר
            components = list(nx.connected_components(G))
            if components:
                largest_comp = max(components, key=len)
                sub_graph = G.subgraph(largest_comp).copy()
                cls = nx.closeness_centrality(sub_graph)
                eig = nx.eigenvector_centrality(sub_graph, max_iter=1000)
                pr = nx.pagerank(sub_graph, alpha=0.85)
        
        # יצירת רשימת צמתים
        nodes_list = []
        for user in users:
            node = {
                "id": user,
                "messages": network_data.user_message_count.get(user, 0),
                "degree": round(deg.get(user, 0), 4),
                "betweenness": round(btw.get(user, 0), 4),
                "closeness": round(cls.get(user, 0), 4),
                "eigenvector": round(eig.get(user, 0), 4),
                "pagerank": round(pr.get(user, 0), 4)
            }
            nodes_list.append(node)
        
        # יצירת רשימת קישורים
        links_list = []
        for (prev_user, curr_user), weight in seq_weights.items():
            if prev_user in users and curr_user in users:
                links_list.append({
                    "source": prev_user,
                    "target": curr_user,
                    "weight": weight
                })
        
        return {
            "nodes": nodes_list,
            "links": links_list,
            "is_connected": is_connected,
            "platform": network_data.platform
        }


async def parse_platform_file(file_path: str, platform: str, **filters):
    if platform.lower() == "whatsapp":
        return await WhatsAppParser.parse_file(file_path, **filters)
    elif platform.lower() == "wikipedia":
        return await asyncio.to_thread(WikipediaParser.parse_file, file_path, **filters)
    else:
        raise ValueError(f"Unsupported platform: {platform}")



async def analyze_network_unified(file_path: str, platform: str, **filters) -> Dict[str, Any]:
    network_data = await parse_platform_file(file_path, platform, **filters)
    network_result = UnifiedNetworkAnalyzer.create_nodes_and_links(network_data)

    return {
        "nodes": network_result["nodes"],
        "links": network_result["links"],
        "is_connected": network_result["is_connected"],
        "platform": platform
    }
