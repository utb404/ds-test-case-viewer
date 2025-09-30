#!/bin/bash

# Setup script for Test Case Viewer project using uv

echo "🚀 Setting up Test Case Viewer project with uv..."

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "❌ uv is not installed. Please install uv first:"
    echo "   curl -LsSf https://astral.sh/uv/install.sh | sh"
    exit 1
fi

echo "✅ uv is installed"

# Install dependencies
echo "📦 Installing Python dependencies with uv..."
uv sync

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Initialize database
echo "🗄️ Initializing database..."
cd backend
uv run python init_db.py
cd ..

echo "✅ Setup complete!"
echo ""
echo "To run the project:"
echo "  Development: docker-compose up"
echo "  Backend only: cd backend && uv run uvicorn main:app --reload"
echo "  Frontend only: cd frontend && npm start"
echo ""
echo "To add new Python dependencies:"
echo "  uv add package-name"
echo ""
echo "To add development dependencies:"
echo "  uv add --dev package-name"
