from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv
import radon.complexity as radon_complexity
import radon.metrics as radon_metrics
import json
import re
import random
import math
from pymongo import MongoClient
from urllib.parse import quote_plus

try:
    import openai
    OPENAI_AVAILABLE = True
except Exception:
    openai = None
    OPENAI_AVAILABLE = False

# Load root .env (all secrets consolidated there)
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Configure LLM (supports OpenAI, Groq, or any OpenAI-compatible API)
OPENAI_API_KEY = os.getenv("GROQ_API_KEY") or os.getenv("OPENAI_API_KEY")
OPENAI_API_BASE = os.getenv("GROQ_API_BASE") or os.getenv("OPENAI_API_BASE")
OPENAI_MODEL = os.getenv("GROQ_MODEL") or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
if OPENAI_AVAILABLE and OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    if OPENAI_API_BASE:
        openai.api_base = OPENAI_API_BASE

app = FastAPI(title="CogniCode AI Backend - Python Edition", version="3.0.0")

# MongoDB connection with error resilience
MONGO_URI = os.getenv("MONGO_URL", "mongodb://localhost:27017/cognicode")
try:
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
    client.server_info()  # Force connection check
    db = client.get_default_database() if "/" in MONGO_URI.split("://")[-1] else client["cognicode"]
    problems_collection = db["problems"]
    MONGO_CONNECTED = True
except Exception as e:
    print(f"[WARN] MongoDB connection failed: {e}. Recommendation engine will return fallback.")
    problems_collection = None
    MONGO_CONNECTED = False

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Request/Response Models ────────────────────────────────────────────────

class RecentSubmission(BaseModel):
    problemId: Optional[str] = ""
    category: Optional[str] = ""
    difficulty: Optional[str] = "Easy"
    status: Optional[str] = "pending"
    time: Optional[str] = None
    cpuTime: Optional[float] = None


class UserStats(BaseModel):
    accuracy: Optional[float] = 0.0
    recentWeightedAccuracy: Optional[float] = 0.0
    problemsSolved: Optional[int] = 0
    avgTime: Optional[float] = 0.0
    lastDifficulty: Optional[str] = "Easy"
    solvedProblemIds: Optional[List[str]] = []
    solvedCategories: Optional[Dict[str, Any]] = {}
    totalSubmissions: Optional[int] = 0
    totalAccepted: Optional[int] = 0
    recentDifficulty: Optional[str] = "Easy"
    rating: Optional[int] = 50
    recentSubmissions: Optional[List[RecentSubmission]] = []
    stuckCategories: Optional[List[str]] = []


class RecommendationRequest(BaseModel):
    userStats: UserStats


class CodeReviewRequest(BaseModel):
    code: str
    language: str


class ComplexityRequest(BaseModel):
    code: str
    language: str


class HintRequest(BaseModel):
    problemTitle: str
    problemStatement: str
    difficulty: str = "Medium"
    code: Optional[str] = ""
    language: Optional[str] = "python"
    hintLevel: int = 1  # 1=gentle nudge, 2=approach hint, 3=strong hint


class ExplainRequest(BaseModel):
    problemTitle: str
    problemStatement: str
    code: str
    language: str = "python"


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: List[ChatMessage]
    topic: Optional[str] = None


# ─── Constants & Difficulty Mapping ──────────────────────────────────────────

DIFFICULTY_RANK = {"Easy": 1, "Medium": 2, "Hard": 3}
RANK_TO_DIFFICULTY = {1: "Easy", 2: "Medium", 3: "Hard"}


# ─── Rate Limiter ────────────────────────────────────────────────────────────
import time as _time
from collections import defaultdict

