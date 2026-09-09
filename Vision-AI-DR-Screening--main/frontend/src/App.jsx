import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Eye, UserPlus, FileText, Upload, Activity, 
  CheckCircle, AlertTriangle, Globe, LogIn, Search, Stethoscope, User
} from 'lucide-react';

const API_BASE = "http://127.0.0.1:8080/api";

const TRANSLATIONS = {
  en: {
    appTitle: "VisionAI Retinal Screening",
    tagline: "Community Diabetic Retinopathy Diagnostic System",
    docPortal: "Doctor / Staff Portal",
    patientPortal: "Patient Portal (मरीज पोर्टल)",
    registerPatient: "Register New Patient",
    patientId: "Patient ID / Hospital No.",
    fullName: "Full Name",
    age: "Age",
    gender: "Gender",
    phone: "Mobile Phone Number",
    saveRegister: "Register & Proceed",
    selectPatient: "Select Registered Patient",
    targetEye: "Screening Eye",
    uploadScan: "Upload Retinal Fundus Scan",
    chooseFile: "Click to upload image",
    runScreening: "Run AI Screening & Grad-CAM",
    screeningInProgress: "Analyzing with MATLAB Engine...",
    patientLogin: "Patient Login",
    loginPrompt: "Enter your Patient ID or Registered Mobile Number to view report",
    checkReport: "View My Reports",
    noRecords: "No screening records found yet.",
    eyeOD: "Right Eye (OD)",
    eyeOS: "Left Eye (OS)",
    adviceTitle: "Doctor's Advice / परामर्श",
    male: "Male",
    female: "Female",
    other: "Other",
    grades: [
      { label: "Normal (No DR)", desc: "No signs of diabetic retinopathy. Retest in 1 year.", badge: "bg-green-100 text-green-800 border-green-300" },
      { label: "Mild NPDR", desc: "Slight blood vessel changes. Maintain blood sugar level. Retest in 6-9 months.", badge: "bg-blue-100 text-blue-800 border-blue-300" },
      { label: "Moderate NPDR", desc: "Visible microaneurysms. Visit eye clinic within 3 months.", badge: "bg-amber-100 text-amber-800 border-amber-300" },
      { label: "Severe NPDR", desc: "Significant blood vessel blockages. Urgent retina specialist consult required.", badge: "bg-orange-100 text-orange-800 border-orange-300" },
      { label: "Proliferative DR", desc: "Severe bleeding risk. Immediate hospital treatment required.", badge: "bg-red-100 text-red-800 border-red-300" }
    ]
  },
  hi: {
    appTitle: "विज़न-एआई नेत्र जांच केंद्र",
    tagline: "ग्रामीण एवं सामुदायिक मधुमेह आंख जांच प्रणाली",
    docPortal: "चिकित्सक / स्टाफ पोर्टल",
    patientPortal: "मरीज पोर्टल (Patient Portal)",
    registerPatient: "नया मरीज पंजीकृत करें",
    patientId: "मरीज संख्या (Patient ID)",
    fullName: "पूरा नाम",
    age: "उम्र",
    gender: "लिंग",
    phone: "मोबाइल नंबर",
    saveRegister: "मरीज पंजीकृत करें",
    selectPatient: "पंजीकृत मरीज चुनें",
    targetEye: "जांच वाली आंख",
    uploadScan: "आंख (रेटिना) की फोटो अपलोड करें",
    chooseFile: "फोटो चुनने के लिए यहां दबाएं",
    runScreening: "जांच शुरू करें (Screening)",
    screeningInProgress: "जांच चल रही है, कृपया प्रतीक्षा करें...",
    patientLogin: "मरीज लॉगिन",
    loginPrompt: "अपनी जांच रिपोर्ट देखने के लिए मरीज संख्या या मोबाइल नंबर दर्ज करें",
    checkReport: "अपनी रिपोर्ट देखें",
    noRecords: "इस मरीज का कोई पिछला रिकॉर्ड नहीं मिला।",
    eyeOD: "दाहिनी आंख (Right Eye)",
    eyeOS: "बाईं आंख (Left Eye)",
    adviceTitle: "डॉक्टर की सलाह एवं निर्देश",
    male: "पुरुष",
    female: "महिला",
    other: "अन्य",
    grades: [
      { label: "सामान्य (No DR)", desc: "आपकी आंखें बिल्कुल स्वस्थ हैं। 1 साल बाद दोबारा जांच कराएं।", badge: "bg-green-100 text-green-800 border-green-300" },
      { label: "शुरुआती असर (Mild NPDR)", desc: "हल्के लक्षण हैं। शुगर नियंत्रित रखें और 6 महीने में जांच कराएं।", badge: "bg-blue-100 text-blue-800 border-blue-300" },
      { label: "मध्यम स्तर (Moderate NPDR)", desc: "नसों में बदलाव दिख रहा है। 2-3 महीने में नेत्र विशेषज्ञ को दिखाएं।", badge: "bg-amber-100 text-amber-800 border-amber-300" },
      { label: "गंभीर असर (Severe NPDR)", desc: "आंखों में क्षति अधिक है। तुरंत बड़े नेत्र अस्पताल जाएं।", badge: "bg-orange-100 text-orange-800 border-orange-300" },
      { label: "अति गंभीर (Proliferative DR)", desc: "रोशनी जाने का खतरा है। तत्काल लेजर या इंजेक्शन उपचार आवश्यक है।", badge: "bg-red-100 text-red-800 border-red-300" }
    ]
  }
};

