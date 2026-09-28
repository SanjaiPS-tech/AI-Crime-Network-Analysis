# Crime Network Analysis System

An AI-powered crime network analysis platform that extracts entities from crime reports/FIRs, maps relationships between entities, builds network graphs, and detects suspicious patterns.

## Features

1. **Entity Extraction** - Extract Persons, Phones, Locations, Vehicles, Organizations, Emails, Dates, Money from crime reports using spaCy NER + custom rules
2. **Relationship Mapping** - Connect related entities based on proximity and co-occurrence in text
3. **Network Graph** - Interactive force-directed graph visualization using React Flow
4. **Suspicious Pattern Detection** - Identify highly connected entities, bridges between groups, and central players using graph centrality measures
5. **Dashboard** - Modern React dashboard for upload, analysis, and visualization

## Architecture

```
Crime Data → Entity Extraction → Relationship Mapping → Network Graph → Suspicious Pattern Detection → Dashboard
```

## Tech Stack

- **Backend**: FastAPI, spaCy, NetworkX, Python
- **Frontend**: React 18, React Flow, Lucide React
- **NLP**: spaCy (en_core_web_sm + transformers support)
- **Graph**: NetworkX for analysis, React Flow for visualization

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm

### Installation

```bash
# Clone and enter project
cd AI-Crime-Network-Analysis

# Install all dependencies
./install.sh
```

### Running the Application

**Terminal 1 - Backend:**
```bash
./start_backend.sh
# API runs on http://localhost:8000
# API docs at http://localhost:8000/docs
```

**Terminal 2 - Frontend:**
```bash
./start_frontend.sh
# Dashboard runs on http://localhost:3000
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/upload` | Upload a crime report document |
| POST | `/api/v1/process` | Process document through analysis pipeline |
| GET | `/api/v1/result/{document_id}` | Get full analysis result |
| GET | `/api/v1/graph/{document_id}` | Get graph data for visualization |
| GET | `/api/v1/suspicious/{document_id}` | Get suspicious entities |
| GET | `/api/v1/documents` | List all uploaded documents |
| GET | `/api/v1/health` | Health check |

## Entity Types Extracted

- **PERSON** - Names of individuals
- **PHONE** - Phone numbers (multiple formats)
- **LOCATION** - Places, addresses, landmarks
- **VEHICLE** - License plates, makes/models
- **ORGANIZATION** - Gangs, groups, companies
- **EMAIL** - Email addresses
- **DATE** - Dates and times
- **MONEY** - Monetary amounts

## Relationship Types

- `ASSOCIATED_WITH` - General association
- `CONTACTED` - Phone/email contact
- `LOCATED_AT` - Person at location
- `OWNS` - Person owns vehicle
- `MEMBER_OF` - Person in organization
- `RELATED_TO` - General relation
- `SAME_AS` - Entity resolution

## Suspicious Pattern Detection

The system flags entities based on:
- **Degree Centrality** - Highly connected entities (threshold: 5+ connections)
- **Betweenness Centrality** - Entities bridging groups (threshold: 0.3+)
- **Closeness Centrality** - Central position in network
- **Component Size** - Part of large connected groups
- **Entity-Type Specific** - Phones/Persons with many connections

## Sample Data

A sample FIR is included at `data/sample_fir.txt` for testing.

## Project Structure

```
AI-Crime-Network-Analysis/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # API endpoints
│   │   ├── core/config.py         # Configuration
│   │   ├── models/schemas.py      # Pydantic models
│   │   ├── services/
│   │   │   ├── entity_extractor.py  # NLP extraction
│   │   │   ├── graph_builder.py     # Graph construction & analysis
│   │   │   └── processor.py         # Pipeline orchestration
│   │   └── main.py                # FastAPI app
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── NetworkGraph.tsx     # React Flow graph
│   │   │   ├── EntityPanel.tsx      # Entity list with details
│   │   │   ├── SuspiciousPanel.tsx  # Suspicious entities
│   │   │   ├── UploadPanel.tsx      # File upload
│   │   │   └── StatsBar.tsx         # Statistics
│   │   ├── App.tsx                  # Main app
│   │   └── index.tsx                # Entry point
│   └── package.json
├── data/
│   ├── raw/                         # Uploaded documents
│   ├── processed/                   # Analysis results
│   └── sample_fir.txt               # Test data
├── install.sh
├── start_backend.sh
└── start_frontend.sh
```

## Configuration

Backend config in `backend/app/core/config.py`:
- `SPACY_MODEL` - spaCy model to use (default: en_core_web_sm)
- `USE_TRANSFORMERS` - Enable transformer model
- `SUSPICIOUS_DEGREE_THRESHOLD` - Min connections for suspicion
- `SUSPICIOUS_BETWEENNESS_THRESHOLD` - Min betweenness for suspicion

## Development

```bash
# Backend tests
cd backend && source venv/bin/activate && pytest

# Frontend tests
cd frontend && npm test

# Lint
cd frontend && npm run lint
```

## License

MIT