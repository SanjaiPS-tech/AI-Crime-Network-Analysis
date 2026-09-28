from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
import uuid


class EntityType(str, Enum):
    PERSON = "PERSON"
    PHONE = "PHONE"
    LOCATION = "LOCATION"
    VEHICLE = "VEHICLE"
    ORGANIZATION = "ORGANIZATION"
    DATE = "DATE"
    MONEY = "MONEY"
    EMAIL = "EMAIL"


class Entity(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    text: str
    type: EntityType
    confidence: float = 1.0
    start_char: int = 0
    end_char: int = 0
    source_document_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class RelationshipType(str, Enum):
    ASSOCIATED_WITH = "ASSOCIATED_WITH"
    CONTACTED = "CONTACTED"
    LOCATED_AT = "LOCATED_AT"
    OWNS = "OWNS"
    MEMBER_OF = "MEMBER_OF"
    RELATED_TO = "RELATED_TO"
    SAME_AS = "SAME_AS"


class Relationship(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    source_id: str
    target_id: str
    type: RelationshipType
    weight: float = 1.0
    confidence: float = 1.0
    evidence: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content: str
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphNode(BaseModel):
    id: str
    label: str
    type: EntityType
    size: float = 10.0
    color: str = "#1f77b4"
    x: Optional[float] = None
    y: Optional[float] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphEdge(BaseModel):
    id: str
    source: str
    target: str
    type: RelationshipType
    weight: float = 1.0
    color: str = "#999999"
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GraphData(BaseModel):
    nodes: List[GraphNode] = Field(default_factory=list)
    edges: List[GraphEdge] = Field(default_factory=list)


class SuspiciousEntity(BaseModel):
    entity: Entity
    degree_centrality: float
    betweenness_centrality: float
    closeness_centrality: float
    risk_score: float
    reasons: List[str] = Field(default_factory=list)


class AnalysisResult(BaseModel):
    document_id: str
    entities: List[Entity] = Field(default_factory=list)
    relationships: List[Relationship] = Field(default_factory=list)
    graph: GraphData = Field(default_factory=GraphData)
    suspicious_entities: List[SuspiciousEntity] = Field(default_factory=list)
    processed_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class UploadResponse(BaseModel):
    document_id: str
    filename: str
    message: str
    status: str = "success"


class ProcessRequest(BaseModel):
    document_id: str
    use_transformers: bool = True


class ProcessResponse(BaseModel):
    document_id: str
    result: AnalysisResult
    status: str = "success"