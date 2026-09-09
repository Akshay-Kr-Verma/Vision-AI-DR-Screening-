import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Eye, Stethoscope, User, Upload, Activity, 
  CheckCircle2, AlertTriangle, Globe, UserPlus, FileText, Layers, ShieldAlert,
  LogIn, LogOut, Search, ArrowRight
} from 'lucide-react';

const API = "http://127.0.0.1:8080/api";

const TRANSLATIONS = {
  en: {
    appTitle: "VisionAI Retinal Screening",
    tagline: "Community Diabetic Retinopathy Diagnostic Suite",
    docPortal: "Doctor Portal",
    patientPortal: "Patient Portal",
    registerPatient: "Register New Patient",
    patientId: "Patient ID",
    name: "Full Name",
    age: "Age",
    gender: "Gender",
    phone: "Mobile Phone Number",
    saveRegister: "Register Patient",
    selectPatient: "Select Registered Patient",
    targetEye: "Screening Eye",
    eyeOD: "Right Eye (OD)",
    eyeOS: "Left Eye (OS)",
    uploadScan: "Upload Retinal Fundus Scan",
    chooseFile: "Click or drag fundus image to upload",
    runBtn: "Execute Screening & Deep Diagnostic",
    screeningInProgress: "Analyzing via MATLAB Engine...",
    diagnosticTitle: "Diagnostic Output & Grad-CAM",
    confidence: "Model Confidence",
    lesionCoverage: "Pathology Salience Area",
    vesselIndex: "Vascular Contrast Index",
    comparisonTitle: "Physiological Comparison (vs. Healthy Retina)",
    healthyTitle: "Normal Retinal Anatomy",
    healthyFeatures: [
      "Clear Optic Disc Margins & Cup-to-Disc Ratio",
      "Continuous & Smooth Vascular Arcades",
      "Zero Microaneurysms, Hemorrhages, or Lipid Exudates"
    ],
    detectedTitle: "Identified Pathological Indicators",
    patientLoginTitle: "Patient Health Records Login",
    patientLoginSubtitle: "Enter your Patient ID (e.g., PT-101) or Registered Mobile Number to securely view your retinal reports.",
    loginBtn: "Access My Medical Records",
    logoutPatient: "Exit Patient View",
    patientHistoryTitle: "Your Screening Reports Archive",
    noRecords: "No screening records registered for your profile yet.",
    male: "Male",
    female: "Female",
    other: "Other",
    grades: [
      { name: "Normal (Grade 0)", color: "text-emerald-800 bg-emerald-50 border-emerald-300", desc: "No microvascular abnormalities detected. Follow routine annual eye checkup." },
      { name: "Mild NPDR (Grade 1)", color: "text-blue-800 bg-blue-50 border-blue-300", desc: "Isolated microaneurysms identified. Maintain tight glycemic and blood pressure control." },
      { name: "Moderate NPDR (Grade 2)", color: "text-amber-800 bg-amber-50 border-amber-300", desc: "Noticeable hemorrhages and lipid exudates. Ophthalmologist referral recommended within 2-3 months." },
      { name: "Severe NPDR (Grade 3)", color: "text-orange-800 bg-orange-50 border-orange-300", desc: "Extensive retinal hemorrhages in all quadrants. Immediate retina specialist evaluation required." },
      { name: "Proliferative DR (Grade 4)", color: "text-red-800 bg-red-50 border-red-300", desc: "Neovascularization present. High risk of severe vision loss. Urgent laser/anti-VEGF treatment required." }
    ]
  },
  hi: {
    appTitle: "विज़न-एआई आंख जांच केंद्र",
    tagline: "ग्रामीण एवं क्लिनिकल डायबिटिक रेटिनोपैथी जांच प्रणाली",
    docPortal: "डॉक्टर पोर्टल",
    patientPortal: "मरीज पोर्टल",
    registerPatient: "नया मरीज पंजीकृत करें",
    patientId: "मरीज संख्या (ID)",
    name: "पूरा नाम",
    age: "उम्र",
    gender: "लिंग",
    phone: "मोबाइल नंबर",
    saveRegister: "मरीज पंजीकृत करें",
    selectPatient: "पंजीकृत मरीज चुनें",
    targetEye: "जांच वाली आंख",
    eyeOD: "दाहिनी आंख (OD)",
    eyeOS: "बाईं आंख (OS)",
    uploadScan: "रेटिना की तस्वीर अपलोड करें",
    chooseFile: "फोटो चुनने के लिए यहां क्लिक करें",
    runBtn: "जांच एवं विस्तृत विश्लेषण शुरू करें",
    screeningInProgress: "जांच जारी है, कृपया प्रतीक्षा करें...",
    diagnosticTitle: "जांच परिणाम एवं हीटमैप (Grad-CAM)",
    confidence: "सटीकता दर (Confidence)",
    lesionCoverage: "प्रभावित क्षेत्र (Lesion Area)",
    vesselIndex: "नसों का कंट्रास्ट इंडेक्स",
    comparisonTitle: "स्वस्थ आंख से तुलना (तुलनात्मक अंतर)",
    healthyTitle: "सामान्य आंख की संरचना",
    healthyFeatures: [
      "स्पष्ट एवं स्वस्थ ऑप्टिक डिस्क",
      "सामान्य और बिना रुकावट वाली रक्त नसें",
      "रेटिना पर कोई रक्तस्राव या धब्बे नहीं"
    ],
    detectedTitle: "पहचाने गए रोग के लक्षण",
    patientLoginTitle: "मरीज रिपोर्ट लॉगिन",
    patientLoginSubtitle: "अपनी आंख की जांच रिपोर्ट देखने के लिए अपनी मरीज संख्या (उदा. PT-101) या पंजीकृत मोबाइल नंबर दर्ज करें।",
    loginBtn: "मेरी रिपोर्ट देखें",
    logoutPatient: "लॉग आउट करें",
    patientHistoryTitle: "आपकी जांच रिपोर्ट का इतिहास",
    noRecords: "आपके खाते में अभी तक कोई जांच रिपोर्ट दर्ज नहीं हुई है।",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    grades: [
      { name: "सामान्य (Grade 0)", color: "text-emerald-800 bg-emerald-50 border-emerald-300", desc: "आंख में कोई डायबिटिक रेटिनोपैथी नहीं पाई गई। 1 वर्ष बाद सामान्य जांच कराएं।" },
      { name: "शुरुआती असर (Grade 1)", color: "text-blue-800 bg-blue-50 border-blue-300", desc: "हल्के सूक्ष्म बदलाव हैं। शुगर और बीपी नियंत्रित रखें।" },
      { name: "मध्यम स्तर (Grade 2)", color: "text-amber-800 bg-amber-50 border-amber-300", desc: "नसों में धब्बे व रिसाव पाए गए हैं। 2-3 महीने में नेत्र विशेषज्ञ को दिखाएं।" },
      { name: "गंभीर स्तर (Grade 3)", color: "text-orange-800 bg-orange-50 border-orange-300", desc: "नसों में रुकावट और खून के धब्बे ज्यादा हैं। तुरंत नेत्र रोग विशेषज्ञ से मिलें।" },
      { name: "अति गंभीर (Grade 4)", color: "text-red-800 bg-red-50 border-red-300", desc: "नई कमजोर नसें बन रही हैं, रोशनी जाने का खतरा है। तत्काल अस्पताल में उपचार लें।" }
    ]
  }
};

