# 🚀 AI/ML Full-Stack Projects

This monorepo contains two production-ready AI/ML full-stack applications built with **FastAPI** (Python) backends and **React + Vite** frontends.

| Project | Description | Backend Port | Frontend Port |
|---|---|---|---|
| [AutoTicket](#-autoticket) | AI-powered IT ticket auto-resolution using semantic search | `8001` | `5173` |
| [Server Failure Predictor](#-server-failure-predictor) | Real-time server failure prediction with XGBoost + WebSockets | `8000` | `5174` |

---

## Prerequisites

Make sure you have the following installed:

- **Python 3.11+** → [Download](https://www.python.org/downloads/)
- **Node.js 18+** and **npm** → [Download](https://nodejs.org/)
- **Git** → [Download](https://git-scm.com/)
- *(Optional)* **Tesseract OCR** → needed for AutoTicket image-to-text. [Install guide](https://github.com/tesseract-ocr/tesseract#installing-tesseract)

---

## 🎫 AutoTicket

An AI-powered IT helpdesk tool that automatically classifies and resolves support tickets using **Sentence Transformers** for semantic understanding and **FAISS** for fast vector search. Supports multimodal input (text + screenshot OCR).

### Architecture

```
autoticket/
├── backend/            # FastAPI + Sentence Transformers + FAISS
│   ├── main.py             # API server (POST /api/resolve-ticket)
│   ├── knowledge_base.py   # Builds FAISS index from historical tickets
│   ├── requirements.txt
│   ├── faiss_index.bin      # Pre-built vector index
│   └── knowledge_base.json # Historical ticket data
├── frontend/           # React + Vite
│   ├── src/
│   ├── package.json
│   └── .env.example
└── render.yaml         # Render deployment config
```

### Run Locally

#### 1. Start the Backend

```bash
# Navigate to the backend directory
cd autoticket/backend

# Create a Python virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Build the knowledge base (generates FAISS index + JSON data)
# Skip this step if faiss_index.bin and knowledge_base.json already exist
python knowledge_base.py

# Start the backend server on port 8001
uvicorn main:app --reload --port 8001
```

The backend API will be running at **http://localhost:8001**

#### 2. Start the Frontend

Open a **new terminal** tab/window:

```bash
# Navigate to the frontend directory
cd autoticket/frontend

# Install Node.js dependencies
npm install

# Create your environment file
cp .env.example .env

# Verify .env contains the correct backend URL:
# VITE_API_URL=http://localhost:8001

# Start the dev server
npm run dev
```

The frontend will be running at **http://localhost:5173**

#### 3. Test It

1. Open **http://localhost:5173** in your browser
2. Type a ticket description like `"VPN not connecting"` or `"printer out of toner"`
3. Optionally upload a screenshot of an error
4. The AI will classify the ticket and suggest a resolution

---

## 🖥️ Server Failure Predictor

A real-time server health monitoring dashboard that uses **XGBoost** to predict server failures across simulated data centers. Streams live metrics via **WebSockets** with ~10% missing data handling built-in.

### Architecture

```
server-failure-predictor/
├── backend/             # FastAPI + XGBoost + WebSockets
│   ├── main.py              # WebSocket server (ws://localhost:8000/ws/stream)
│   ├── train_model.py       # Generates synthetic data & trains XGBoost
│   ├── requirements.txt
│   └── xgboost_model.json   # Pre-trained model
├── frontend/            # React + Vite
│   ├── src/
│   └── package.json
└── render.yaml          # Render deployment config
```

### Run Locally

#### 1. Start the Backend

```bash
# Navigate to the backend directory
cd server-failure-predictor/backend

# Create a Python virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Train the XGBoost model (generates xgboost_model.json)
# Skip this step if xgboost_model.json already exists
python train_model.py

# Start the backend server on port 8000
uvicorn main:app --reload --port 8000
```

The backend API will be running at **http://localhost:8000**
WebSocket endpoint: **ws://localhost:8000/ws/stream**

#### 2. Start the Frontend

Open a **new terminal** tab/window:

```bash
# Navigate to the frontend directory
cd server-failure-predictor/frontend

# Install Node.js dependencies
npm install

# Create your environment file
cp .env.example .env

# Verify .env contains the correct backend WebSocket URL:
# VITE_WS_URL=ws://localhost:8000/ws/stream

# Start the dev server
npm run dev
```

The frontend will be running at **http://localhost:5174**

#### 3. Test It

1. Open the frontend URL in your browser
2. The dashboard will auto-connect via WebSocket and stream live server metrics every 2 seconds
3. Watch for **Critical** (red) and **Warning** (yellow) servers — `srv-003` and `srv-012` are designed to occasionally spike

---

## 🛑 Troubleshooting

### Port already in use

If you get `Error: Address already in use`, kill the process on that port:

```bash
# Find the process using the port (e.g. 8001)
lsof -i :8001

# Kill it
kill -9 <PID>
```

### Virtual environment not activating

Make sure you're using the correct activation command for your shell:

```bash
# bash / zsh (macOS / Linux)
source venv/bin/activate

# fish
source venv/bin/activate.fish

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1
```

### Missing Tesseract (AutoTicket only)

If OCR isn't working, install Tesseract:

```bash
# macOS
brew install tesseract

# Ubuntu/Debian
sudo apt-get install tesseract-ocr

# The app will still work without it — it falls back to simulated OCR
```

---

## 🚀 Deployment

Both projects are configured for cloud deployment:

| Component | Platform | Config File |
|---|---|---|
| AutoTicket Backend | Render | `autoticket/render.yaml` |
| AutoTicket Frontend | Vercel | `autoticket/frontend/vercel.json` |
| Server Failure Predictor Backend | Render | `server-failure-predictor/render.yaml` |
| Server Failure Predictor Frontend | Vercel | Deploy via Vercel dashboard |

For production, update the frontend environment variables to point to your deployed backend URLs.

---

## 📝 Tech Stack

| Layer | AutoTicket | Server Failure Predictor |
|---|---|---|
| **Backend** | FastAPI, Sentence Transformers, FAISS, Tesseract OCR | FastAPI, XGBoost, Pandas, WebSockets |
| **Frontend** | React 19, Vite 8, Axios, Lucide Icons | React 19, Vite 8, Lucide Icons |
| **ML Model** | all-MiniLM-L6-v2 (384-dim embeddings) | XGBoost (binary classifier) |
| **Python** | 3.11+ | 3.11+ |