class RateLimiter:
    """Simple in-memory sliding-window rate limiter."""
    def __init__(self, max_requests: int = 20, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window = window_seconds
        self.requests: Dict[str, list] = defaultdict(list)

    def is_allowed(self, key: str) -> bool:
        now = _time.time()
        # Purge old entries
        self.requests[key] = [t for t in self.requests[key] if now - t < self.window]
        if len(self.requests[key]) >= self.max_requests:
            return False
        self.requests[key].append(now)
        return True

    def remaining(self, key: str) -> int:
        now = _time.time()
        self.requests[key] = [t for t in self.requests[key] if now - t < self.window]
        return max(0, self.max_requests - len(self.requests[key]))

# Global rate limiter: 20 LLM calls per minute per IP
llm_limiter = RateLimiter(max_requests=20, window_seconds=60)


# ─── Helper Functions ────────────────────────────────────────────────────────

def truncate_description(text: str, max_len: int = 120) -> str:
    """Truncate at word boundary, handle short strings gracefully."""
    if not text:
        return ""
    text = text.strip()
    if len(text) <= max_len:
        return text
    truncated = text[:max_len]
    # Cut at last space to avoid breaking mid-word
    last_space = truncated.rfind(' ')
    if last_space > max_len * 0.5:
        truncated = truncated[:last_space]
    return truncated.rstrip('.,;:!? ') + "..."


def compute_target_difficulty(stats: UserStats) -> tuple:
    """Compute target difficulty from rating, recency-weighted accuracy, and avgTime.
    Returns (target_rank: int, confidence: float, reason: str)
    """
    rating = stats.rating or 50
    rw_acc = (stats.recentWeightedAccuracy or stats.accuracy or 0) * 100
    avg_time = stats.avgTime or 0
    problems_solved = stats.problemsSolved or 0

    # Base difficulty from rating (0-100 scale)
    if rating >= 80:
        base_rank = 3  # Hard
    elif rating >= 50:
        base_rank = 2  # Medium
    else:
        base_rank = 1  # Easy

    # Accuracy adjustment: recency-weighted accuracy is the primary signal
    if rw_acc >= 85:
        acc_boost = 0.5   # Push toward harder
    elif rw_acc >= 65:
        acc_boost = 0.0   # Stay same
    elif rw_acc >= 40:
        acc_boost = -0.3  # Slight pull toward easier
    else:
        acc_boost = -0.7  # Pull toward easier

    # Speed bonus: fast solvers get a slight bump (avgTime in seconds)
    speed_boost = 0.0
    if avg_time > 0:
        if avg_time < 0.5:
            speed_boost = 0.3  # Very fast
        elif avg_time < 1.0:
            speed_boost = 0.1  # Fast
        # Slow solvers don't get penalized — that's what accuracy handles

    # Experience factor: very new users stay on Easy regardless
    if problems_solved < 3:
        exp_cap = 1  # Force Easy
    elif problems_solved < 8:
        exp_cap = 2  # Cap at Medium
    else:
        exp_cap = 3  # No cap

    raw_rank = base_rank + acc_boost + speed_boost
    target_rank = max(1, min(3, min(round(raw_rank), exp_cap)))
    target_diff = RANK_TO_DIFFICULTY[target_rank]

    confidence = min(1.0, problems_solved / 10)  # Low confidence for new users

    reason_parts = []
    if rw_acc >= 85:
        reason_parts.append(f"Accuracy {rw_acc:.0f}% — excellent")
    elif rw_acc >= 65:
        reason_parts.append(f"Accuracy {rw_acc:.0f}% — solid")
    elif rw_acc >= 40:
        reason_parts.append(f"Accuracy {rw_acc:.0f}% — building up")
    else:
        reason_parts.append(f"Accuracy {rw_acc:.0f}% — focus on fundamentals")

    if speed_boost > 0:
        reason_parts.append("fast solver bonus")

    reason = f"Target: {target_diff} ({', '.join(reason_parts)})"
    return target_rank, confidence, reason


def score_problem_serial(problem, stats, all_categories, solved_ids, max_order):
    """Score a problem for the SERIAL recommendation type.
    Prioritizes order sequence + difficulty progression."""
    score = 0.0
    p_order = problem.get("order", 0)
    p_diff = problem.get("difficulty", "Easy")
    p_rank = DIFFICULTY_RANK.get(p_diff, 1)
    problems_solved = stats.problemsSolved or 0

    # Base: earlier order = higher score (normalized 0-100)
    if max_order > 0:
        score += (1.0 - p_order / max_order) * 40

    # Difficulty progression: should match where user is in their journey
    if problems_solved < 5:
        ideal_rank = 1  # Start with Easy
    elif problems_solved < 15:
        ideal_rank = 2  # Medium zone
    else:
        ideal_rank = 3  # Ready for anything

    diff_gap = abs(p_rank - ideal_rank)
    score += max(0, 30 - diff_gap * 15)  # 30 for perfect match, 15 for 1-off, 0 for 2-off

    # Bonus for unsolved problems right after the last solved order
    # (continuity reward)
    solved_orders = set()
    # We don't have solved orders directly, so use order proximity to problems_solved count
    expected_next_order = problems_solved + 1
    order_distance = abs(p_order - expected_next_order)
    score += max(0, 20 - order_distance * 2)  # 20 for exact next, decays

    # Small random jitter to avoid identical scores
    score += random.uniform(0, 5)

    return round(score, 2)


def score_problem_accuracy(problem, stats, weak_category, unexplored_categories, stuck_categories, target_rank, confidence):
    """Score a problem for the ACCURACY recommendation type.
    Focuses on skill-appropriate difficulty + weak/unexplored topics."""
    score = 0.0
    p_diff = problem.get("difficulty", "Easy")
    p_rank = DIFFICULTY_RANK.get(p_diff, 1)
    p_cat = problem.get("category", "")
    p_likes = problem.get("likes", 0)

    # Difficulty match (most important signal): perfect match = 40 pts
    diff_gap = abs(p_rank - target_rank)
    score += max(0, 40 - diff_gap * 20)

    # Weak category bonus: strongly prioritize the user's weakest area
    if weak_category and p_cat == weak_category:
        score += 25
    # Unexplored category bonus: encourage breadth
    elif p_cat in unexplored_categories:
        score += 20

    # Stuck penalty: if user is stuck in this category, lower priority
    if p_cat in stuck_categories:
        score -= 15

    # Popularity bonus (mild): more liked problems tend to be better quality
    score += min(10, p_likes * 0.3)

    # Confidence scaling: when confidence is low (new user), weight difficulty match even more
    if confidence < 0.5:
        if diff_gap == 0:
            score += 10  # Extra bonus for exact match when we're uncertain

    # Small random jitter
    score += random.uniform(0, 5)

    return round(score, 2)


def score_problem_challenge(problem, stats, unexplored_categories, stuck_categories, target_rank):
    """Score a problem for the CHALLENGE recommendation type.
    Prioritizes hard difficulty, popularity, unexplored topics."""
    score = 0.0
    p_diff = problem.get("difficulty", "Easy")
    p_rank = DIFFICULTY_RANK.get(p_diff, 1)
    p_cat = problem.get("category", "")
    p_likes = problem.get("likes", 0)
    companies = problem.get("companies", [])

    # Difficulty: must be ABOVE user's target. Hard = best
    if p_rank > target_rank:
        score += 35  # Above target = challenge
    elif p_rank == 3:
        score += 30  # Hard is always good for challenge
    elif p_rank == target_rank:
        score += 10  # Same difficulty = not much of a challenge
    else:
        score -= 10  # Below target = not a challenge at all

    # Popularity is king for challenge mode: community-endorsed hard problems
    score += min(20, p_likes * 0.5)

    # Unexplored category bonus: challenge in a new area
    if p_cat in unexplored_categories:
        score += 15

    # Company tag bonus: problems asked at top companies are prestigious
    if companies:
        score += min(10, len(companies) * 3)

    # Mild stuck penalty (less than accuracy — challenge is supposed to be hard)
    if p_cat in stuck_categories:
        score -= 5

    # Small random jitter
    score += random.uniform(0, 5)

    return round(score, 2)


def make_recommendation(problem, rec_type, reason, score=0):
    """Build a recommendation dict from a problem document."""
    pid = str(problem.get("id", ""))
    return {
        "type": rec_type,
        "title": problem.get("title", "Problem"),
        "difficulty": problem.get("difficulty", "Medium"),
        "topic": problem.get("category", "Unknown"),
        "reason": reason,
        "problemId": pid,
        "description": truncate_description(problem.get("problemStatement") or ""),
        "order": problem.get("order", 0),
        "likes": problem.get("likes", 0),
        "companies": problem.get("companies", [])[:3],
        "_score": score  # Internal: for debugging/logging
    }


# ─── Health Check ────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "version": "3.0.0",
        "mode": "python-scoring-engine",
        "mongoConnected": MONGO_CONNECTED,
        "features": ["recommendation", "code_review", "complexity_analysis"]
    }


