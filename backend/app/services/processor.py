import os
import uuid
from typing import List, Optional
from datetime import datetime
from app.models.schemas import (
    Document, Entity, Relationship, AnalysisResult, 
    UploadResponse, ProcessRequest, ProcessResponse
)
from app.services.entity_extractor import get_extractor
from app.services.graph_builder import get_mapper, get_analyzer
from app.core.config import settings


class DocumentProcessor:
    def __init__(self):
        self.documents: dict = {}
        self.results: dict = {}
        self.extractor = get_extractor()
        self.mapper = get_mapper()
        self.analyzer = get_analyzer()

    def save_document(self, filename: str, content: str) -> Document:
        """Save uploaded document."""
        document = Document(
            filename=filename,
            content=content,
            metadata={"size": len(content)}
        )
        self.documents[document.id] = document
        return document

    def get_document(self, document_id: str) -> Optional[Document]:
        """Retrieve document by ID."""
        return self.documents.get(document_id)

    def process_document(self, request: ProcessRequest) -> AnalysisResult:
        """Process a document through the full pipeline."""
        document = self.get_document(request.document_id)
        if not document:
            raise ValueError(f"Document {request.document_id} not found")

        # Step 1: Entity Extraction
        entities = self.extractor.extract_entities(document)
        
        # Step 2: Relationship Mapping
        relationships = self.mapper.build_relationships(entities, document.content)
        
        # Step 3: Build Graph
        graph = self.mapper.build_graph(entities, relationships)
        graph_data = self.mapper.to_graph_data(graph)
        
        # Step 4: Suspicious Pattern Detection
        suspicious_entities = self.analyzer.analyze(graph, entities)
        
        # Create result
        result = AnalysisResult(
            document_id=document.id,
            entities=entities,
            relationships=relationships,
            graph=graph_data,
            suspicious_entities=suspicious_entities,
            metadata={
                "entity_count": len(entities),
                "relationship_count": len(relationships),
                "suspicious_count": len(suspicious_entities),
                "graph_nodes": graph.number_of_nodes(),
                "graph_edges": graph.number_of_edges(),
            }
        )
        
        self.results[document.id] = result
        return result

    def get_result(self, document_id: str) -> Optional[AnalysisResult]:
        """Get analysis result for a document."""
        return self.results.get(document_id)

    def list_documents(self) -> List[Document]:
        """List all uploaded documents."""
        return list(self.documents.values())


# Singleton instance
processor = DocumentProcessor()


def get_processor() -> DocumentProcessor:
    return processor