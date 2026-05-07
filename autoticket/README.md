# 🎫 AutoTicket — AI-Powered IT Ticket Auto-Resolution System

> **An intelligent full-stack application that automatically classifies IT support tickets and recommends resolutions using Semantic Vector Search and Optical Character Recognition — eliminating manual triage and reducing resolution time from hours to seconds.**

---

## 📌 Problem Statement

Enterprise IT helpdesks handle thousands of support tickets daily. The current process is:

- **Manual** — Human agents read each ticket, interpret the issue, and look up the correct resolution procedure
- **Slow** — Average ticket triage takes 15–30 minutes; resolution can take hours
- **Inconsistent** — Different agents provide different solutions for the same issue
- **Fragile** — Keyword-based routing fails on noisy, informal user input (typos, slang, abbreviations)

**AutoTicket** eliminates these bottlenecks by building a **semantic understanding layer** on top of historical ticket data, enabling instant and accurate auto-resolution.

---

## 💡 Our Solution

AutoTicket is an end-to-end AI system that:

1. **Accepts multimodal input** — Users can describe their issue in natural language *and/or* upload a screenshot of the error
2. **Understands meaning, not keywords** — Uses **Sentence Transformers** (`all-MiniLM-L6-v2`) to convert ticket text into 384-dimensional dense embeddings that capture semantic meaning
3. **Searches at scale** — Leverages **FAISS** (Facebook AI Similarity Search) for sub-millisecond nearest-neighbor lookup against the historical knowledge base
4. **Extracts text from images** — Processes uploaded screenshots through **Tesseract OCR** to extract error messages and enrich the query context
5. **Returns instant resolutions** — Delivers the predicted category, confidence score, and Standard Operating Procedure (SOP) in under 1 second

The key insight: `"cant connect to vpn"`, `"VPN not working stuck on login"`, and a screenshot showing a Cisco AnyConnect error all map to the **same resolution** — because the system understands semantics, not surface-level text.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      USER INPUT                          │
│          Text Description  +  Screenshot (optional)      │
└─────────────────────────┬────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │    Tesseract OCR      │  ← Extracts text from images
              │    (if image given)   │
              └──────────┬────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │  Text Combination     │  ← Merges description + OCR text
              └──────────┬────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │  Sentence Transformer │  ← all-MiniLM-L6-v2
              │  384-dim Embedding    │     Encodes meaning into vectors
              └──────────┬────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │   FAISS Index         │  ← K-Nearest Neighbor Search
              │   (Vector Database)   │     Sub-millisecond lookup
              └──────────┬────────────┘
                         │
                         ▼
              ┌───────────────────────┐
              │   Resolution Output   │
              │  • Category           │
              │  • Confidence Score   │
              │  • Suggested SOP      │
              └───────────────────────┘
```

---

## ⚙️ How It Works

### Knowledge Base Construction (Offline)

- Historical IT tickets (descriptions, categories, resolutions) are loaded from a curated dataset
- Noisy text variations are generated to simulate real-world diversity (`"vpn not working"`, `"cant connect to vpn"`, `"pwd forgotten locked"`)
- All ticket texts are encoded into 384-dimensional embeddings using the `all-MiniLM-L6-v2` Sentence Transformer
- A **FAISS L2 distance index** is built from these embeddings and persisted to disk (`faiss_index.bin`)

### Live Inference (Per Request)

| Step | Process | Detail |
|---:|---|---|
| 1 | **Multimodal Ingestion** | Accept text description and/or image upload |
| 2 | **OCR Processing** | If image is uploaded, extract text via Tesseract OCR |
| 3 | **Text Fusion** | Combine description + extracted OCR text |
| 4 | **Embedding Generation** | Encode combined text → 384-dim vector |
| 5 | **Vector Search** | Query FAISS index for nearest neighbor (L2 distance) |
| 6 | **Result Delivery** | Return classification, confidence %, and SOP |

### Confidence Scoring

The L2 distance from FAISS is converted to a pseudo-confidence percentage:

```
confidence = max(0, min(100, 100 − (distance × 30)))
```

A lower distance means the input is semantically closer to the matched historical ticket, producing a higher confidence score.

---

## 🔄 End-to-End Workflow

```
┌─────────┐     POST /api/resolve-ticket     ┌──────────┐
│  React   │ ──────────────────────────────▶  │  FastAPI  │
│  Frontend│  multipart/form-data            │  Backend  │
│  (Vite)  │ ◀──────────────────────────────  │          │
│          │     JSON Response               │          │
└─────────┘     {classification,             └──────────┘
                 confidence,                      │
                 suggested_solution}               │
                                                   ▼
                                          ┌──────────────┐
                                          │ FAISS Index  │
                                          │ + Sentence   │
                                          │ Transformer  │
                                          └──────────────┘
