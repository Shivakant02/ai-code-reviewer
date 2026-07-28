# 🤖 Code-Pilot

[![NestJS](https://img.shields.io/badge/Backend-NestJS_10-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![FastAPI](https://img.shields.io/badge/AI_Service-FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React_18_(_Vite_)-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/ORM-Prisma_7-2D3748?style=flat-square&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Gemini](https://img.shields.io/badge/AI-Google_Gemini_(3.5/3.6_Flash)-4285F4?style=flat-square&logo=google&logoColor=white)](https://aistudio.google.com/)

An enterprise-grade, automated GitHub Pull Request review assistant powered by **Google's Gemini AI** (`gemini-3.5-flash`, `gemini-3.6-flash`, and `gemini-2.5-flash`). 

When a developer opens or updates a Pull Request on GitHub, Code-Pilot automatically analyzes the code diffs, scores the PR, generates an executive summary, and posts **inline, line-by-line code review comments directly onto the GitHub Pull Request** while maintaining a full review history in a sleek, dark-mode web dashboard.

---

## ✨ Key Features

- **🚀 Automated Line-by-Line Code Review**: Analyzes code diffs in real-time and posts inline review suggestions, bug warnings, and praise directly onto GitHub PRs using Octokit.
- **🛡️ Resilient Multi-Model AI Pipeline**: Powered by Google Gemini with **automatic retry and self-healing model fallback** (`gemini-3.5-flash` ➡️ `gemini-3.6-flash` ➡️ `gemini-2.5-flash`), protecting against 503 High Demand spikes and rate limits.
- **🔌 Seamless GitHub Integration**: Connect repositories in one click with GitHub OAuth and automatic webhook registration (`pull_request` events).
- **📊 Real-Time Dashboard**: Beautiful, responsive dashboard built with React 18, Vite, shadcn/ui, and Tailwind CSS to track PR statuses, scores, and historical feedback.
- **⚡ Async Queue Processing**: Built on NestJS, Redis, and Bull queues to process heavy AI code diff analysis asynchronously without timing out GitHub webhooks.
- **🗄️ Future-Proof Database Architecture**: Utilizes PostgreSQL 16 with `pgvector` enabled for upcoming RAG (Retrieval-Augmented Generation) and repository context embedding features.

---

## 🏗️ System Architecture

```mermaid
graph TD
    Dev[👨‍💻 Developer on GitHub] -->|1. Raises / Updates PR| GH[GitHub API & Webhooks]
    GH -->|2. POST /webhooks/github| Nest[⚡ NestJS Backend API]
    Nest -->|3. Push Job| Redis[(🔥 Redis / Bull Queue)]
    Redis -->|4. Consume Job| Worker[👷 Review Processor Worker]
    Worker -->|5. Fetch PR Diffs| GH
    Worker -->|6. POST /api/review| FastAPI[🐍 Python AI Service]
    FastAPI -->|7. Generate Review| Gemini[🧠 Google Gemini API <br/> 3.5 / 3.6 / 2.5 Flash]
    Gemini -->|8. Structured JSON| FastAPI
    FastAPI -->|9. Review Response| Worker
    Worker -->|10. Save Review| DB[(🐘 PostgreSQL + pgvector)]
    Worker -->|11. Post Inline Comments| GH
    UI[🖥️ React Web Dashboard] -->|12. Fetch Stats & Reviews| Nest
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, TanStack Query (React Query), Lucide Icons |
| **Backend API** | NestJS 10, TypeScript, Prisma 7 (`@prisma/adapter-pg` with `pg`), Passport GitHub OAuth, Bull Queue |
| **AI Service** | Python 3.12+, FastAPI, Uvicorn, Google GenAI SDK (`google-genai`), Pydantic Structured Output |
| **Database & Cache** | PostgreSQL 16 (with `pgvector`), Redis 7 Alpine |
| **DevOps & Tools** | Docker & Docker Compose, ngrok / untun (for local webhook tunneling) |

---

## 📋 Prerequisites

Before starting, ensure you have the following installed on your machine:
- **Node.js**: `v18.x` or higher & **npm**
- **Python**: `v3.12` or higher & **pip** / **venv**
- **Docker**: Docker Desktop or Docker Engine with Docker Compose
- **Google Gemini API Key**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com/)
- **GitHub OAuth App**: Create an OAuth app on GitHub for authentication
- **ngrok**: Installed via Homebrew (`brew install ngrok/ngrok/ngrok`) or `npx untun` for webhook tunneling

---

## 🚀 Getting Started Guide

### 1. Configure GitHub OAuth App
1. Go to **GitHub** ➡️ **Settings** ➡️ **Developer settings** ➡️ **OAuth Apps** ➡️ **New OAuth App**.
2. Set **Homepage URL** to `http://localhost:5173`.
3. Set **Authorization callback URL** to `http://localhost:3001/auth/github/callback`.
4. Copy your `Client ID` and generate a new `Client Secret`.

### 2. Environment Setup
Create the required environment files across the project:

#### Root `.env` (for Docker Compose)
```env
POSTGRES_USER=reviewer
POSTGRES_PASSWORD=reviewer_secret
POSTGRES_DB=ai_code_reviewer
DATABASE_URL="postgresql://reviewer:reviewer_secret@localhost:5432/ai_code_reviewer?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### `backend/.env`
```env
PORT=3001
NODE_ENV=development
DATABASE_URL="postgresql://reviewer:reviewer_secret@localhost:5432/ai_code_reviewer?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET="super-secret-jwt-key-replace-in-production"
GITHUB_CLIENT_ID="your_github_client_id"
GITHUB_CLIENT_SECRET="your_github_client_secret"
GITHUB_CALLBACK_URL="http://localhost:3001/auth/github/callback"
WEBHOOK_BASE_URL="https://your-ngrok-url.ngrok-free.app" # Set after starting ngrok
AI_SERVICE_URL="http://localhost:8000"
```

#### `ai-service/.env`
```env
GOOGLE_API_KEY="your_google_gemini_api_key"
GEMINI_MODEL="gemini-3.5-flash"
AI_SERVICE_PORT=8000
DEBUG=true
FRONTEND_URL="http://localhost:5173"
BACKEND_URL="http://localhost:3001"
```

#### `frontend/.env`
```env
VITE_API_BASE_URL="http://localhost:3001"
```

---

### 3. Start Infrastructure (PostgreSQL & Redis)
Start the PostgreSQL (with pgvector) and Redis containers using Docker Compose:
```bash
docker compose up -d
```
Verify they are healthy:
```bash
docker compose ps
```

---

### 4. Setup & Start the AI Service (Python FastAPI)
Open a terminal tab for the AI service:
```bash
cd ai-service
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000 --reload
```
*The AI Service API docs will be available at `http://localhost:8000/docs`.*

---

### 5. Setup & Start the Backend (NestJS)
Open a second terminal tab for the NestJS backend:
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```
*The Backend server will run on `http://localhost:3001` and Swagger API docs at `http://localhost:3001/api/docs`.*

---

### 6. Setup & Start the Frontend Web Dashboard (React / Vite)
Open a third terminal tab for the web frontend:
```bash
cd frontend
npm install
npm run dev
```
*Open your browser and navigate to **`http://localhost:5173`** to access the dashboard!*

---

### 7. Setup Live Webhook Tunneling (ngrok)
To allow GitHub's cloud servers to trigger code reviews on your local machine when a Pull Request is opened:

1. Start an ngrok HTTP tunnel on port 3001:
   ```bash
   ngrok http 3001
   ```
2. Copy the HTTPS Forwarding URL (e.g., `https://a1b2-c3d4.ngrok-free.app`).
3. Paste this URL into `backend/.env` under `WEBHOOK_BASE_URL=https://...`.
4. Restart your NestJS backend server (`Ctrl+C` ➡️ `npm run start:dev`).
5. Open the web dashboard at `http://localhost:5173`, log in with GitHub, navigate to **Repositories**, click **Connect Repository**, and connect your target repo!
   *(Connecting the repo automatically registers your live ngrok webhook URL directly on your GitHub repository!)*

---

## 🧪 Testing an Automated Code Review

1. Create a new branch in your connected GitHub repository:
   ```bash
   git checkout -b test/ai-review-demo
   ```
2. Make some code modifications (or introduce a deliberate bug/code smell) and commit:
   ```bash
   git commit -am "feat: added new utility function with potential null pointer"
   git push origin test/ai-review-demo
   ```
3. Open a **Pull Request** on GitHub against your default branch (`main` or `master`).
4. Within 5–10 seconds:
   - 🔄 Our NestJS server receives the `pull_request` webhook event.
   - 🧠 The Bull queue worker fetches the diff and invokes Gemini 3.5 Flash.
   - 💬 **Gemini posts an executive review summary and inline, line-by-line comments directly onto your GitHub Pull Request!**
   - 📊 The review score and analytics appear instantly on your React web dashboard!

---

## 🗺️ Roadmap & Future Enhancements (MVP 2)

- [ ] **Interactive Scout Mode (Reply & Resolve)**: Listen to `pull_request_review_comment` webhooks so developers can reply to inline AI comments with questions (`@ai why?`), and automatically resolve GitHub review threads when follow-up commits fix reported bugs using GitHub's GraphQL API.
- [ ] **RAG & Repository Embeddings (`pgvector`)**: Index codebase history and documentation into pgvector to provide context-aware reviews that adhere to project-specific architectural patterns.
- [ ] **Custom Team Prompts & Rules**: Allow repository admins to configure custom review guidelines and severity thresholds directly from the dashboard UI.

---

## 📝 License

This project is licensed under the MIT License.
