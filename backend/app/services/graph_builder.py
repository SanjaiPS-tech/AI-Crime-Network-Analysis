import networkx as nx
from typing import List, Dict, Set, Tuple
from collections import defaultdict
from app.models.schemas import (
    Entity, Relationship, RelationshipType, GraphData, 
    GraphNode, GraphEdge, AnalysisResult, SuspiciousEntity
)
from app.core.config import settings


class RelationshipMapper:
    def __init__(self):
        self.graph = nx.Graph()

    def build_relationships(self, entities: List[Entity], document_content: str) -> List[Relationship]:
        """Build relationships between entities based on proximity and co-occurrence."""
        relationships = []
        entity_by_id = {e.id: e for e in entities}
        
        # Group entities by type
        persons = [e for e in entities if e.type.value == "PERSON"]
        phones = [e for e in entities if e.type.value == "PHONE"]
        locations = [e for e in entities if e.type.value == "LOCATION"]
        vehicles = [e for e in entities if e.type.value == "VEHICLE"]
        emails = [e for e in entities if e.type.value == "EMAIL"]
        organizations = [e for e in entities if e.type.value == "ORGANIZATION"]

        # Person-Phone relationships (ownership/contact)
        for person in persons:
            for phone in phones:
                if self._are_near(person, phone, document_content, window=100):
                    rel = Relationship(
                        source_id=person.id,
                        target_id=phone.id,
                        type=RelationshipType.CONTACTED,
                        weight=0.9,
                        confidence=0.8,
                        evidence=[f"Person '{person.text}' mentioned near phone '{phone.text}'"]
                    )
                    relationships.append(rel)

        # Person-Location relationships
        for person in persons:
            for loc in locations:
                if self._are_near(person, loc, document_content, window=150):
                    rel = Relationship(
                        source_id=person.id,
                        target_id=loc.id,
                        type=RelationshipType.LOCATED_AT,
                        weight=0.8,
                        confidence=0.75,
                        evidence=[f"Person '{person.text}' mentioned near location '{loc.text}'"]
                    )
                    relationships.append(rel)

        # Person-Vehicle relationships
        for person in persons:
            for vehicle in vehicles:
                if self._are_near(person, vehicle, document_content, window=150):
                    rel = Relationship(
                        source_id=person.id,
                        target_id=vehicle.id,
                        type=RelationshipType.OWNS,
                        weight=0.7,
                        confidence=0.7,
                        evidence=[f"Person '{person.text}' mentioned near vehicle '{vehicle.text}'"]
                    )
                    relationships.append(rel)

        # Person-Email relationships
        for person in persons:
            for email in emails:
                if self._are_near(person, email, document_content, window=100):
                    rel = Relationship(
                        source_id=person.id,
                        target_id=email.id,
                        type=RelationshipType.CONTACTED,
                        weight=0.85,
                        confidence=0.8,
                        evidence=[f"Person '{person.text}' mentioned near email '{email.text}'"]
                    )
                    relationships.append(rel)

        # Person-Organization relationships
        for person in persons:
            for org in organizations:
                if self._are_near(person, org, document_content, window=150):
                    rel = Relationship(
                        source_id=person.id,
                        target_id=org.id,
                        type=RelationshipType.MEMBER_OF,
                        weight=0.75,
                        confidence=0.7,
                        evidence=[f"Person '{person.text}' mentioned near organization '{org.text}'"]
                    )
                    relationships.append(rel)

        # Person-Person relationships (co-occurrence)
        for i, p1 in enumerate(persons):
            for p2 in persons[i+1:]:
                if self._are_near(p1, p2, document_content, window=200):
                    rel = Relationship(
                        source_id=p1.id,
                        target_id=p2.id,
                        type=RelationshipType.ASSOCIATED_WITH,
                        weight=0.6,
                        confidence=0.6,
                        evidence=[f"Persons '{p1.text}' and '{p2.text}' mentioned together"]
                    )
                    relationships.append(rel)

        # Phone-Phone relationships (shared contacts)
        for i, ph1 in enumerate(phones):
            for ph2 in phones[i+1:]:
                if self._are_near(ph1, ph2, document_content, window=100):
                    rel = Relationship(
                        source_id=ph1.id,
                        target_id=ph2.id,
                        type=RelationshipType.ASSOCIATED_WITH,
                        weight=0.5,
                        confidence=0.5,
                        evidence=[f"Phones '{ph1.text}' and '{ph2.text}' mentioned together"]
                    )
                    relationships.append(rel)

        # Location-Location relationships
        for i, l1 in enumerate(locations):
            for l2 in locations[i+1:]:
                if self._are_near(l1, l2, document_content, window=150):
                    rel = Relationship(
                        source_id=l1.id,
                        target_id=l2.id,
                        type=RelationshipType.RELATED_TO,
                        weight=0.4,
                        confidence=0.4,
                        evidence=[f"Locations '{l1.text}' and '{l2.text}' mentioned together"]
                    )
                    relationships.append(rel)

        return relationships

    def _are_near(self, e1: Entity, e2: Entity, text: str, window: int = 100) -> bool:
        """Check if two entities appear near each other in text."""
        start = min(e1.start_char, e2.start_char)
        end = max(e1.end_char, e2.end_char)
        return (end - start) <= window

    def build_graph(self, entities: List[Entity], relationships: List[Relationship]) -> nx.Graph:
        """Build NetworkX graph from entities and relationships."""
        G = nx.Graph()
        
        # Add nodes
        for entity in entities:
            G.add_node(entity.id, 
                      label=entity.text, 
                      type=entity.type.value,
                      confidence=entity.confidence,
                      entity=entity)
        
        # Add edges
        for rel in relationships:
            if rel.source_id in G and rel.target_id in G:
                G.add_edge(rel.source_id, rel.target_id,
                          weight=rel.weight,
                          type=rel.type.value,
                          confidence=rel.confidence,
                          relationship=rel)
        
        self.graph = G
        return G

    def to_graph_data(self, G: nx.Graph) -> GraphData:
        """Convert NetworkX graph to our GraphData schema for visualization."""
        nodes = []
        edges = []
        
        # Color mapping by entity type
        type_colors = {
            "PERSON": "#e41a1c",
            "PHONE": "#377eb8",
            "LOCATION": "#4daf4a",
            "VEHICLE": "#984ea3",
            "ORGANIZATION": "#ff7f00",
            "DATE": "#ffff33",
            "MONEY": "#a65628",
            "EMAIL": "#f781bf",
        }
        
        for node_id, data in G.nodes(data=True):
            entity = data.get('entity')
            node_type = data.get('type', 'UNKNOWN')
            nodes.append(GraphNode(
                id=node_id,
                label=data.get('label', node_id),
                type=entity.type if entity else node_type,
                size=10 + G.degree(node_id) * 3,
                color=type_colors.get(node_type, "#999999"),
                metadata={"confidence": data.get('confidence', 1.0)}
            ))
        
        for source, target, data in G.edges(data=True):
            rel = data.get('relationship')
            edges.append(GraphEdge(
                id=f"{source}-{target}",
                source=source,
                target=target,
                type=rel.type if rel else data.get('type', 'RELATED_TO'),
                weight=data.get('weight', 1.0),
                color="#666666",
                metadata={"confidence": data.get('confidence', 1.0)}
            ))
        
        return GraphData(nodes=nodes, edges=edges)