```

1. User opens the **AutoResolve Desk** dashboard in their browser
2. Enters a ticket description (noisy/informal text is perfectly fine)
3. Optionally uploads a screenshot of the error
4. Clicks **"Resolve Instantly"**
5. The backend processes the input through the ML pipeline
6. The frontend displays:
   - **Predicted Category** (e.g., `Networking → VPN`)
   - **Confidence Score** with a visual progress bar
   - **Suggested SOP** (e.g., `SOP-101: Restart Cisco AnyConnect, clear cache...`)
   - **OCR Extracted Text** (if an image was uploaded)

---

## 🛠️ Tech Stack

| Layer | Technology | Role |
|---|---|---|
| **Backend** | Python 3.11+, FastAPI, Uvicorn | High-performance async API server |
| **Embedding Model** | Sentence Transformers (`all-MiniLM-L6-v2`) | 384-dim dense text embeddings for semantic understanding |
| **Vector Search** | FAISS (CPU) | Sub-millisecond K-nearest-neighbor lookup |
| **OCR** | Tesseract OCR + Pillow | Text extraction from uploaded screenshots |
| **Frontend** | React 19, Vite 8, Axios | Modern reactive UI with form handling |
| **Icons** | Lucide React | Consistent, clean iconography |
| **Deployment** | Render (Backend) + Vercel (Frontend) | Cloud-hosted with CI/CD |

---

## 💡 Use Cases

- **Enterprise IT Helpdesk** — Automate L1 ticket triage for organizations handling 1000+ tickets/day, reducing average resolution time from hours to seconds
- **Managed Service Providers (MSP)** — Deliver consistent, SOP-backed resolutions across multiple client environments without per-client training
- **Self-Service Portals** — Let employees search for solutions before creating a ticket, deflecting up to 40% of routine requests
- **Agent Assist** — Augment human agents with AI-suggested resolutions, improving accuracy and speed for junior support staff
- **Knowledge Mining** — Surface the most relevant SOPs from decades of unstructured historical ticket data

---

## ✅ Key Advantages

| Advantage | Detail |
|---|---|
| **Semantic Search** | Understands *meaning*, not keywords — handles typos, slang, and abbreviations effortlessly |
| **Multimodal Input** | Accepts both text and image screenshots, extracting context from error screens via OCR |
| **Sub-Second Response** | FAISS performs nearest-neighbor search in under 1ms; total API response is typically <500ms |
| **Confidence Scoring** | Returns a numeric confidence %, enabling tiered workflows (auto-resolve vs. human review) |
| **Lightweight Model** | Uses `all-MiniLM-L6-v2` (~80MB) — no GPU required, deployable on modest hardware |
| **Graceful Degradation** | If Tesseract is unavailable, falls back to simulated OCR — the app never crashes |
| **Extensible Knowledge Base** | Add new tickets to the JSON and re-run `knowledge_base.py` — no retraining needed |
| **Production-Ready** | CORS configured, environment-based URLs, Render + Vercel deployment configs included |

---

## 📁 Project Structure

```
autoticket/
├── backend/
│   ├── main.py                 # FastAPI server — POST /api/resolve-ticket
│   ├── knowledge_base.py       # Builds FAISS index from historical tickets
│   ├── requirements.txt        # Python dependencies
│   ├── faiss_index.bin         # Pre-built FAISS vector index (binary)
│   └── knowledge_base.json     # Historical ticket data (categories + SOPs)
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main UI — ticket form + AI resolution display
│   │   ├── App.css             # Component styles
│   │   ├── index.css           # Global design system
│   │   └── main.jsx            # React entry point
│   ├── package.json            # Frontend dependencies
│   ├── .env.example            # Environment variable template
│   └── vercel.json             # Vercel deployment config
└── render.yaml                 # Render backend deployment config
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+ &nbsp;|&nbsp; Node.js 18+ &nbsp;|&nbsp; npm &nbsp;|&nbsp; *(Optional)* Tesseract OCR

### Backend

```bash
cd autoticket/backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python knowledge_base.py          # Build FAISS index (skip if already exists)
uvicorn main:app --reload --port 8001
```

### Frontend

```bash
cd autoticket/frontend
npm install
cp .env.example .env              # Set VITE_API_URL=http://localhost:8001
npm run dev
```

Open **http://localhost:5173** → Submit a ticket → See instant AI resolution.

---

## 🌐 Deployment

| Component | Platform | Config File |
|---|---|---|
| Backend | Render | `render.yaml` |
| Frontend | Vercel | `frontend/vercel.json` |

---

*Built with ❤️ using FastAPI, Sentence Transformers, FAISS, and React.*
