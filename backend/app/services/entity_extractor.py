import re
import spacy
from typing import List, Optional
from app.models.schemas import Entity, EntityType, Document
from app.core.config import settings


class EntityExtractor:
    def __init__(self):
        self.nlp = None
        self._load_model()

    def _load_model(self):
        """Load spaCy model with transformers if available."""
        try:
            if settings.USE_TRANSFORMERS:
                self.nlp = spacy.load(settings.SPACY_MODEL)
            else:
                self.nlp = spacy.load("en_core_web_sm")
        except OSError:
            print(f"Model {settings.SPACY_MODEL} not found. Downloading...")
            # Fallback to small model
            self.nlp = spacy.load("en_core_web_sm")

    def extract_entities(self, document: Document) -> List[Entity]:
        """Extract entities from a document using spaCy NER."""
        doc = self.nlp(document.content)
        entities = []

        for ent in doc.ents:
            entity_type = self._map_spacy_label(ent.label_)
            if entity_type:
                entity = Entity(
                    text=ent.text,
                    type=entity_type,
                    confidence=1.0,
                    start_char=ent.start_char,
                    end_char=ent.end_char,
                    source_document_id=document.id,
                    metadata={"spacy_label": ent.label_}
                )
                entities.append(entity)

        # Additional rule-based extraction for specific patterns
        entities.extend(self._extract_phones(document))
        entities.extend(self._extract_vehicles(document))
        entities.extend(self._extract_emails(document))

        return entities

    def _map_spacy_label(self, label: str) -> Optional[EntityType]:
        """Map spaCy entity labels to our EntityType enum."""
        mapping = {
            "PERSON": EntityType.PERSON,
            "GPE": EntityType.LOCATION,
            "LOC": EntityType.LOCATION,
            "ORG": EntityType.ORGANIZATION,
            "DATE": EntityType.DATE,
            "MONEY": EntityType.MONEY,
            "EMAIL": EntityType.EMAIL,
        }
        return mapping.get(label)

    def _extract_phones(self, document: Document) -> List[Entity]:
        """Extract phone numbers using regex."""
        entities = []
        phone_patterns = [
            r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US format
            r'\b\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',  # International
            r'\b\d{10}\b',  # 10 digits
        ]

        for pattern in phone_patterns:
            for match in re.finditer(pattern, document.content):
                # Avoid duplicates
                if not any(e.text == match.group() and e.type == EntityType.PHONE for e in entities):
                    entity = Entity(
                        text=match.group(),
                        type=EntityType.PHONE,
                        confidence=0.9,
                        start_char=match.start(),
                        end_char=match.end(),
                        source_document_id=document.id,
                        metadata={"pattern": pattern}
                    )
                    entities.append(entity)
        return entities

    def _extract_vehicles(self, document: Document) -> List[Entity]:
        """Extract vehicle information (license plates, makes/models)."""
        entities = []
        
        # License plate patterns (various formats)
        plate_patterns = [
            r'\b[A-Z]{2,3}[-\s]?\d{2,4}[-\s]?[A-Z]{1,3}\b',  # General
            r'\b[A-Z]{1,3}[-\s]?\d{1,4}[-\s]?[A-Z]{1,3}\b',  # Another format
            r'\b\d{2}[A-Z]{2}\d{4}\b',  # Indian format
            r'\b[A-Z]{2}\d{2}[A-Z]{2}\d{4}\b',  # Another Indian format
        ]
        
        vehicle_keywords = [
            'car', 'vehicle', 'truck', 'motorcycle', 'bike', 'van', 'suv',
            'sedan', 'hatchback', 'toyota', 'honda', 'ford', 'bmw', 'mercedes',
            'audi', 'hyundai', 'kia', 'maruti', 'tata', 'mahindra'
        ]

        # Extract license plates
        for pattern in plate_patterns:
            for match in re.finditer(pattern, document.content):
                if not any(e.text == match.group() and e.type == EntityType.VEHICLE for e in entities):
                    entity = Entity(
                        text=match.group(),
                        type=EntityType.VEHICLE,
                        confidence=0.85,
                        start_char=match.start(),
                        end_char=match.end(),
                        source_document_id=document.id,
                        metadata={"subtype": "license_plate", "pattern": pattern}
                    )
                    entities.append(entity)

        # Extract vehicle makes/models near keywords
        for keyword in vehicle_keywords:
            pattern = rf'\b{keyword}\s+[A-Z][a-z]+\b'
            for match in re.finditer(pattern, document.content, re.IGNORECASE):
                if not any(e.text == match.group() and e.type == EntityType.VEHICLE for e in entities):
                    entity = Entity(
                        text=match.group(),
                        type=EntityType.VEHICLE,
                        confidence=0.7,
                        start_char=match.start(),
                        end_char=match.end(),
                        source_document_id=document.id,
                        metadata={"subtype": "make_model"}
                    )
                    entities.append(entity)

        return entities

    def _extract_emails(self, document: Document) -> List[Entity]:
        """Extract email addresses."""
        entities = []
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        
        for match in re.finditer(email_pattern, document.content):
            if not any(e.text == match.group() and e.type == EntityType.EMAIL for e in entities):
                entity = Entity(
                    text=match.group(),
                    type=EntityType.EMAIL,
                    confidence=0.95,
                    start_char=match.start(),
                    end_char=match.end(),
                    source_document_id=document.id,
                    metadata={}
                )
                entities.append(entity)
        return entities


# Singleton instance
extractor = EntityExtractor()


def get_extractor() -> EntityExtractor:
    return extractor