# ─── 1. Recommendation Engine (Scoring-Based) ───────────────────────────────

@app.post("/api/recommend")
def recommend_next_question(request: RecommendationRequest):
    """Score-based recommendation engine with 3 distinct strategies:
    1. Serial — next in difficulty-progressive order
    2. Accuracy — skill-matched with weak-topic & stuck awareness
    3. Challenge — stretch problem with popularity + prestige weighting
    """

    if not MONGO_CONNECTED or problems_collection is None:
        return {
            "fromAI": False,
            "source": "fallback",
            "recommendations": [],
            "insights": None,
            "error": "Database unavailable — please try again later"
        }

    stats = request.userStats
    solved_ids = set(stats.solvedProblemIds or [])
    solved_categories = stats.solvedCategories or {}
    stuck_categories = set(stats.stuckCategories or [])

    try:
        all_problems = list(problems_collection.find().sort("order", 1))
    except Exception as e:
        return {
            "fromAI": False,
            "source": "fallback",
            "recommendations": [],
            "insights": None,
            "error": f"Database query failed: {str(e)}"
        }

    if not all_problems:
        return {
            "fromAI": False,
            "source": "python-scoring-engine",
            "recommendations": [],
            "insights": None,
            "error": "No problems available in database"
        }

    # Filter to unsolved problems
    unsolved = [p for p in all_problems if str(p.get("id")) not in solved_ids]

    if not unsolved:
        return {
            "fromAI": False,
            "source": "python-scoring-engine",
            "recommendations": [],
            "insights": {"accuracy": round((stats.accuracy or 0) * 100, 1), "problemsSolved": stats.problemsSolved, "message": "You've solved all available problems!"},
        }

    # ── Compute shared context ──

    all_categories = set(p.get("category") for p in all_problems if p.get("category"))
    attempted_categories = set(solved_categories.keys())
    unexplored_categories = all_categories - attempted_categories

    # Find weakest category (lowest acceptance rate, min 2 attempts)
    weak_category = None
    lowest_rate = 1.0
    for cat, data in solved_categories.items():
        if isinstance(data, dict) and data.get("total", 0) >= 2:
            rate = data.get("accepted", 0) / data["total"]
            if rate < lowest_rate:
                lowest_rate = rate
                weak_category = cat

    # Target difficulty from composite signal
    target_rank, confidence, difficulty_reason = compute_target_difficulty(stats)
    max_order = max((p.get("order", 0) for p in all_problems), default=1)

    recommendations = []
    used_problem_ids = set()

    # ── Score & pick SERIAL ──
    serial_scores = [
        (p, score_problem_serial(p, stats, all_categories, solved_ids, max_order))
        for p in unsolved
    ]
    serial_scores.sort(key=lambda x: x[1], reverse=True)

    for p, sc in serial_scores:
        pid = str(p.get("id"))
        if pid not in used_problem_ids:
            order_num = p.get("order", 0)
            reason = f"Problem #{order_num} — next in your progression"
            if stats.problemsSolved == 0:
                reason = "Start your journey here — the first problem in the series"
            recommendations.append(make_recommendation(p, "serial", reason, sc))
            used_problem_ids.add(pid)
            break

    # ── Score & pick ACCURACY ──
    accuracy_scores = [
        (p, score_problem_accuracy(p, stats, weak_category, unexplored_categories, stuck_categories, target_rank, confidence))
        for p in unsolved if str(p.get("id")) not in used_problem_ids
    ]
    accuracy_scores.sort(key=lambda x: x[1], reverse=True)

    for p, sc in accuracy_scores:
        pid = str(p.get("id"))
        if pid not in used_problem_ids:
            p_cat = p.get("category", "")
            reason = difficulty_reason
            if weak_category and p_cat == weak_category:
                reason += f". Targets \"{weak_category}\" — your weakest area ({lowest_rate*100:.0f}% acceptance)"
            elif p_cat in unexplored_categories:
                reason += f". Explores \"{p_cat}\" — a new topic for you"
            elif p_cat in stuck_categories:
                reason += f". (Avoided stuck categories)"
            recommendations.append(make_recommendation(p, "accuracy", reason, sc))
            used_problem_ids.add(pid)
            break

    # ── Score & pick CHALLENGE ──
    challenge_scores = [
        (p, score_problem_challenge(p, stats, unexplored_categories, stuck_categories, target_rank))
        for p in unsolved if str(p.get("id")) not in used_problem_ids
    ]
    challenge_scores.sort(key=lambda x: x[1], reverse=True)

    # Pick from top 3 to add variety
    top_challenges = challenge_scores[:3]
    if top_challenges:
        p, sc = random.choice(top_challenges)
        pid = str(p.get("id"))
        companies = p.get("companies", [])
        likes = p.get("likes", 0)
        reason = "Push your limits with this challenge"
        if p.get("category") in unexplored_categories:
            reason += f" in \"{p.get('category')}\" — a new topic for you"
        if likes > 20:
            reason += f" ({likes} community likes)"
        if companies:
            reason += f". Asked at: {', '.join(companies[:3])}"
        recommendations.append(make_recommendation(p, "challenge", reason, sc))
        used_problem_ids.add(pid)

    return {
        "fromAI": False,
        "source": "python-scoring-engine",
        "recommendations": recommendations,
        "insights": {
            "accuracy": round((stats.accuracy or 0) * 100, 1),
            "recentAccuracy": round((stats.recentWeightedAccuracy or stats.accuracy or 0) * 100, 1),
            "problemsSolved": stats.problemsSolved,
            "weakCategory": weak_category,
            "unexploredTopics": list(unexplored_categories)[:5],
            "targetDifficulty": RANK_TO_DIFFICULTY.get(target_rank, "Medium"),
            "stuckCategories": list(stuck_categories),
            "confidence": round(confidence, 2),
        }
    }


# 2. Code Review
@app.post("/api/review")
def review_code(request: CodeReviewRequest, req: Request):
    """Review code using pattern matching and static analysis"""
    
    bugs: List[str] = []
    style: List[str] = []
    performance: List[str] = []
    best_practices: List[str] = []
    
    code = request.code
    language = request.language.lower()
    # Normalize python aliases
    if language in ("python3", "python2"):
        language = "python"
    
    # Python-specific analysis
    if language == "python":
        # Check for common bugs
        if "== None" in code:
            bugs.append("Use 'is None' instead of '== None'")
        if "!= None" in code:
            bugs.append("Use 'is not None' instead of '!= None'")
        if re.search(r'except\s*:', code):
            bugs.append("Avoid bare 'except:' - specify exception types")
        if "eval(" in code:
            bugs.append("Avoid eval() - security risk")
        
        # Style checks
        if re.search(r'[a-z]+[A-Z]', code):
            style.append("Use snake_case for Python variables (not camelCase)")
        if len([line for line in code.split('\n') if len(line) > 79]) > 0:
            style.append("Some lines exceed 79 characters (PEP 8)")
        
        # Performance
        if "+=" in code and "str" in code.lower():
            performance.append("String concatenation with += is slow; use join() or f-strings")
        if re.search(r'for .+ in .+:\s*if', code):
            performance.append("Consider using list comprehension or filter()")
        
        # Static analysis with radon
        try:
            complexity_results = radon_complexity.cc_visit(code)
            for item in complexity_results:
                if item.complexity > 10:
                    best_practices.append(f"Function '{item.name}' has high complexity ({item.complexity}). Consider refactoring.")
        except:
            pass
    
    # JavaScript-specific analysis
    elif language in ["javascript", "js", "nodejs"]:
        if "var " in code:
            style.append("Use 'let' or 'const' instead of 'var'")
        if re.search(r'(?<!=)==(?!=)', code):
            bugs.append("Use '===' instead of '==' for strict equality")
        if re.search(r'function\s+\w+\s*\(', code):
            style.append("Consider using arrow functions for cleaner syntax")
        if "callback(" in code:
            best_practices.append("Consider using Promises or async/await instead of callbacks")
        if "console.log" in code:
            best_practices.append("Remove console.log() statements before production")
        if re.search(r'\+\s*["\']|["\']\s*\+', code):
            performance.append("Consider using template literals instead of string concatenation")

    # C++-specific analysis
    elif language in ["cpp", "c++", "cxx"]:
        # Bug checks
        if "new " in code and "delete" not in code:
            bugs.append("Memory allocated with 'new' but no 'delete' found — potential memory leak")
        if re.search(r'(char|int|float|double)\s+\w+\s*;(?!\s*=)', code):
            bugs.append("Uninitialized variable(s) detected — always initialize variables")
        if re.search(r'gets\s*\(', code):
            bugs.append("Never use gets() — it has no bounds checking. Use fgets() or getline()")
        if re.search(r'sprintf\s*\(', code):
            bugs.append("Consider snprintf() instead of sprintf() to prevent buffer overflows")
        if "using namespace std;" in code and code.count("namespace") == 1:
            style.append("Avoid 'using namespace std;' in headers — prefer std:: prefix")
        # Style
        if re.search(r'#define\s+\w+\s+\d+', code):
            style.append("Prefer 'constexpr' or 'const' over #define for constants in C++")
        if re.search(r'NULL', code):
            style.append("Use 'nullptr' instead of 'NULL' in C++11 and later")
        if re.search(r'printf\s*\(', code) and '#include <iostream>' in code:
            style.append("Prefer cout/cerr over printf() in C++ for type safety")
        # Performance
        if re.search(r'push_back\s*\(', code) and "reserve" not in code:
            performance.append("Consider vector::reserve() before multiple push_back() calls")
        if re.search(r'(string|vector)\s+\w+\s*=\s*\w+', code) and "const &" not in code and "const&" not in code:
            performance.append("Pass large objects by const reference to avoid copies")
        if re.search(r'\.size\(\)\s*>\s*0', code):
            performance.append("Use .empty() instead of .size() > 0 for readability and efficiency")
        # Best practices
        if "malloc" in code or "free(" in code:
            best_practices.append("In C++, prefer new/delete or smart pointers over malloc/free")
        if "raw pointer" not in code and re.search(r'\w+\s*\*\s+\w+\s*=\s*new', code):
            best_practices.append("Consider using smart pointers (unique_ptr/shared_ptr) instead of raw pointers")
        if "#include <bits/stdc++.h>" in code:
            best_practices.append("Avoid #include <bits/stdc++.h> — it's non-standard and slows compilation")

    # Java-specific analysis
    elif language == "java":
        # Bug checks
        if re.search(r'\.equals\s*\(\s*null\s*\)', code):
            bugs.append("Calling .equals(null) will never be true — use == null instead")
        if re.search(r'catch\s*\(\s*Exception\s+\w+\s*\)\s*\{?\s*\}', code):
            bugs.append("Empty catch block silently swallows exceptions — at least log the error")
        if re.search(r'==\s*"', code) or re.search(r'"\s*==', code):
            bugs.append("Use .equals() for String comparison, not ==")
        # Style
        if re.search(r'class\s+[a-z]', code):
            style.append("Class names should start with uppercase (PascalCase)")
        if re.search(r'(private|public|protected)\s+\w+\s+[A-Z]', code):
            pass  # correct naming
        if re.search(r'System\.out\.print', code):
            best_practices.append("Consider using a logging framework instead of System.out.println()")
        if "instanceof" in code and "pattern" not in code.lower():
            style.append("Consider using polymorphism instead of instanceof checks")
        # Performance
        if re.search(r'String\s+\w+\s*=\s*""', code) and "+=" in code:
            performance.append("Use StringBuilder instead of String concatenation with +=")
        if re.search(r'new\s+ArrayList\s*<>', code) and "initialCapacity" not in code:
            performance.append("Consider specifying initial capacity for ArrayList if size is known")
        if "synchronized" in code:
            performance.append("Review synchronized blocks — consider java.util.concurrent utilities")
        # Best practices
        if re.search(r'public\s+\w+\s+\w+\s*;', code) and "final" not in code:
            best_practices.append("Consider making fields private with getters/setters")
        if "throws Exception" in code:
            best_practices.append("Avoid throwing generic Exception — use specific exception types")

    # C-specific analysis
    elif language == "c":
        # Bug checks
        if re.search(r'malloc\s*\(', code) and "free" not in code:
            bugs.append("Memory allocated with malloc() but no free() found — potential memory leak")
        if re.search(r'gets\s*\(', code):
            bugs.append("Never use gets() — use fgets() instead to prevent buffer overflow")
        if re.search(r'scanf\s*\(\s*"%s"', code):
            bugs.append("scanf(\"%s\") has no bounds — use fgets() or specify width: scanf(\"%99s\")")
        if re.search(r'(int|char|float|double)\s+\w+\s*;(?!\s*=)', code):
            bugs.append("Uninitialized variable(s) — always initialize variables in C")
        if re.search(r'sprintf\s*\(', code):
            bugs.append("Use snprintf() instead of sprintf() to prevent buffer overflows")
        # Style
        if re.search(r'#define\s+\w+\s+\d+', code):
            style.append("Consider using enum or const for numeric constants")
        if len([line for line in code.split('\n') if len(line) > 80]) > 0:
            style.append("Some lines exceed 80 characters")
        # Performance
        if re.search(r'strlen\s*\(', code) and re.search(r'for|while', code):
            performance.append("Cache strlen() result — calling it in a loop is O(n) each time")
        if re.search(r'realloc\s*\(', code):
            performance.append("Cache realloc() result in a temp variable to avoid memory leaks on failure")
        # Best practices
        if "goto " in code:
            best_practices.append("Avoid goto — use structured control flow")
        if re.search(r'void\s+main', code):
            best_practices.append("main() should return int, not void")
    
    # Generic checks for all languages
    if re.search(r'TODO|FIXME|HACK', code, re.IGNORECASE):
        best_practices.append("Remove TODO/FIXME comments before production")
    
    if not bugs and not style and not performance and not best_practices:
        style.append("Code looks clean! No obvious issues found.")
    
    # Get static analysis
    static_analysis = analyze_code_static(code, language)
    
    summary = f"Found {len(bugs)} potential bugs, {len(style)} style issues, {len(performance)} performance improvements"
    
    result = {
        "fromAI": False,
        "source": "python-pattern-matching",
        "review": {
            "bugs": bugs,
            "style": style,
            "performance": performance,
            "bestPractices": best_practices,
            "summary": summary
        },
        "staticAnalysis": static_analysis
    }

    # If OpenAI client and key are present, also generate an LLM-powered review to augment heuristics
    if OPENAI_AVAILABLE and OPENAI_API_KEY:
        client_ip = req.client.host if req.client else "unknown"
        if not llm_limiter.is_allowed(client_ip):
            result["llmError"] = "Rate limit exceeded. Try again in a minute."
        else:
            try:
                prompt = (
                    f"You are a senior code reviewer. Provide a concise review of the following {language} code,\n"
                    f"focusing on bugs, style, performance, and best practices. Return a JSON object with keys: bugs, style, performance, bestPractices, summary.\n\nCode:\n{code}\n"
                )
                resp = openai.ChatCompletion.create(
                    model=OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a helpful code review assistant."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=800,
                    temperature=0.2,
                )
                txt = resp.choices[0].message.content.strip()
                # Try to parse JSON out of model response
                try:
                    llm_json = json.loads(txt)
                except Exception:
                    # Try extracting JSON from markdown code block
                    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', txt)
                    if json_match:
                        try:
                            llm_json = json.loads(json_match.group(1).strip())
                        except Exception:
                            llm_json = {"raw": txt}
                    else:
                        llm_json = {"raw": txt}

                result["llmReview"] = llm_json
                result["fromAI"] = True
                result["source"] = "python-pattern-matching+openai"
            except Exception as e:
                # Don't fail the endpoint if LLM call fails; include error note
                result["llmError"] = str(e)

    return result