export default function App() {
  const [role, setRole] = useState('doctor'); // 'doctor' or 'patient'
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  const [patients, setPatients] = useState([]);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [newPatient, setNewPatient] = useState({ patient_id: '', name: '', age: '', gender: 'Male', phone: '' });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [eye, setEye] = useState("Right Eye (OD)");
  const [loading, setLoading] = useState(false);
  const [latestResult, setLatestResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [patientLookupId, setPatientLookupId] = useState('');
  const [loggedInPatient, setLoggedInPatient] = useState(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      const res = await axios.get(`${API_BASE}/patients`);
      setPatients(res.data);
      if (res.data.length > 0 && !selectedPatientId) {
        setSelectedPatientId(res.data[0].patient_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await axios.post(`${API_BASE}/patients/register`, newPatient);
      setPatients([res.data.patient, ...patients]);
      setSelectedPatientId(res.data.patient.patient_id);
      setNewPatient({ patient_id: '', name: '', age: '', gender: 'Male', phone: '' });
      alert(lang === 'hi' ? "मरीज सफलतापूर्वक दर्ज हो गया!" : "Patient registered successfully!");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Registration failed");
    }
  };

  const handleScreening = async () => {
    if (!selectedFile || !selectedPatientId) return;
    setLoading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('patient_id', selectedPatientId);
    formData.append('eye', eye);
    formData.append('file', selectedFile);

    try {
      const res = await axios.post(`${API_BASE}/screen`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000
      });
      setLatestResult(res.data.record);
      fetchPatients();
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || err.message || "Failed to process image.");
    } finally {
      setLoading(false);
    }
  };

  const handlePatientLogin = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const res = await axios.get(`${API_BASE}/patients/${patientLookupId.trim()}`);
      setLoggedInPatient(res.data);
    } catch (err) {
      setErrorMsg(lang === 'hi' ? "मरीज रिकॉर्ड नहीं मिला। कृपया नंबर जांचें।" : "Patient record not found.");
      setLoggedInPatient(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-600 p-2 rounded-xl text-white shadow-sm">
              <Eye className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">{t.appTitle}</h1>
              <p className="text-xs text-slate-500 font-medium">{t.tagline}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Globe className="w-4 h-4 text-teal-600" />
              <span>{lang === 'en' ? 'हिन्दी' : 'English'}</span>
            </button>

            {/* Role Switch Tabs */}
            <div className="bg-slate-100 p-1 rounded-xl flex border border-slate-200">
              <button
                onClick={() => { setRole('doctor'); setErrorMsg(null); }}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
                  role === 'doctor' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>{t.docPortal}</span>
              </button>
              <button
                onClick={() => { setRole('patient'); setErrorMsg(null); }}
                className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition ${
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

      {/* Main Workspace */}
      <main className="max-w-6xl w-full mx-auto p-6 flex-1">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center space-x-3 text-sm">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= DOCTOR VIEW ================= */}
        {role === 'doctor' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Column 1: Patient Registration */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-slate-900 font-bold mb-4 pb-2 border-b border-slate-100">
                  <UserPlus className="w-5 h-5 text-teal-600" />
                  <h2>{t.registerPatient}</h2>
                </div>
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">{t.patientId}</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. PT-101"
                      value={newPatient.patient_id}
                      onChange={(e) => setNewPatient({ ...newPatient, patient_id: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">{t.fullName}</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Ramesh Kumar"
                      value={newPatient.name}
                      onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">{t.age}</label>
                      <input
                        required
                        type="number"
                        placeholder="52"
                        value={newPatient.age}
                        onChange={(e) => setNewPatient({ ...newPatient, age: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">{t.gender}</label>
                      <select
                        value={newPatient.gender}
                        onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                      >
                        <option value="Male">{t.male}</option>
                        <option value="Female">{t.female}</option>
                        <option value="Other">{t.other}</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">{t.phone}</label>
                    <input
                      required
                      type="tel"
                      placeholder="9876543210"
                      value={newPatient.phone}
                      onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full mt-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
                  >
                    {t.saveRegister}
                  </button>
                </form>
              </div>

              {/* Patient Selector */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  {t.selectPatient}
                </label>
                <select
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  {patients.length === 0 && <option value="">No patients registered</option>}
                  {patients.map((p) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.name} ({p.patient_id}) - {p.phone}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* Column 2: Upload & Screening Execution */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-2 text-slate-900 font-bold mb-4 pb-2 border-b border-slate-100">
                  <Upload className="w-5 h-5 text-teal-600" />
                  <h2>{t.uploadScan}</h2>
                </div>

                <div className="mb-4">
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">{t.targetEye}</label>
                  <select
                    value={eye}
                    onChange={(e) => setEye(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-medium"
                  >
                    <option value="Right Eye (OD)">{t.eyeOD}</option>
                    <option value="Left Eye (OS)">{t.eyeOS}</option>
                  </select>
                </div>

                <label className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50 min-h-44">
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
                    <img src={previewUrl} alt="Preview" className="max-h-40 rounded object-contain" />
                  ) : (
                    <div className="text-center text-slate-500">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                      <p className="text-sm font-medium">{t.chooseFile}</p>
                      <p className="text-xs text-slate-400 mt-1">PNG, JPG, TIFF (Max 25MB)</p>
                    </div>
                  )}
                </label>
                {selectedFile && <p className="text-xs text-slate-500 mt-2 truncate">File: {selectedFile.name}</p>}
              </div>

              <button
                onClick={handleScreening}
                disabled={!selectedFile || !selectedPatientId || loading}
                className="w-full mt-6 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center space-x-2"
              >
                <Activity className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? t.screeningInProgress : t.runScreening}</span>
              </button>
            </section>

            {/* Column 3: Instant Doctor Report View */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 text-slate-900 font-bold mb-4 pb-2 border-b border-slate-100">
                <FileText className="w-5 h-5 text-teal-600" />
                <h2>Diagnostic Output & Heatmap</h2>
              </div>

              {latestResult ? (
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl border ${t.grades[latestResult.predicted_grade].badge}`}>
                    <span className="text-xs font-bold uppercase tracking-wider block">Diagnosis</span>
                    <h3 className="text-lg font-bold">{t.grades[latestResult.predicted_grade].label}</h3>
                    <p className="text-xs mt-1 leading-relaxed">{t.grades[latestResult.predicted_grade].desc}</p>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center p-2">
                    <img src={latestResult.gradcam_base64} alt="Grad-CAM" className="max-h-52 object-contain rounded" />
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                    <span className="font-semibold text-slate-600">Model Confidence: </span>
                    <span className="font-bold text-slate-900">{(latestResult.confidence * 100).toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400 text-center">
                  <CheckCircle className="w-10 h-10 mb-2 stroke-[1.5]" />
                  <p className="text-sm font-medium">Ready for analysis</p>
                  <p className="text-xs text-slate-400 mt-1">Select patient & upload scan to run screening</p>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ================= PATIENT VIEW (RURAL FRIENDLY) ================= */}
        {role === 'patient' && (
          <div className="max-w-2xl mx-auto">
            {!loggedInPatient ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
                <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-teal-700">
                  <LogIn className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">{t.patientLogin}</h2>
                <p className="text-sm text-slate-600 mb-6">{t.loginPrompt}</p>

                <form onSubmit={handlePatientLogin} className="space-y-4 text-left">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      {t.patientId} / {t.phone}
                    </label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. PT-101 or 9876543210"
                      value={patientLookupId}
                      onChange={(e) => setPatientLookupId(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3.5 rounded-xl text-base shadow transition"
                  >
                    {t.checkReport}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Patient Header Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Patient Details</span>
                    <h2 className="text-xl font-bold text-slate-900">{loggedInPatient.name}</h2>
                    <p className="text-sm text-slate-500">
                      ID: {loggedInPatient.patient_id} • {loggedInPatient.gender}, {loggedInPatient.age} yrs • {loggedInPatient.phone}
                    </p>
                  </div>
                  <button
                    onClick={() => setLoggedInPatient(null)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                  >
                    Change Patient
                  </button>
                </div>

                {/* Screening Records History */}
                <h3 className="text-lg font-bold text-slate-900 px-1">Screening Reports History</h3>

                {loggedInPatient.records.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500">
                    <p>{t.noRecords}</p>
                  </div>
                ) : (
                  loggedInPatient.records.map((rec) => {
                    const gradeInfo = t.grades[rec.predicted_grade];
                    return (
                      <div key={rec.record_id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-sm font-bold text-slate-800">{rec.eye}</span>
                            <span className="text-xs text-slate-400 block">{rec.date}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${gradeInfo.badge}`}>
                            {gradeInfo.label}
                          </span>
                        </div>

                        {/* Visual Image & Heatmap */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                          <div className="border border-slate-200 rounded-xl overflow-hidden bg-black p-2 flex justify-center">
                            <img src={rec.gradcam_base64} alt="Heatmap" className="max-h-52 rounded object-contain" />
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                            <h4 className="text-xs font-bold uppercase text-slate-700 mb-1">{t.adviceTitle}</h4>
                            <p className="text-sm text-slate-700 leading-relaxed font-medium">
                              {gradeInfo.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}