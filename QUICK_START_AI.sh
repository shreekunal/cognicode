#!/bin/bash

# Quick Start Guide for CogniCode AI Integration

echo "🚀 CogniCode AI Integration - Quick Start"
echo "=========================================="
echo ""

# Step 1: Check system requirements
echo "Step 1: Checking system requirements..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3:"
    echo "   sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js"
    exit 1
fi

echo "✅ Python 3: $(python3 --version)"
echo "✅ Node.js: $(node --version)"
echo ""

# Step 2: Setup instructions
echo "Step 2: Setup Python Backend"
echo "----------------------------"
echo "Run these commands:"
echo ""
echo "cd python-backend"
echo "sudo apt install python3-pip python3-venv  # if not installed"
echo "./setup.sh  # or manually:"
echo "  python3 -m venv venv"
echo "  source venv/bin/activate"
echo "  pip install -r requirements.txt"
echo ""
echo "Edit .env file and add your OpenAI API key"
echo "Then run: python3 main.py"
echo ""

# Step 3: Next.js setup
echo "Step 3: Configure Next.js"
echo "-------------------------"
echo "In project root, edit or create .env.local:"
echo "  PYTHON_BACKEND_URL=http://localhost:8000"
echo ""

# Step 4: Test
echo "Step 4: Testing"
echo "---------------"
echo "Terminal 1: cd python-backend && source venv/bin/activate && python3 main.py"
echo "Terminal 2: npm run dev"
echo ""
echo "Test health: curl http://localhost:8000/"
echo ""

echo "📚 Full documentation:"
echo "   - AI_SETUP.md (main guide)"
echo "   - python-backend/README.md (backend details)"
echo ""

echo "✨ Features implemented:"
echo "   ✓ Question recommendation AI"
echo "   ✓ Code review with static analysis"
echo "   ✓ Complexity analysis (Big-O)"
echo ""