# 3. Complexity Analysis
@app.post("/api/complexity")
def analyze_complexity(request: ComplexityRequest, req: Request):
    """Analyze time and space complexity using pattern matching"""
    
    code = request.code
    language = request.language.lower()
    # Normalize language aliases
    if language in ("python3", "python2"): language = "python"
    
    # Static analysis for Python
    static_analysis = None
    if language == "python":
        try:
            # Calculate cyclomatic complexity
            complexity_results = radon_complexity.cc_visit(code)
            maintainability = radon_metrics.mi_visit(code, multi=True)
            
            static_analysis = {
                "cyclomaticComplexity": [
                    {
                        "name": item.name,
                        "complexity": item.complexity,
                        "rank": item.letter
                    }
                    for item in complexity_results
                ],
                "maintainabilityIndex": maintainability
            }
        except Exception as e:
            static_analysis = {"error": str(e)}
    
    # Heuristic complexity analysis
    time_complexity = "O(n)"
    space_complexity = "O(1)"
    explanation = ""
    suggestions = []
    
    # Count nested loops (Python-style with : and C-style with { )
    code_flat = code.replace('\n', ' ')
    nested_loops = max(
        len(re.findall(r'for.*:.*for', code_flat)),
        len(re.findall(r'for\s*\(.*\)\s*\{[^}]*for\s*\(', code_flat))
    )
    if nested_loops >= 2:
        time_complexity = "O(n³)"
        explanation = "Triple nested loops detected"
        suggestions.append("Consider using better algorithms or data structures to reduce nesting")
    elif nested_loops >= 1:
        time_complexity = "O(n²)"
        explanation = "Nested loops detected"
        suggestions.append("Look for opportunities to use hash maps or other O(n) techniques")
    elif re.search(r'while.*while', code):
        time_complexity = "O(n²)"
        explanation = "Nested while loops detected"
    elif "sort" in code.lower():
        time_complexity = "O(n log n)"
        explanation = "Sorting operation detected"
        suggestions.append("Sorting is efficient but check if it's necessary")
    elif re.search(r'for|while', code):
        time_complexity = "O(n)"
        explanation = "Single loop iteration"
        suggestions.append("Linear time is good for many problems")
    else:
        time_complexity = "O(1)"
        explanation = "Constant time operations"
        suggestions.append("Excellent! Constant time is optimal")
    
    # Check for recursion
    if language == "python":
        # Find function names and check if they call themselves
        func_names = re.findall(r'def (\w+)\s*\(', code)
        for func_name in func_names:
            parts = code.split('def ' + func_name, 1)
            if len(parts) > 1 and func_name + '(' in parts[1]:
                time_complexity = f"O(2ⁿ) or better"
                explanation = f"Recursive function '{func_name}' detected"
                suggestions.append("Consider memoization or dynamic programming to optimize recursion")
                suggestions.append("Analyze the recursion tree depth and branching factor")
                break
    elif language in ["javascript", "js", "nodejs"]:
        func_names = re.findall(r'function (\w+)\s*\(', code)
        for func_name in func_names:
            parts = code.split('function ' + func_name, 1)
            if len(parts) > 1 and func_name + '(' in parts[1]:
                time_complexity = f"O(2ⁿ) or better"
                explanation = f"Recursive function '{func_name}' detected"
                suggestions.append("Consider memoization to cache results")
                break
        # Also check arrow function recursion
        arrow_funcs = re.findall(r'const\s+(\w+)\s*=', code)
        for func_name in arrow_funcs:
            if func_name + '(' in code:
                occurrences = len(re.findall(re.escape(func_name) + r'\s*\(', code))
                if occurrences >= 2:  # defined + called inside itself
                    time_complexity = f"O(2ⁿ) or better"
                    explanation = f"Recursive function '{func_name}' detected"
                    suggestions.append("Consider memoization to cache results")
                    break
    elif language in ["cpp", "c++", "cxx", "c", "java"]:
        # Match C/C++/Java function definitions: returnType funcName(...)
        func_names = re.findall(r'(?:void|int|long|float|double|bool|string|auto|char|Object|String|List|Map)\s+(\w+)\s*\(', code)
        for func_name in func_names:
            if func_name in ("main", "Main"):
                continue
            # Count occurrences of funcName( in the code (definition + call = recursion)
            occurrences = len(re.findall(re.escape(func_name) + r'\s*\(', code))
            if occurrences >= 2:
                time_complexity = f"O(2ⁿ) or better"
                explanation = f"Recursive function '{func_name}' detected"
                suggestions.append("Consider memoization or iterative approach to optimize recursion")
                break
    
    # Space complexity analysis
    ds_patterns = r'(\[\]|\{\}|new Array|new Object|new ArrayList|new HashMap|new HashSet|new Vector|vector<|map<|set<|unordered_map<|malloc\s*\()'
    if re.search(ds_patterns, code):
        if nested_loops >= 1:
            space_complexity = "O(n²)"
            explanation += ". Creates auxiliary data structure in nested loop"
        else:
            space_complexity = "O(n)"
            explanation += ". Creates auxiliary data structure"
    
    if not suggestions:
        suggestions.append("Code appears reasonably efficient")
    
    result = {
        "fromAI": False,
        "source": "python-pattern-analysis",
        "complexity": {
            "timeComplexity": time_complexity,
            "spaceComplexity": space_complexity,
            "explanation": explanation,
            "optimizationSuggestions": suggestions
        },
        "staticAnalysis": static_analysis
    }

    # If OpenAI is available, augment with LLM complexity analysis
    if OPENAI_AVAILABLE and OPENAI_API_KEY:
        client_ip = req.client.host if req.client else "unknown"
        if not llm_limiter.is_allowed(client_ip):
            result["llmError"] = "Rate limit exceeded. Try again in a minute."
        else:
            try:
                prompt = (
                    f"Analyze the time and space complexity of the following {language} code.\n"
                    f"Return a JSON object with keys: timeComplexity, spaceComplexity, explanation, optimizationSuggestions (array).\n"
                    f"Be precise with Big-O notation. If there are multiple functions, analyze the main/dominant one.\n\nCode:\n{code}\n"
                )
                resp = openai.ChatCompletion.create(
                    model=OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "You are a computer science expert specializing in algorithm analysis. Always respond with valid JSON."},
                        {"role": "user", "content": prompt}
                    ],
                    max_tokens=600,
                    temperature=0.2,
                )
                txt = resp.choices[0].message.content.strip()
                try:
                    llm_json = json.loads(txt)
                except Exception:
                    json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', txt)
                    if json_match:
                        try:
                            llm_json = json.loads(json_match.group(1).strip())
                        except Exception:
                            llm_json = {"raw": txt}
                    else:
                        llm_json = {"raw": txt}

                result["llmAnalysis"] = llm_json
                result["fromAI"] = True
                result["source"] = "python-pattern-analysis+openai"
            except Exception as e:
                result["llmError"] = str(e)

    return result


