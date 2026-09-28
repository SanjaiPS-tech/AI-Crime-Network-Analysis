#!/bin/bash
# Start the backend server

cd "$(dirname "$0")/backend"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate venv and install dependencies
source venv/bin/activate
pip install -q -r requirements.txt

# Download spaCy model if needed
python -c "import spacy; spacy.load('en_core_web_sm')" 2>/dev/null || python -m spacy download en_core_web_sm

# Start server
echo "Starting backend on http://localhost:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload