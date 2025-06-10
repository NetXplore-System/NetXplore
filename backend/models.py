from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, Boolean, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
import uuid
from datetime import datetime
import pytz
from database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=True)  
    avatar = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.utc))

    def to_dict(self):
        return {
            "id": str(self.user_id),
            "name": self.name,
            "email": self.email,
            "avatar": self.avatar or "https://cdn-icons-png.flaticon.com/512/64/64572.png",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Message(Base):
    __tablename__ = "messages"

    message_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_id = Column(UUID(as_uuid=True), ForeignKey("research.research_id"), nullable=False)
    message_text = Column(String, nullable=False)
    send_by = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.utc))

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
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.utc))

    def to_dict(self):
        return { 
            "id": str(self.research_id),
            "research_name": self.research_name,
            "description": self.description,
            "platform": self.platform,
            "user_id": str(self.user_id) if self.user_id else None, 
            "created_at": self.created_at.isoformat() if self.created_at else None,
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
    use_history = Column(Boolean, default=False)
    normalize = Column(Boolean, default=False)
    history_length = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.utc))
    
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
            "use_history": self.use_history,
            "normalize": self.normalize,
            "history_length": self.history_length,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }



class NetworkAnalysis(Base):
    __tablename__ = "network_analysis"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_id = Column(UUID(as_uuid=True), ForeignKey("research.research_id"), nullable=True)
    nodes = Column(JSONB, nullable=False)
    links = Column(JSONB, nullable=False)
    metric_name = Column(String, nullable=True)  
    is_connected = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.utc))
    communities = Column(JSONB, nullable=True)


    def to_dict(self):
        return {
            "id": str(self.id),
            "research_id": str(self.research_id) if self.research_id else None,
            "nodes": self.nodes,
            "links": self.links,
            "metric_name": self.metric_name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Comparisons(Base):
    __tablename__ = "comparisons"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    research_id = Column(UUID(as_uuid=True), ForeignKey("research.research_id"), nullable=False)
    original_analysis = Column(UUID(as_uuid=True), ForeignKey("network_analysis.id"), nullable=False)
    nodes = Column(JSONB, nullable=False)
    links = Column(JSONB, nullable=False)
    is_connected = Column(Boolean, default=True)
    messages = Column(JSONB, nullable=True)
    filters = Column(JSONB, nullable=True)
    statistics = Column(JSONB, nullable=True)
    file_name= Column(String, nullable=True)
    original_file_name = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(pytz.utc))

    def to_dict(self):
        return {
            "id": str(self.id),
            "research_id": str(self.research_id),
            "original_analysis": str(self.original_analysis),
            "nodes": self.nodes,
            "links": self.links,
            "is_connected": self.is_connected,
            "messages": self.messages,
            "filters": self.filters,
            "statistics": self.statistics,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