# ─── 4. LLM Hint Endpoint ────────────────────────────────────────────────────

@app.post("/api/hint")
def get_hint(request: HintRequest, req: Request):
    """Generate progressive hints for a problem using LLM."""
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="LLM not configured")

    client_ip = req.client.host if req.client else "unknown"
    if not llm_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")

    level = max(1, min(3, request.hintLevel))
    level_instructions = {
        1: "Give a very gentle nudge. Mention ONE relevant data structure or technique name without explaining how to use it. Maximum 2 sentences.",
        2: "Give a medium hint. Describe the general approach or algorithm pattern (e.g., 'use a hash map to track seen values') without writing any code. Maximum 3-4 sentences.",
        3: "Give a strong hint. Describe the step-by-step approach in plain English. You may include pseudocode but NOT the actual solution code. Maximum 5-6 sentences.",
    }

    code_context = ""
    if request.code and request.code.strip():
        code_context = f"\n\nThe student's current code attempt ({request.language}):\n{request.code[:1500]}\n"

    prompt = (
        f"Problem: {request.problemTitle}\n"
        f"Difficulty: {request.difficulty}\n"
        f"Description: {request.problemStatement[:1000]}\n"
        f"{code_context}\n"
        f"Instructions: {level_instructions[level]}\n"
        f"IMPORTANT: Do NOT give the complete solution. Do NOT write working code."
    )

    try:
        resp = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful coding tutor. You give hints that guide students toward the solution without giving it away. Be encouraging."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.4,
        )
        hint_text = resp.choices[0].message.content.strip()
        return {
            "hint": hint_text,
            "level": level,
            "remaining": llm_limiter.remaining(client_ip),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── 5. LLM Solution Explanation Endpoint ────────────────────────────────────

@app.post("/api/explain")
def explain_solution(request: ExplainRequest, req: Request):
    """Explain the optimal approach after a successful solve."""
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="LLM not configured")

    client_ip = req.client.host if req.client else "unknown"
    if not llm_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")

    prompt = (
        f"Problem: {request.problemTitle}\n"
        f"Description: {request.problemStatement[:1000]}\n\n"
        f"Student's accepted solution ({request.language}):\n{request.code[:2000]}\n\n"
        f"Provide:\n"
        f"1. A brief explanation of what their solution does and its time/space complexity\n"
        f"2. Whether this is the optimal approach. If not, describe the optimal approach\n"
        f"3. Key takeaway or pattern to remember for similar problems\n\n"
        f"Return JSON with keys: explanation, timeComplexity, spaceComplexity, isOptimal (bool), optimalApproach (string or null), keyTakeaway"
    )

    try:
        resp = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a computer science tutor explaining solutions. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=800,
            temperature=0.3,
        )
        txt = resp.choices[0].message.content.strip()
        try:
            result = json.loads(txt)
        except Exception:
            json_match = re.search(r'```(?:json)?\s*([\s\S]*?)```', txt)
            if json_match:
                try:
                    result = json.loads(json_match.group(1).strip())
                except Exception:
                    result = {"explanation": txt}
            else:
                result = {"explanation": txt}

        result["remaining"] = llm_limiter.remaining(client_ip)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chat")
