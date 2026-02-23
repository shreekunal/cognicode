"""
Test script for CogniCode AI Backend
Run with: python3 test_endpoints.py
"""

import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    print("Testing health check...")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"✅ Health check: {response.json()}")
        return True
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False

def test_recommendation():
    print("\nTesting recommendation endpoint...")
    try:
        payload = {
            "userStats": {
                "accuracy": 0.75,
                "problemsSolved": 10,
                "avgTime": 250,
                "lastDifficulty": "medium"
            }
        }
        response = requests.post(f"{BASE_URL}/api/recommend", json=payload)
        result = response.json()
        print(f"✅ Recommendation: {json.dumps(result, indent=2)}")
        return True
    except Exception as e:
        print(f"❌ Recommendation failed: {e}")
        return False

def test_code_review():
    print("\nTesting code review endpoint...")
    try:
        payload = {
            "code": """def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)""",
            "language": "python"
        }
        response = requests.post(f"{BASE_URL}/api/review", json=payload)
        result = response.json()
        print(f"✅ Code review: {json.dumps(result, indent=2)[:200]}...")
        return True
    except Exception as e:
        print(f"❌ Code review failed: {e}")
        return False

def test_complexity():
    print("\nTesting complexity analysis endpoint...")
    try:
        payload = {
            "code": """def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]""",
            "language": "python"
        }
        response = requests.post(f"{BASE_URL}/api/complexity", json=payload)
        result = response.json()
        print(f"✅ Complexity analysis: {json.dumps(result, indent=2)[:200]}...")
        return True
    except Exception as e:
        print(f"❌ Complexity analysis failed: {e}")
        return False

if __name__ == "__main__":
    print("CogniCode AI Backend Tests")
    print("=" * 50)
    print(f"Testing: {BASE_URL}")
    print("Make sure the backend is running!")
    print()
    
    results = []
    results.append(test_health())
    results.append(test_recommendation())
    results.append(test_code_review())
    results.append(test_complexity())
    
    print("\n" + "=" * 50)
    passed = sum(results)
    total = len(results)
    print(f"Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed!")
    else:
        print("⚠️  Some tests failed. Check the backend logs.")
