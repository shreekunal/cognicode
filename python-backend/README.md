# CogniCode Python AI Backend

FastAPI backend providing AI-powered features using **Python heuristics and static analysis** (no OpenAI required).

## Features

- **Question Recommendation**: Suggest next problem using performance-based heuristics
- **Code Review**: Pattern matching + static analysis for bug detection
- **Complexity Analysis**: Automatic Big-O detection + cyclomatic complexity

## Key Advantages

✅ **No API costs** - runs completely locally  
✅ **No API keys** - pure Python implementation  
✅ **Fast responses** - instant analysis  
✅ **Works offline** - no external dependencies  
✅ **Static analysis** - real Python code metrics with radon

## Quick Start

### 1. Install Dependencies

```bash
cd python-backend
pip3 install -r requirements.txt --break-system-packages
```

Or use a virtual environment (recommended):

```bash
cd python-backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Run Server

```bash
# Development
python3 main.py

# Or with uvicorn directly
uvicorn main:app --reload --port 8000
```

Server runs at: http://localhost:8000

## API Endpoints

### Health Check

```bash
GET /
```

### Recommend Next Question

```bash
POST /api/recommend
Content-Type: application/json

{
  "userStats": {
    "accuracy": 0.75,
    "problemsSolved": 12,
    "avgTime": 300,
    "lastDifficulty": "medium"
  }
}
```

### Code Review

```bash
POST /api/review
Content-Type: application/json

{
  "code": "def factorial(n):\n    if n<=1:\n        return 1\n    return n*factorial(n-1)",
  "language": "python"
}
```

### Complexity Analysis

```bash
POST /api/complexity
Content-Type: application/json

{
  "code": "def bubble_sort(arr):\n    n=len(arr)\n    for i in range(n):\n        for j in range(0,n-i-1):\n            if arr[j]>arr[j+1]:\n                arr[j],arr[j+1]=arr[j+1],arr[j]",
  "language": "python"
}
```

## Testing

Test endpoints with curl:

```bash
# Health check
curl http://localhost:8000/

# Recommendation
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{"userStats":{"accuracy":0.65,"problemsSolved":5}}'

# Code review
curl -X POST http://localhost:8000/api/review \
  -H "Content-Type: application/json" \
  -d '{"code":"print(\"hello\")\nprint(\"world\")","language":"python"}'

# Complexity
curl -X POST http://localhost:8000/api/complexity \
  -H "Content-Type: application/json" \
  -d '{"code":"def linear_search(arr, x):\n    for i in arr:\n        if i == x:\n            return True\n    return False","language":"python"}'
```

## Static Analysis Features

For Python code, the backend provides additional static analysis:

- **Cyclomatic Complexity** (via radon)
- **Maintainability Index**
- Function-level complexity metrics

These work even without an OpenAI API key.

## Architecture

```
Next.js Frontend
    ↓
Next.js API Routes (/app/api/ai/*)
    ↓
Python FastAPI Backend (port 8000)
    ↓
OpenAI API + Static Analysis Tools
```

## Dependencies

- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `radon` - Python code metrics and static analysis
- `python-dotenv` - Environment variables
- `pydantic` - Data validation

## How It Works

### Recommendation Engine

Uses heuristic algorithms based on:

- User accuracy percentage
- Problems solved count
- Average completion time
- Progressive difficulty scaling

### Code Review

Pattern matching for:

- Common Python bugs (== None, bare except, eval)
- JavaScript issues (var, ==, callbacks)
- Style violations (PEP 8, naming conventions)
- Performance anti-patterns

### Complexity Analysis

Automatic detection of:

- Nested loops → O(n²) or O(n³)
- Recursion → O(2ⁿ) analysis
- Sorting operations → O(n log n)
- Single loops → O(n)
- Static Python analysis with radon

## Production Deployment

### Using Docker (recommended):

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using systemd:

Create `/etc/systemd/system/cognicode-api.service`:

```ini
[Unit]
Description=CogniCode Python API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/python-backend
Environment="OPENAI_API_KEY=your-key"
ExecStart=/usr/bin/python3 -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

## Security Notes

- Enable CORS only for your frontend domain
- Rate limit endpoints in production
- Validate all user input
- Sanitize code before analysis

## Troubleshooting

**Port already in use:**

```bash
# Change port in command:
python3 main.py --port 8001
# Or:
uvicorn main:app --port 8001
```

**Import errors:**

```bash
pip3 install -r requirements.txt --break-system-packages
# Or with venv:
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Module not found:**
Ensure you're running from the python-backend directory:

```bash
cd /path/to/cognicode/python-backend
python3 main.py
```

## License

Same as parent project.
