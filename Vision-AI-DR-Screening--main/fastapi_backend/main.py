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

# In-memory store pre-seeded with demo patients for immediate testing
DATA_STORE = {
    "patients": [
        {
            "patient_id": "PT-101",
            "name": "Ramesh Patel",
            "age": 54,
            "gender": "Male",
            "phone": "9876543210",
            "records": []
        },
        {
            "patient_id": "PT-102",
            "name": "Sunita Devi",
            "age": 48,
            "gender": "Female",
            "phone": "9876543211",
            "records": []
        }
    ]
}

eng = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global eng
    print("Starting MATLAB Engine...")
    eng = matlab.engine.start_matlab()
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    eng.addpath(os.path.join(root_dir, "code"), nargout=0)
    eng.addpath(os.path.join(root_dir, "models"), nargout=0)
    print("MATLAB Engine initialized with paths.")
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

class PatientLoginRequest(BaseModel):
    identifier: str

@app.get("/api/patients")
def get_all_patients():
    return DATA_STORE["patients"]

@app.post("/api/patients/register")
def register_patient(p: PatientRegister):
    for existing in DATA_STORE["patients"]:
        if existing["patient_id"].lower() == p.patient_id.lower():
            raise HTTPException(status_code=400, detail="Patient ID already exists.")
        if existing["phone"] == p.phone:
            raise HTTPException(status_code=400, detail="Mobile number is already registered.")
    
    new_patient = {
        "patient_id": p.patient_id.strip(),
        "name": p.name.strip(),
        "age": p.age,
        "gender": p.gender,
        "phone": p.phone.strip(),
        "records": []
    }
    DATA_STORE["patients"].insert(0, new_patient)
    return {"message": "Patient registered successfully", "patient": new_patient}

@app.post("/api/patients/login")
def patient_login(req: PatientLoginRequest):
    clean_id = req.identifier.strip().lower()
    for p in DATA_STORE["patients"]:
        if p["patient_id"].lower() == clean_id or p["phone"].strip() == req.identifier.strip():
            return {"status": "success", "patient": p}
    raise HTTPException(status_code=404, detail="No patient found with this ID or Mobile Number.")

@app.get("/api/patients/{identifier}")
def get_patient(identifier: str):
    clean_id = identifier.strip().lower()
    for p in DATA_STORE["patients"]:
        if p["patient_id"].lower() == clean_id or p["phone"].strip() == identifier.strip():
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

    target_patient = None
    for p in DATA_STORE["patients"]:
        if p["patient_id"].lower() == patient_id.strip().lower():
            target_patient = p
            break
    
    if target_patient is None:
        raise HTTPException(status_code=404, detail="Selected patient is not found.")

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
            "gradcam_base64": f"data:image/png;base64,{overlay_b64}",
            "lesion_coverage": float(data.get("lesion_coverage_pct", 8.4)),
            "vessel_density": float(data.get("vessel_density_index", 0.042))
        }

        target_patient["records"].insert(0, new_record)

        return {
            "status": "success",
            "record": new_record,
            "patient_name": target_patient["name"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(input_path):
            os.remove(input_path)