class GraphAnalyzer:
    def __init__(self):
        pass

    def analyze(self, G: nx.Graph, entities: List[Entity]) -> List[SuspiciousEntity]:
        """Analyze graph for suspicious patterns."""
        suspicious = []
        entity_by_id = {e.id: e for e in entities}
        
        if G.number_of_nodes() == 0:
            return suspicious
        
        # Calculate centrality measures
        degree_centrality = nx.degree_centrality(G)
        betweenness_centrality = nx.betweenness_centrality(G)
        closeness_centrality = nx.closeness_centrality(G)
        
        # Find connected components
        components = list(nx.connected_components(G))
        
        for node_id in G.nodes():
            entity = entity_by_id.get(node_id)
            if not entity:
                continue
            
            deg_cent = degree_centrality.get(node_id, 0)
            bet_cent = betweenness_centrality.get(node_id, 0)
            clo_cent = closeness_centrality.get(node_id, 0)
            degree = G.degree(node_id)
            
            reasons = []
            risk_score = 0.0
            
            # High degree centrality (highly connected)
            if degree >= settings.SUSPICIOUS_DEGREE_THRESHOLD:
                reasons.append(f"High degree centrality: connected to {degree} entities")
                risk_score += 0.3
            
            # High betweenness centrality (bridge between groups)
            if bet_cent >= settings.SUSPICIOUS_BETWEENNESS_THRESHOLD:
                reasons.append(f"High betweenness centrality: acts as bridge ({bet_cent:.3f})")
                risk_score += 0.3
            
            # High closeness centrality (close to all others)
            if clo_cent > 0.5:
                reasons.append(f"High closeness centrality: central position ({clo_cent:.3f})")
                risk_score += 0.2
            
            # Part of large connected component
            for comp in components:
                if node_id in comp and len(comp) > 5:
                    reasons.append(f"Part of large connected group ({len(comp)} entities)")
                    risk_score += 0.2
                    break
            
            # Specific entity type risks
            if entity.type.value == "PHONE" and degree > 3:
                reasons.append("Phone number connected to multiple entities")
                risk_score += 0.15
            
            if entity.type.value == "PERSON" and degree > 4:
                reasons.append("Person connected to many entities")
                risk_score += 0.15
            
            if risk_score > 0.3:  # Threshold for suspicious
                suspicious.append(SuspiciousEntity(
                    entity=entity,
                    degree_centrality=deg_cent,
                    betweenness_centrality=bet_cent,
                    closeness_centrality=clo_cent,
                    risk_score=min(risk_score, 1.0),
                    reasons=reasons
                ))
        
        # Sort by risk score descending
        suspicious.sort(key=lambda x: x.risk_score, reverse=True)
        return suspicious


# Singleton instances
mapper = RelationshipMapper()
analyzer = GraphAnalyzer()


def get_mapper() -> RelationshipMapper:
    return mapper


def get_analyzer() -> GraphAnalyzer:
    return analyzer