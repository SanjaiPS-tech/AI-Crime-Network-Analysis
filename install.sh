#!/bin/bash
# Install all dependencies

echo "=== Installing Backend Dependencies ==="
cd "$(dirname "$0")/backend"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Download spaCy model
python -m spacy download en_core_web_sm

echo ""
echo "=== Installing Frontend Dependencies ==="
cd "$(dirname "$0")/../frontend"
npm install

echo ""
echo "=== Installation Complete ==="
echo "Run ./start_backend.sh to start the API server"
echo "Run ./start_frontend.sh to start the React dashboard"