def chat_tutor(request: ChatRequest, req: Request):
    """AI Chat Tutor — conversational programming teacher."""
    if not OPENAI_AVAILABLE or not OPENAI_API_KEY:
        raise HTTPException(status_code=503, detail="LLM not configured")

    client_ip = req.client.host if req.client else "unknown"
    if not llm_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Try again in a minute.")

    system_prompt = (
        "You are CogniCode AI Tutor — a friendly, expert programming teacher. "
        "You teach Data Structures, Algorithms, and programming concepts interactively. "
        "Guidelines:\n"
        "- Give clear, concise explanations with real code examples\n"
        "- Use analogies to explain complex concepts\n"
        "- When showing code, use markdown code blocks with the language specified\n"
        "- After explaining a concept, suggest a practice problem or ask a follow-up question to test understanding\n"
        "- If the user asks something off-topic, gently redirect to programming/CS topics\n"
        "- Keep responses focused and under 500 words unless the user asks for detail\n"
        "- Be encouraging and supportive\n"
    )

    # Build messages array with system prompt + conversation history (last 20 messages max)
    messages = [{"role": "system", "content": system_prompt}]
    for msg in request.messages[-20:]:
        messages.append({"role": msg.role, "content": msg.content})

    try:
        resp = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=1200,
            temperature=0.5,
        )
        reply = resp.choices[0].message.content.strip()
        remaining = llm_limiter.remaining(client_ip)
        return {"reply": reply, "remaining": remaining}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


def analyze_code_static(code: str, language: str) -> Optional[Dict[str, Any]]:
    """Static analysis helper for Python code"""
    lang = language.lower()
    if lang not in ("python", "python3", "python2"):
        return None
    
    try:
        complexity_results = radon_complexity.cc_visit(code)
        return {
            "functions": [
                {
                    "name": item.name,
                    "complexity": item.complexity,
                    "rank": item.letter
                }
                for item in complexity_results
            ]
        }
    except:
        return None


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
