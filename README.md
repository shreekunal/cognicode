# CogniCode — AI-Powered LeetCode Clone

CogniCode is a full-stack platform for practicing coding problems with real-time AI feedback on code quality, complexity, and approach.

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS
- **AI Backend**: Python (FastAPI), Radon
- **Database**: MongoDB (Mongoose)
- **Auth**: NextAuth.js
- **Execution**: Piston API / OneCompiler

---

## 🚀 Production Deployment Guide

### 1. Database (MongoDB Atlas)
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/).
- In **Network Access**, allow access from all IPs (`0.0.0.0/0`) since Vercel IPs are dynamic.
- Get your connection string (e.g., `mongodb+srv://...`).

### 2. AI Backend (Render)
- Deploy the `/python-backend` directory to [Render](https://render.com/).
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python main.py`
- **Environment Variables**:
    - `MONGO_URL`: Your MongoDB Atlas string.
    - `OPENAI_API_KEY`: Your AI provider key.
    - `FRONTEND_URL`: Your final Vercel URL (e.g., `https://cognicode.vercel.app`).

### 3. Frontend (Vercel)
- Connect your repository to [Vercel](https://vercel.com/).
- **Root Directory**: `./` (default)
- **Environment Variables**:
    - `MONGO_URL`: Your MongoDB Atlas string.
    - `PYTHON_BACKEND_URL`: Your Render service URL (e.g., `https://cogni-api.onrender.com`).
    - `NEXTAUTH_SECRET`: A random 32-character string.
    - `NEXTAUTH_URL`: Your final Vercel URL.
    - `NEXT_PUBLIC_BASE_PATH`: `/cognicode` (or remove if deploying to root).

---

## 🛠️ Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   cd python-backend && pip install -r requirements.txt
   ```

2. **Setup Environment**:
   - Copy `.env.example` to `.env` and fill in the values.

3. **Run Everything**:
   ```bash
   ./start-all.sh
   ```
   Or individually:
   - Frontend: `npm run dev`
   - Backend: `npm run python`

---

## 📝 Troubleshooting & Notes

### Base Path (`/cognicode`)
By default, this project is configured to run on the subpath `/cognicode` (e.g., `domain.com/cognicode`).
- If you want to deploy to the **root** of your domain:
  1. Open `next.config.mjs` and remove the `basePath` property.
  2. Search and replace all occurrences of `/cognicode` with `/` in the codebase.
  3. Update `NEXT_PUBLIC_BASE_PATH` in your environment variables.

### Common Issues
- **Python Backend Sleeping**: If using Render's free tier, the AI features might take 30-60 seconds to respond on the first request after being idle.
- **MongoDB Connection**: Ensure your Atlas cluster has "Allow access from anywhere" (IP `0.0.0.0/0`) enabled.
- **Auth Errors**: Make sure `NEXTAUTH_URL` matches your actual deployment URL exactly.

---

## 📂 Project Structure
- `/app`: Next.js pages and API routes.
- `/components`: React components (Shared and Workspace).
- `/models`: Mongoose schemas.
- `/python-backend`: FastAPI service for AI analysis.
- `/utils`: Database utilities and third-party API integrations.
