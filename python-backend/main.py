from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import os
from dotenv import load_dotenv
import radon.complexity as radon_complexity
import radon.metrics as radon_metrics
import json
import re

load_dotenv()

app = FastAPI(title="CogniCode AI Backend - Python Edition", version="2.0.0")

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request/Response Models
class UserStats(BaseModel):
    accuracy: Optional[float] = 0.0
    problemsSolved: Optional[int] = 0
    avgTime: Optional[float] = 0.0
    lastDifficulty: Optional[str] = "medium"


class RecommendationRequest(BaseModel):
    userStats: UserStats


class CodeReviewRequest(BaseModel):
    code: str
    language: str


class ComplexityRequest(BaseModel):
    code: str
    language: str


# Health check
@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "version": "2.0.0",
        "mode": "python-heuristics",
        "features": ["recommendation", "code_review", "complexity_analysis"]
    }


# 1. Next Question Recommendation
@app.post("/api/recommend")
def recommend_next_question(request: RecommendationRequest):
    """Recommend next question based on user performance using heuristics"""
    
    stats = request.userStats
    accuracy_pct = stats.accuracy * 100
    problems_solved = stats.problemsSolved
    avg_time = stats.avgTime
    
    # Advanced heuristic algorithm
    difficulty = "medium"
    topic = "arrays"
    reason = ""
    
    # Difficulty based on accuracy
    if accuracy_pct < 50:
        difficulty = "easy"
        reason = f"Low accuracy ({accuracy_pct:.1f}%) - practice fundamentals"
    elif accuracy_pct < 70:
        difficulty = "medium"
        reason = f"Moderate accuracy ({accuracy_pct:.1f}%) - continue building skills"
    elif accuracy_pct < 85:
        difficulty = "hard"
        reason = f"Good accuracy ({accuracy_pct:.1f}%) - ready for challenges"
    else:
        difficulty = "hard"
        reason = f"Excellent accuracy ({accuracy_pct:.1f}%) - tackle advanced problems"
    
    # Topic recommendation based on problem count
    if problems_solved < 5:
        topic = "arrays"
    elif problems_solved < 10:
        topic = "strings"
    elif problems_solved < 15:
        topic = "linked lists"
    elif problems_solved < 20:
        topic = "trees"
    else:
        topic = "dynamic programming"
    
    # Time-based adjustments
    if avg_time and avg_time > 600:
        reason += ". Take your time to understand concepts deeply."
    elif avg_time and avg_time < 120:
        reason += ". You're fast! Try more complex problems."
    
    return {
        "fromAI": False,
        "source": "python-heuristics",
        "recommended": {
            "difficulty": difficulty,
            "title": f"Try a {difficulty} {topic} problem",
            "topic": topic,
            "reason": reason,
            "problemsSolved": problems_solved,
            "nextMilestone": (problems_solved // 5 + 1) * 5
        }
    }


# 2. Code Review
@app.post("/api/review")
def review_code(request: CodeReviewRequest):
    """Review code using pattern matching and static analysis"""
    
    bugs: List[str] = []
    style: List[str] = []
    performance: List[str] = []
    best_practices: List[str] = []
    
    code = request.code
    language = request.language.lower()
    
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
    elif language in ["javascript", "js"]:
        if "var " in code:
            style.append("Use 'let' or 'const' instead of 'var'")
        # Find loose equality (==) that isn't strict (===)
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
    
    # Generic checks for all languages
    if re.search(r'TODO|FIXME|HACK', code, re.IGNORECASE):
        best_practices.append("Remove TODO/FIXME comments before production")
    
    if not bugs and not style and not performance and not best_practices:
        style.append("Code looks clean! No obvious issues found.")
    
    # Get static analysis
    static_analysis = analyze_code_static(code, language)
    
    summary = f"Found {len(bugs)} potential bugs, {len(style)} style issues, {len(performance)} performance improvements"
    
    return {
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


# 3. Complexity Analysis
@app.post("/api/complexity")
def analyze_complexity(request: ComplexityRequest):
    """Analyze time and space complexity using pattern matching"""
    
    code = request.code
    language = request.language.lower()
    
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
    
    # Count nested loops
    nested_loops = len(re.findall(r'for.*:.*for', code.replace('\n', ' ')))
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
    elif language in ["javascript", "js"]:
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
    
    # Space complexity analysis
    if re.search(r'(\[\]|\{\}|new Array|new Object)', code):
        if nested_loops >= 1:
            space_complexity = "O(n²)"
            explanation += ". Creates auxiliary data structure in nested loop"
        else:
            space_complexity = "O(n)"
            explanation += ". Creates auxiliary data structure"
    
    if not suggestions:
        suggestions.append("Code appears reasonably efficient")
    
    return {
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


def analyze_code_static(code: str, language: str) -> Optional[Dict[str, Any]]:
    """Static analysis helper for Python code"""
    if language.lower() != "python":
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
