from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean, Text, Float, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=True)  # Nullable for OAuth users
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.user_id),
            "name": self.name,
            "email": self.email,
            "avatar": self.avatar or "https://cdn-icons-png.flaticon.com/512/64/64572.png"
        }


class Message(Base):
    __tablename__ = "messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_id = Column(UUID(as_uuid=True), ForeignKey("research.research_id"), nullable=False)
    message_text = Column(String, nullable=False)
    send_by = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": str(self.message_id),
            "message_text": self.message_text,
            "send_by": self.send_by,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Research(Base):
    __tablename__ = "research"

    __table_args__ = (
        CheckConstraint(
            "platform IN ('whatsapp', 'wikipedia')",
            name="valid_platform_check"
        ),
    )

    research_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_name = Column(String, nullable=False)
    description = Column(String)
    platform = Column(
        String,
        nullable=False,
        server_default='whatsapp' 
    )
    created_at = Column(DateTime, default=datetime.utcnow)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)

    def to_dict(self):
        return { 
            "id": str(self.research_id),
            "research_name": self.research_name,
            "description": self.description,
            "platform": self.platform,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "user_id": str(self.user_id) if self.user_id else None
        }


class ResearchFilter(Base):
    __tablename__ = "research_filters"

    filter_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_id = Column(UUID(as_uuid=True), ForeignKey("research.research_id"), nullable=False)
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    start_time = Column(String, nullable=True)
    end_time = Column(String, nullable=True)
    message_limit = Column(Integer, nullable=True)
    limit_type = Column(String, nullable=True)
    min_message_length = Column(Integer, nullable=True)
    max_message_length = Column(Integer, nullable=True)
    keywords = Column(String, nullable=True)
    min_messages = Column(Integer, nullable=True)
    max_messages = Column(Integer, nullable=True)
    top_active_users = Column(Integer, nullable=True)
    selected_users = Column(String, nullable=True)
    filter_by_username = Column(String, nullable=True)
    anonymize = Column(Boolean, default=False)
    algorithm = Column(String, nullable=True)
    directed = Column(Boolean, default=False)
    use_triads = Column(Boolean, default=False)
    use_history = Column(Boolean, default=False)
    normalize = Column(Boolean, default=False)
    history_length = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    def to_dict(self):
        return {
            "filter_id": str(self.filter_id),
            "research_id": str(self.research_id),
            "start_date": self.start_date,
            "end_date": self.end_date,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "message_limit": self.message_limit,
            "min_message_length": self.min_message_length,
            "max_message_length": self.max_message_length,
            "keywords": self.keywords,
            "filter_by_username": self.filter_by_username,
            "min_messages": self.min_messages,
            "max_messages": self.max_messages,
            "specific_users": self.selected_users,
            "top_active_users": self.top_active_users,
            "limit_type": self.limit_type,
            "algorithm": self.algorithm,
            "anonymize": self.anonymize,
            "directed": self.directed,
            "use_triads": self.use_triads,
            "use_history": self.use_history,
            "normalize": self.normalize,
            "history_length": self.history_length,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class NetworkAnalysis(Base):
    __tablename__ = "network_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_id = Column(UUID(as_uuid=True), ForeignKey("research.research_id"), nullable=True)
    nodes = Column(JSONB, nullable=False)  # Store nodes as JSON
    links = Column(JSONB, nullable=False)  # Store links as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    metric_name = Column(String, nullable=True)  
    is_connected = Column(Boolean, default=True)
    # parameters = Column(JSONB, nullable=True)  # Store analysis parameters as JSON

    def to_dict(self):
        return {
            "id": str(self.id),
            "research_id": str(self.research_id) if self.research_id else None,
            "nodes": self.nodes,
            "links": self.links,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "metric_name": self.metric_name,
            # "parameters": self.parameters
        }


class Comparisons(Base):
    __tablename__ = "comparisons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_id = Column(UUID(as_uuid=True), ForeignKey("research.research_id"), nullable=False)
    original_analysis = Column(UUID(as_uuid=True), ForeignKey("network_analysis.id"), nullable=False)
    nodes = Column(JSONB, nullable=False)  # Store nodes as JSON
    links = Column(JSONB, nullable=False)  # Store links as JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    is_connected = Column(Boolean, default=True)
    def to_dict(self):
        return {
            "id": str(self.id),
            "research_id": str(self.research_id),
            "original_analysis": str(self.original_analysis),
            "nodes": self.nodes,
            "links": self.links,
            "is_connected": self.is_connected,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }

# class Community(Base):
#     __tablename__ = "communities"

#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     analysis_id = Column(UUID(as_uuid=True), ForeignKey("network_analysis.id"), nullable=False)
#     community_index = Column(Integer, nullable=False)
#     size = Column(Integer, nullable=False)
#     nodes = Column(JSONB, nullable=False)  # Store node IDs as JSON array
#     avg_betweenness = Column(Float, nullable=True)
#     avg_pagerank = Column(Float, nullable=True)

#     def to_dict(self):
#         return {
#             "id": str(self.id),
#             "analysis_id": str(self.analysis_id),
#             "community_index": self.community_index,
#             "size": self.size,
#             "nodes": self.nodes,
#             "avg_betweenness": self.avg_betweenness,
#             "avg_pagerank": self.avg_pagerank
#         }