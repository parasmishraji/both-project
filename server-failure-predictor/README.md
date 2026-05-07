# 🖥️ Server Failure Predictor

A real-time enterprise server health monitoring system that predicts failures using **XGBoost** machine learning. Live metrics are streamed via **WebSockets** with built-in handling for up to 25% missing data.

## Features

- ⚡ **Real-time streaming** — Live server metrics every 2 seconds via WebSocket
- 🤖 **XGBoost ML model** — Binary classifier trained on synthetic data with native NaN handling
- 🌍 **Multi-datacenter** — Simulates 20 servers across 4 global data centers (US-East, EU-West, AP-South, US-West)
- 📊 **Failure probability** — Each server gets a 0–100% failure score, classified as Healthy / Warning / Critical
- 🔧 **Missing data resilient** — Handles ~10% missing metrics in live stream (trained on 25% missing)

## Architecture

```
server-failure-predictor/
├── backend/
│   ├── main.py              # FastAPI + WebSocket server
│   ├── train_model.py       # Synthetic data generation + XGBoost training
│   ├── requirements.txt     # Python dependencies
│   ├── xgboost_model.json   # Pre-trained model file
│   └── venv/                # Python virtual environment (git-ignored)
├── frontend/
│   ├── src/                 # React components
│   ├── package.json         # Node.js dependencies
│   └── vite.config.js       # Vite configuration
├── render.yaml              # Render deployment config
└── README.md
```

## Prerequisites

- **Python 3.11+** → [Download](https://www.python.org/downloads/)
- **Node.js 18+** and **npm** → [Download](https://nodejs.org/)

## Run Locally

### 1. Backend Setup

```bash
# Navigate to the backend directory
cd server-failure-predictor/backend

# Create a Python virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate        # macOS / Linux
# .\venv\Scripts\Activate.ps1   # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Train the XGBoost model (skip if xgboost_model.json already exists)
python train_model.py

# Start the backend server
uvicorn main:app --reload --port 8000
```

✅ Backend running at **http://localhost:8000**
✅ WebSocket endpoint at **ws://localhost:8000/ws/stream**

### 2. Frontend Setup

Open a **new terminal**:

```bash
# Navigate to the frontend directory
cd server-failure-predictor/frontend

# Install dependencies
npm install

# Create your environment file
cp .env.example .env

# Verify .env contains the correct backend WebSocket URL:
# VITE_WS_URL=ws://localhost:8000/ws/stream

# Start the dev server
npm run dev
```

✅ Frontend running at **http://localhost:5174**

### 3. Open the Dashboard

Go to the frontend URL in your browser. The dashboard will automatically connect to the WebSocket and start streaming live server metrics.

## API Endpoints

| Endpoint | Type | Description |
|---|---|---|
| `GET /` | HTTP | Health check |
| `ws://localhost:8000/ws/stream` | WebSocket | Live metrics stream (every 2s) |

## WebSocket Payload

Each message has this shape:

```json
{
  "type": "metrics_update",
  "data": [
    {
      "server_id": "srv-001",
      "data_center": "US-East",
      "cpu_usage": 42.5,
      "memory_usage": 55.1,
      "disk_io": 8.3,
      "network_latency": 12.7,
      "failure_probability": 0.12,
      "status": "Healthy"
    }
  ]
}
```

## Troubleshooting

**Port already in use:**
```bash
lsof -i :8000
kill -9 <PID>
```

**Model not found error:**
```bash
cd server-failure-predictor/backend
source venv/bin/activate
python train_model.py
```

## Deployment

- **Backend** → Render (configured via `render.yaml`)
- **Frontend** → Vercel

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, XGBoost, Pandas, NumPy, WebSockets |
| Frontend | React 19, Vite 8, Lucide Icons |
| ML Model | XGBoost binary classifier (100 estimators, depth 5) |
| Streaming | WebSocket (2s interval) |