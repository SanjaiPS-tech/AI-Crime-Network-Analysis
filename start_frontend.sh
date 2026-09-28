#!/bin/bash
# Start the frontend development server

cd "$(dirname "$0")/frontend"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Start frontend
echo "Starting frontend on http://localhost:3000"
npm start