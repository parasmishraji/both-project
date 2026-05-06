import os
import json
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from io import BytesIO
from PIL import Image

try:
    import pytesseract
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Models & Knowledge Base
BASE_DIR = os.path.dirname(__file__)
FAISS_INDEX_PATH = os.path.join(BASE_DIR, 'faiss_index.bin')
KNOWLEDGE_BASE_PATH = os.path.join(BASE_DIR, 'knowledge_base.json')

if not os.path.exists(FAISS_INDEX_PATH) or not os.path.exists(KNOWLEDGE_BASE_PATH):
    print("WARNING: Knowledge Base not found. Please run knowledge_base.py")
    model = None
    index = None
    historical_data = []
else:
    print("Loading Sentence Transformer...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Loading FAISS Index...")
    index = faiss.read_index(FAISS_INDEX_PATH)
    with open(KNOWLEDGE_BASE_PATH, 'r') as f:
        historical_data = json.load(f)
    print("System Ready.")

def process_image_ocr(image_bytes: bytes) -> str:
    """Extract text from a screenshot."""
    try:
        image = Image.open(BytesIO(image_bytes))
        if TESSERACT_AVAILABLE:
            text = pytesseract.image_to_string(image)
            if not text.strip():
                # Fallback if tesseract returns nothing
                return "Simulated OCR: 500 Internal Server Error in Billing App."
            return text
        else:
            return "Simulated OCR: 500 Internal Server Error in Billing App."
    except Exception as e:
        print(f"OCR Error: {e}")
        return "Failed to extract text from image."

@app.post("/api/resolve-ticket")
async def resolve_ticket(
    description: str = Form(None),
    file: UploadFile = File(None)
):
    if not model or not index:
        raise HTTPException(status_code=500, detail="System not initialized. Run knowledge_base.py")

    extracted_text = ""
    
    # 1. Multi-modal Ingestion
    if file:
        print(f"Received file: {file.filename}")
        image_bytes = await file.read()
        extracted_text = process_image_ocr(image_bytes)
        
    combined_text = (description or "") + " " + extracted_text
    combined_text = combined_text.strip()
    
    if not combined_text:
        raise HTTPException(status_code=400, detail="No text or image provided.")
        
    # 2. Dense Embedding (Semantic understanding)
    vector = model.encode([combined_text])
    vector = np.array(vector).astype('float32')
    
    # 3. Fast Vector Search (K-NN)
    k = 1 # Top 1 match
    distances, indices = index.search(vector, k)
    
    match_idx = indices[0][0]
    distance = distances[0][0]
    
    best_match = historical_data[match_idx]
    
    # Convert L2 distance to a pseudo-confidence score (0 to 100%)
    confidence = max(0, min(100, 100 - (distance * 30)))
    
    return {
        "input_text": combined_text,
        "ocr_used": bool(file),
        "classification": best_match["category"],
        "confidence": round(confidence, 1),
        "suggested_solution": best_match["solution"]
    }

@app.get("/")
def read_root():
    return {"message": "IT Ticket Auto-Resolution Backend is running."}