export default function App() {
  const [role, setRole] = useState('doctor'); // 'doctor' or 'patient'
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  // Doctor state
  const [patients, setPatients] = useState([]);
  const [selectedPatId, setSelectedPatId] = useState('');
  const [newPat, setNewPat] = useState({ patient_id: '', name: '', age: '', gender: 'Male', phone: '' });
  const [eye, setEye] = useState('Right Eye (OD)');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentResult, setCurrentResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Patient Login & Session state
  const [patientLoginInput, setPatientLoginInput] = useState('');
  const [loggedInPatient, setLoggedInPatient] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API}/patients`);
      setPatients(res.data);
      if (res.data.length > 0 && !selectedPatId) {
        setSelectedPatId(res.data[0].patient_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegisterPatient = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await axios.post(`${API}/patients/register`, {
        ...newPat,
        age: parseInt(newPat.age)
      });
      setPatients([res.data.patient, ...patients]);
      setSelectedPatId(res.data.patient.patient_id);
      setNewPat({ patient_id: '', name: '', age: '', gender: 'Male', phone: '' });
      alert(lang === 'hi' ? "मरीज सफलतापूर्वक पंजीकृत हो गया!" : "Patient registered successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Registration failed.");
    }
  };

  const handleScreening = async () => {
    if (!selectedFile || !selectedPatId) return;
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('patient_id', selectedPatId);
    formData.append('eye', eye);
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`${API}/screen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      setCurrentResult(res.data.record);
      fetchPatients();

      // If the currently logged in patient was the one screened, refresh their view
      if (loggedInPatient && loggedInPatient.patient_id.toLowerCase() === selectedPatId.toLowerCase()) {
        const updated = await axios.get(`${API}/patients/${selectedPatId}`);
        setLoggedInPatient(updated.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to process image.");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoginLoading(true);

    try {
      const res = await axios.post(`${API}/patients/login`, {
        identifier: patientLoginInput
      });
      setLoggedInPatient(res.data.patient);
      setPatientLoginInput('');
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Invalid Patient ID or Mobile number.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handlePatientLogout = () => {
    setLoggedInPatient(null);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-6 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-600 p-2.5 rounded-xl text-white shadow-sm">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 leading-tight">{t.appTitle}</h1>
              <p className="text-xs text-slate-500 font-medium">{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Portal Switch Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
              <button
                onClick={() => { setRole('doctor'); setErrorMsg(null); }}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  role === 'doctor' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>{t.docPortal}</span>
              </button>
              <button
                onClick={() => { setRole('patient'); setErrorMsg(null); }}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  role === 'patient' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-4 h-4" />
                <span>{t.patientPortal}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center space-x-3 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= DOCTOR WORKSPACE ================= */}
        {role === 'doctor' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 1. Register Patient Card */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
                    <UserPlus className="w-5 h-5 text-teal-600" />
                    <span>{t.registerPatient}</span>
                  </h2>
                  <form onSubmit={handleRegisterPatient} className="space-y-3 text-xs">
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">{t.patientId}</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. PT-103"
                        value={newPat.patient_id}
                        onChange={(e) => setNewPat({ ...newPat, patient_id: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">{t.name}</label>
                      <input
                        required
                        type="text"
                        placeholder="e.g. Anand Verma"
                        value={newPat.name}
                        onChange={(e) => setNewPat({ ...newPat, name: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">{t.age}</label>
                        <input
                          required
                          type="number"
                          placeholder="52"
                          value={newPat.age}
                          onChange={(e) => setNewPat({ ...newPat, age: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">{t.gender}</label>
                        <select
                          value={newPat.gender}
                          onChange={(e) => setNewPat({ ...newPat, gender: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                        >
                          <option value="Male">{t.male}</option>
                          <option value="Female">{t.female}</option>
                          <option value="Other">{t.other}</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="font-bold text-slate-600 block mb-1">{t.phone}</label>
                      <input
                        required
                        type="tel"
                        placeholder="9876543210"
                        value={newPat.phone}
                        onChange={(e) => setNewPat({ ...newPat, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg mt-2 transition text-xs shadow-sm"
                    >
                      {t.saveRegister}
                    </button>
                  </form>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t.selectPatient}
                  </label>
                  <select
                    value={selectedPatId}
                    onChange={(e) => setSelectedPatId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.patient_id} value={p.patient_id}>
                        {p.name} ({p.patient_id}) - {p.phone}
                      </option>
                    ))}
                  </select>
                </div>
              </section>

              {/* 2. Upload & Screening Execution */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
                    <Upload className="w-5 h-5 text-teal-600" />
                    <span>{t.uploadScan}</span>
                  </h2>

                  <div className="mb-4">
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">{t.targetEye}</label>
                    <select
                      value={eye}
                      onChange={(e) => setEye(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold"
                    >
                      <option value="Right Eye (OD)">{t.eyeOD}</option>
                      <option value="Left Eye (OS)">{t.eyeOS}</option>
                    </select>
                  </div>

                  <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 min-h-36 transition">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files[0];
                        if (f) {
                          setSelectedFile(f);
                          setPreviewUrl(URL.createObjectURL(f));
                        }
                      }}
                    />
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="max-h-32 rounded object-contain" />
                    ) : (
                      <div className="text-center text-slate-400">
                        <Upload className="w-7 h-7 mx-auto mb-1 text-slate-400" />
                        <span className="text-xs font-semibold">{t.chooseFile}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, TIFF</p>
                      </div>
                    )}
                  </label>
                  {selectedFile && <p className="text-xs text-slate-500 mt-2 truncate">File: {selectedFile.name}</p>}
                </div>

                <button
                  onClick={handleScreening}
                  disabled={!selectedFile || !selectedPatId || loading}
                  className="w-full mt-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-2 transition shadow-sm"
                >
                  <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>{loading ? t.screeningInProgress : t.runBtn}</span>
                </button>
              </section>

              {/* 3. Diagnostic Parameters & Grad-CAM */}
              <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100 flex items-center space-x-2">
                  <Layers className="w-5 h-5 text-teal-600" />
                  <span>{t.diagnosticTitle}</span>
                </h2>

                {currentResult ? (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-xl border ${t.grades[currentResult.predicted_grade].color}`}>
                      <span className="text-[10px] font-bold uppercase tracking-wider block">Diagnosis</span>
                      <span className="text-base font-bold">{t.grades[currentResult.predicted_grade].name}</span>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-1 flex justify-center">
                      <img src={currentResult.gradcam_base64} alt="Grad-CAM" className="max-h-40 object-contain rounded" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div>{t.confidence}: <span className="font-bold text-slate-900">{(currentResult.confidence * 100).toFixed(1)}%</span></div>
                      <div>{t.lesionCoverage}: <span className="font-bold text-slate-900">{currentResult.lesion_coverage.toFixed(1)}%</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="h-48 flex flex-col items-center justify-center text-slate-400 text-center">
                    <CheckCircle2 className="w-8 h-8 mb-2 stroke-[1.5]" />
                    <span className="text-xs font-semibold">Ready for image screening</span>
                    <p className="text-[11px] text-slate-400 mt-1">Upload fundus scan to run deep Grad-CAM analysis</p>
                  </div>
                )}
              </section>
            </div>

            {/* Physiological Comparison Cards */}
            {currentResult && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{t.comparisonTitle}</h3>
                  <p className="text-xs text-slate-500">Visual differentiation and anatomical markers analyzed by the network</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Normal Reference */}
                  <div className="border border-emerald-200 rounded-xl p-4 bg-emerald-50/40">
                    <h4 className="text-xs font-bold text-emerald-800 flex items-center space-x-2 mb-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{t.healthyTitle}</span>
                    </h4>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      {t.healthyFeatures.map((f, i) => (
                        <li key={i} className="flex items-center space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Detected Pathology */}
                  <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/40">
                    <h4 className="text-xs font-bold text-amber-800 flex items-center space-x-2 mb-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>{t.detectedTitle}</span>
                    </h4>
                    <div className="text-xs text-slate-700 space-y-2 font-medium">
                      <p>• <strong>Primary Lesion Focus: </strong> Grad-CAM highlights localized microaneurysms and intraretinal microvascular abnormalities ({currentResult.lesion_coverage.toFixed(1)}% salience coverage).</p>
                      <p>• <strong>Vascular Assessment: </strong> Variation index at {currentResult.vessel_density.toFixed(3)}, indicating regional micro-hemorrhage clustering.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= PATIENT WORKSPACE WITH LOGIN ================= */}
        {role === 'patient' && (
          <div className="max-w-2xl mx-auto space-y-6">
            {!loggedInPatient ? (
              /* STEP 1: PATIENT LOGIN GATEWAY */
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto mb-4 border border-teal-100">
                  <LogIn className="w-7 h-7" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 mb-2">{t.patientLoginTitle}</h2>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-6 leading-relaxed">
                  {t.patientLoginSubtitle}
                </p>

                <form onSubmit={handlePatientLogin} className="space-y-4 max-w-sm mx-auto text-left">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                      {t.patientId} / {t.phone}
                    </label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        value={patientLoginInput}
                        onChange={(e) => setPatientLoginInput(e.target.value)}
                        placeholder="e.g. PT-101 or 9876543210"
                        className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition flex items-center justify-center space-x-2 shadow-sm"
                  >
                    <span>{loginLoading ? "Verifying..." : t.loginBtn}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center space-x-2 text-xs text-slate-400">
                  <span>Demo Patients Available:</span>
                  <span className="font-mono text-slate-600 font-semibold">PT-101</span>
                  <span>or</span>
                  <span className="font-mono text-slate-600 font-semibold">PT-102</span>
                </div>
              </div>
            ) : (
              /* STEP 2: LOGGED-IN PATIENT PROFILE & HISTORY */
              <div className="space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Verified Patient</span>
                    <h2 className="text-xl font-bold text-slate-900">{loggedInPatient.name}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ID: {loggedInPatient.patient_id} • {loggedInPatient.gender}, {loggedInPatient.age} yrs • Phone: {loggedInPatient.phone}
                    </p>
                  </div>

                  <button
                    onClick={handlePatientLogout}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t.logoutPatient}</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 px-1">{t.patientHistoryTitle}</h3>

                  {loggedInPatient.records.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
                      {t.noRecords}
                    </div>
                  ) : (
                    loggedInPatient.records.map((rec) => {
                      const grade = t.grades[rec.predicted_grade];
                      return (
                        <div key={rec.record_id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                              <span className="text-sm font-bold text-slate-900">{rec.eye}</span>
                              <span className="text-xs text-slate-400 block">{rec.date}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${grade.color}`}>
                              {grade.name}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                            <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-950 p-1 flex justify-center">
                              <img src={rec.gradcam_base64} alt="Grad-CAM" className="max-h-48 object-contain rounded" />
                            </div>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                              <span className="text-xs font-bold uppercase text-slate-600 block">Doctor's Guidance / परामर्श</span>
                              <p className="text-xs text-slate-700 leading-relaxed font-medium">{grade.desc}</p>
                              <div className="pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500 font-semibold">
                                <span>Confidence: {(rec.confidence * 100).toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}