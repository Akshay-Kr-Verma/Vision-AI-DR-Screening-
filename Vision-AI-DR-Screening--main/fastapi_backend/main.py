import os
import json
import base64
import tempfile
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import matlab.engine

DB_FILE = os.path.join(os.path.dirname(__file__), "patients_db.json")

def load_db():
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w") as f:
            json.dump({"patients": []}, f)
    with open(DB_FILE, "r") as f:
        return json.load(f)

def save_db(data):
    with open(DB_FILE, "w") as f:
        json.dump(data, f, indent=2)

eng = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global eng
    print("Starting MATLAB Engine...")
    eng = matlab.engine.start_matlab()
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    eng.addpath(os.path.join(root_dir, "code"), nargout=0)
    eng.addpath(os.path.join(root_dir, "models"), nargout=0)
    print("MATLAB Engine initialized.")
    yield
    if eng:
        eng.quit()

app = FastAPI(title="Vision-AI DR Clinical System", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientRegister(BaseModel):
    patient_id: str
    name: str
    age: int
    gender: str
    phone: str

@app.get("/api/patients")
def get_all_patients():
    db = load_db()
    return db["patients"]

@app.post("/api/patients/register")
def register_patient(p: PatientRegister):
    db = load_db()
    for existing in db["patients"]:
        if existing["patient_id"].lower() == p.patient_id.lower() or existing["phone"] == p.phone:
            raise HTTPException(status_code=400, detail="Patient ID or Phone already registered.")
    
    new_patient = {
        "patient_id": p.patient_id,
        "name": p.name,
        "age": p.age,
        "gender": p.gender,
        "phone": p.phone,
        "created_at": datetime.now().strftime("%d %b %Y, %I:%M %p"),
        "records": []
    }
    db["patients"].append(new_patient)
    save_db(db)
    return {"message": "Patient registered successfully", "patient": new_patient}

@app.get("/api/patients/{identifier}")
def get_patient(identifier: str):
    db = load_db()
    for p in db["patients"]:
        if p["patient_id"].lower() == identifier.lower() or p["phone"] == identifier:
            return p
    raise HTTPException(status_code=404, detail="Patient record not found.")

@app.post("/api/screen")
async def screen_and_save(
    patient_id: str = Form(...),
    eye: str = Form("Right Eye (OD)"),
    file: UploadFile = File(...)
):
    if eng is None:
        raise HTTPException(status_code=503, detail="MATLAB engine is not running.")

    db = load_db()
    patient_idx = None
    for idx, p in enumerate(db["patients"]):
        if p["patient_id"].lower() == patient_id.lower():
            patient_idx = idx
            break
    
    if patient_idx is None:
        raise HTTPException(status_code=404, detail="Selected patient is not registered.")

    temp_dir = tempfile.gettempdir()
    input_path = os.path.join(temp_dir, file.filename)
    
    with open(input_path, "wb") as f:
        f.write(await file.read())

    try:
        raw_output = eng.api_screen_adapter(input_path, nargout=1)
        data = json.loads(raw_output)

        with open(data["overlay_path"], "rb") as img_file:
            overlay_b64 = base64.b64encode(img_file.read()).decode("utf-8")

        new_record = {
            "record_id": f"REC-{int(datetime.now().timestamp())}",
            "date": datetime.now().strftime("%d %b %Y, %I:%M %p"),
            "eye": eye,
            "predicted_grade": int(data["predicted_grade"]),
            "predicted_label": data["predicted_label"],
            "confidence": float(data["confidence"]),
            "probabilities": [float(x) for x in data["probabilities"]],
            "gradcam_base64": f"data:image/png;base64,{overlay_b64}"
        }

        db["patients"][patient_idx]["records"].insert(0, new_record)
        save_db(db)

        return {
            "status": "success",
            "record": new_record,
            "patient_name": db["patients"][patient_idx]["name"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)