import json
import os
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer
import faiss

KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(__file__), 'knowledge_base.json')
FAISS_INDEX_PATH = os.path.join(os.path.dirname(__file__), 'faiss_index.bin')

# Seed data: 5,000 issue types simulated via a smaller set of highly distinct categories for the PoC
HISTORICAL_TICKETS = [
    {
        "id": 1,
        "text": "User cannot connect to the corporate VPN. The client is stuck on 'Verifying credentials'.",
        "category": "Networking -> VPN",
        "solution": "SOP-101: Restart the Cisco AnyConnect service, clear the local cache, and verify the user's 2FA token is synced."
    },
    {
        "id": 2,
        "text": "my screen is totally black no power",
        "category": "Hardware -> Monitor",
        "solution": "SOP-204: Check the physical power cable connection. If connected, test with a known working outlet. Replace monitor if no POST."
    },
    {
        "id": 3,
        "text": "The billing application is throwing a 500 Internal Server Error when generating monthly invoices.",
        "category": "Software -> Internal App -> Billing",
        "solution": "SOP-305: Check the billing-service Kubernetes pod logs. If 'OOMKilled', increase memory limit. Otherwise, verify database connection pool."
    },
    {
        "id": 4,
        "text": "Printer on 4th floor is out of cyan toner. Blinking red light.",
        "category": "Hardware -> Printer",
        "solution": "SOP-401: Dispatch local site technician to replace Cyan Toner Cartridge (Part #T-882). Clean the drum while replacing."
    },
    {
        "id": 5,
        "text": "I forgot my password and my account is locked out after too many tries.",
        "category": "Access -> Active Directory",
        "solution": "SOP-502: Agent should authenticate user via phone call using security questions, then unlock AD account and trigger a forced password reset email."
    },
    {
        "id": 6,
        "text": "Zoom is freezing during screen share on Mac.",
        "category": "Software -> 3rd Party -> Zoom",
        "solution": "SOP-603: Update Zoom client to latest version. If issue persists, disable Hardware Acceleration in Zoom Video Settings."
    }
]

# Generate more noisy variations to simulate the 2 million historical tickets
def generate_variations():
    variations = []
    # Add the base ones
    for t in HISTORICAL_TICKETS:
        variations.append(t)
    
    # Just a few noisy examples to prove semantic matching works
    noisy_texts = [
        ("cant connect to vpn", 1),
        ("vpn not working stuck on login", 1),
        ("monitor dead", 2),
        ("screen black no lights", 2),
        ("billing app crashed", 3),
        ("invoice 500 error", 3),
        ("need cyan ink 4th fl", 4),
        ("printer blinking red out of toner", 4),
        ("pwd forgotten locked", 5),
        ("account locked help", 5),
        ("zoom freezing macbook", 6),
        ("screen share breaks zoom", 6),
    ]
    
    idx = 100
    for text, base_id in noisy_texts:
        base = next(item for item in HISTORICAL_TICKETS if item["id"] == base_id)
        variations.append({
            "id": idx,
            "text": text,
            "category": base["category"],
            "solution": base["solution"]
        })
        idx += 1
        
    return variations

def build_knowledge_base():
    print("Initializing Sentence Transformer model (all-MiniLM-L6-v2)...")
    # Using a fast, lightweight model for dense embeddings
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Generating ticket variations...")
    data = generate_variations()
    
    texts = [item["text"] for item in data]
    print(f"Generating embeddings for {len(texts)} historical tickets...")
    
    embeddings = model.encode(texts, show_progress_bar=True)
    embeddings = np.array(embeddings).astype('float32')
    
    print("Building FAISS Vector Index...")
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    faiss.write_index(index, FAISS_INDEX_PATH)
    
    with open(KNOWLEDGE_BASE_PATH, 'w') as f:
        json.dump(data, f, indent=4)
        
    print(f"Successfully built Knowledge Base! Index saved to {FAISS_INDEX_PATH}")

if __name__ == "__main__":
    build_knowledge_base()
