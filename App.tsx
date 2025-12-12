import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Mic, Image as ImageIcon, FileText, 
  Trash2, History, Languages, X, Activity, 
  AlertTriangle, ShieldAlert, CheckCircle, Info, Settings, Save, Menu, Loader2,
  Stethoscope, User, UserCheck, Phone, ChevronDown, Volume2, Square, MapPin, ArrowRight, Globe, Navigation, ArrowLeft,
  ClipboardList, Upload, Bell, BellRing, Plus, Calendar, Clock, Pill, Map, Star, Compass, RotateCcw, MessageCircle,
  LayoutDashboard, BarChart2, CheckSquare, ChevronRight, Share2, Edit2, Zap, MessageSquarePlus, LogOut, ClipboardCheck
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { sendMessageToGemini, generateMedicalReport, analyzeMedicalReport } from './services/gemini';
import { Message, Sender, Severity, MedicalReport, Consultation, Language, DoctorPersona, Reminder, Facility } from './types';

// --- Language Configuration ---

interface LanguageConfig {
  name: string;
  native: string;
  hello: string;
  code: string; // Speech recognition locale
  flag: string;
  translations: {
    placeholder: string;
    emergencyPlaceholder: string;
    generateReport: string;
    emergencyTitle: string;
    callBtn: string;
    hospitalMsg: string;
    reportUploadBtn: string;
    resetConversation: string; 
    startNew: string;          // NEW
    confirmReset: string;      
    reminders: {
      title: string;
      setBtn: string;
      addBtn: string;
      medName: string;
      frequency: string;
      duration: string;
      notes: string;
      freqOptions: { once: string; twice: string; thrice: string };
      days: string;
      activeTitle: string;
      enableNotif: string;
      empty: string;
    };
    facilities: {
      btn: string;
      title: string;
      loading: string;
      noResults: string;
      openNow: string;
      closed: string;
      getDirections: string;
      error: string;
    };
    reportModal: {
      title: string;
      dropzone: string;
      analyzing: string;
      analyzeBtn: string;
      cancelBtn: string;
      note: string;
    };
    welcomeMessages: {
      female: string;
      male: string;
      neutral: string;
    };
    // Onboarding Translations
    onboarding: {
      welcome: string;
      step2Title: string;
      step3Title: string;
      step4Title: string;
      step5Title: string; // Summary
      
      languageLabel: string;
      locationLabel: string;
      nameLabel: string;
      ageLabel: string;
      phoneLabel: string;
      
      phonePlaceholder: string;
      locationPlaceholder: string;
      
      continueBtn: string;
      resetBtn: string; // For Step 5
      startChatBtn: string; // For Step 5
      detectLocation: string;
      
      personas: {
        female: { name: string; desc: string };
        male: { name: string; desc: string };
        neutral: { name: string; desc: string };
      }
    }
  };
}

// Define translations separately to avoid circular reference during initialization
const EN_TRANSLATIONS = {
  placeholder: "Describe your symptoms...",
  emergencyPlaceholder: "Emergency detected - seek immediate care",
  generateReport: "Generate Summary Report",
  emergencyTitle: "Medical Emergency Detected",
  callBtn: "CALL 108 / 112 NOW",
  hospitalMsg: "Go to nearest hospital immediately.",
  reportUploadBtn: "Have a prescription or report? Analyze it",
  resetConversation: "Reset App",
  startNew: "Start New Consultation",
  confirmReset: "Are you sure? All your data including onboarding will be cleared.",
  reminders: {
    title: "Medication Reminders",
    setBtn: "Set Reminder",
    addBtn: "Add Reminder",
    medName: "Medicine Name",
    frequency: "Frequency",
    duration: "Duration",
    notes: "Notes (e.g. after food)",
    freqOptions: { once: "Once Daily", twice: "Twice Daily", thrice: "Thrice Daily" },
    days: "Days",
    activeTitle: "Active Reminders",
    enableNotif: "Please enable notifications to receive reminders.",
    empty: "No active reminders."
  },
  facilities: {
    btn: "Find Nearby Facilities",
    title: "Nearby Healthcare Centers",
    loading: "Searching nearby facilities...",
    noResults: "No facilities found nearby. Please try again or visit a main hospital.",
    openNow: "Open Now",
    closed: "Closed",
    getDirections: "Get Directions",
    error: "Unable to find location. Please enable location services."
  },
  reportModal: {
    title: "Upload Medical Documents",
    dropzone: "Tap to select prescription, lab report, or X-ray",
    analyzing: "Reading your report...",
    analyzeBtn: "Analyze Report",
    cancelBtn: "Cancel",
    note: "Report will be explained in English"
  },
  welcomeMessages: {
    female: "Namaste! I am Dr. Priya Sharma. I specialize in women's health and family medicine. Please feel completely comfortable sharing any health concern with me. I'm here to help.",
    male: "Namaste! I am Dr. Rajesh Kumar. I am here to help you with your health concerns. How can I assist you today?",
    neutral: "Namaste! I am MedSahayak. Please tell me your symptoms or upload a photo of the affected area."
  },
  onboarding: {
    welcome: "Welcome to MedSahayak",
    step2Title: "Language & Location",
    step3Title: "Personal Details",
    step4Title: "Choose Your Doctor",
    step5Title: "Profile Summary",
    languageLabel: "Select Language",
    locationLabel: "Your Location",
    nameLabel: "Your Name",
    ageLabel: "Your Age",
    phoneLabel: "Phone Number",
    phonePlaceholder: "10-digit number",
    locationPlaceholder: "City, District",
    continueBtn: "Next",
    resetBtn: "Edit / Reset",
    startChatBtn: "Start Consultation",
    detectLocation: "Use Current Location",
    personas: {
      female: { name: "Dr. Priya Sharma", desc: "Specialist in Women's Health & Pediatrics" },
      male: { name: "Dr. Rajesh Kumar", desc: "General Physician" },
      neutral: { name: "MedSahayak AI", desc: "Medical Assistant" }
    }
  }
};

const LANGUAGES: Record<Language, LanguageConfig> = {
  en: { 
    name: 'English', native: 'English', hello: 'Hello', code: 'en-IN', flag: '🇬🇧',
    translations: EN_TRANSLATIONS
  },
  hi: { name: 'Hindi', native: 'हिंदी', hello: 'नमस्ते', code: 'hi-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  ta: { name: 'Tamil', native: 'தமிழ்', hello: 'வணக்கம்', code: 'ta-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  te: { name: 'Telugu', native: 'తెలుగు', hello: 'నమస్కారం', code: 'te-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  bn: { name: 'Bengali', native: 'বাংলা', hello: 'নমস্কার', code: 'bn-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  mr: { name: 'Marathi', native: 'मराठी', hello: 'नमस्ते', code: 'mr-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  gu: { name: 'Gujarati', native: 'ગુજરાતી', hello: 'નમસ્તે', code: 'gu-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  kn: { name: 'Kannada', native: 'ಕನ್ನಡ', hello: 'ನಮಸ್ಕಾರ', code: 'kn-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  ml: { name: 'Malayalam', native: 'മലയാളം', hello: 'നമസ്കാരം', code: 'ml-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS },
  pa: { name: 'Punjabi', native: 'ਪੰਜਾਬੀ', hello: 'ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ', code: 'pa-IN', flag: '🇮🇳', translations: EN_TRANSLATIONS }
};

const getDistanceFromLatLonInKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; 
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
};

const SeverityBadge = ({ severity }: { severity?: Severity }) => {
  if (!severity) return null;
  const colors = {
    low: 'bg-green-100 text-green-800 border-green-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    emergency: 'bg-red-100 text-red-800 border-red-200 animate-pulse'
  };
  return (
    <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[severity] || colors.low}`}>
      {severity.toUpperCase()}
    </div>
  );
};

const ReminderForm = ({ onAdd, language }: { onAdd: (r: Reminder) => void, language: Language }) => {
  const t = LANGUAGES[language]?.translations?.reminders || LANGUAGES.en.translations.reminders;
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [freq, setFreq] = useState<'once' | 'twice' | 'thrice'>('once');
  const [times, setTimes] = useState<string[]>(['09:00']);
  const [days, setDays] = useState(7);
  const [notes, setNotes] = useState('');

  const updateFreq = (f: 'once' | 'twice' | 'thrice') => {
    setFreq(f);
    if (f === 'once') setTimes(['09:00']);
    if (f === 'twice') setTimes(['09:00', '21:00']);
    if (f === 'thrice') setTimes(['09:00', '14:00', '21:00']);
  };

  const handleTimeChange = (index: number, val: string) => {
    const newTimes = [...times];
    newTimes[index] = val;
    setTimes(newTimes);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const reminder: Reminder = {
      id: Date.now().toString(),
      medicineName: name,
      dosage: dosage,
      frequency: freq,
      times,
      startDate: new Date().toISOString(),
      durationDays: days,
      notes,
      active: true,
      doses: []
    };
    onAdd(reminder);
    setName('');
    setDosage('');
    setNotes('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3 mt-2 animate-fade-in">
       <div>
         <label className="block text-xs font-semibold text-slate-500 mb-1">{t.medName}</label>
         <input value={name} onChange={e => setName(e.target.value)} required className="w-full p-2 text-sm border border-slate-300 rounded-md" placeholder="e.g. Paracetamol" />
       </div>
       <div>
         <label className="block text-xs font-semibold text-slate-500 mb-1">Dosage</label>
         <input value={dosage} onChange={e => setDosage(e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded-md" placeholder="e.g. 500mg" />
       </div>
       <div className="grid grid-cols-2 gap-3">
         <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t.frequency}</label>
            <select value={freq} onChange={(e) => updateFreq(e.target.value as any)} className="w-full p-2 text-sm border border-slate-300 rounded-md">
              <option value="once">{t.freqOptions.once}</option>
              <option value="twice">{t.freqOptions.twice}</option>
              <option value="thrice">{t.freqOptions.thrice}</option>
            </select>
         </div>
         <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1">{t.duration} ({t.days})</label>
            <input type="number" min="1" max="30" value={days} onChange={e => setDays(parseInt(e.target.value))} className="w-full p-2 text-sm border border-slate-300 rounded-md" />
         </div>
       </div>
       <div>
         <label className="block text-xs font-semibold text-slate-500 mb-1">Times</label>
         <div className="flex flex-wrap gap-2">
           {times.map((time, i) => (
             <input key={i} type="time" value={time} onChange={e => handleTimeChange(i, e.target.value)} className="p-1.5 text-sm border border-slate-300 rounded-md" />
           ))}
         </div>
       </div>
       <div>
         <label className="block text-xs font-semibold text-slate-500 mb-1">{t.notes}</label>
         <input value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-2 text-sm border border-slate-300 rounded-md" placeholder="Optional" />
       </div>
       <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md text-sm font-medium hover:bg-blue-700">{t.addBtn}</button>
    </form>
  );
};

const DashboardModal = ({ isOpen, onClose, history, reminders, onAddReminder, onUpdateReminder, onDeleteReminder, facilities, userData }: any) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'medications' | 'risk' | 'quick'>('timeline');
  const [showAddMed, setShowAddMed] = useState(false);
  
  if (!isOpen) return null;

  const severityCounts: Record<string, number> = history.reduce((acc: any, curr: any) => {
    const sev = curr.report?.severity || 'low';
    acc[sev] = (acc[sev] || 0) + 1;
    return acc;
  }, { low: 0, medium: 0, high: 0, emergency: 0 });

  const savedFacilities = facilities.length > 0 ? facilities : JSON.parse(localStorage.getItem('medsahayak_saved_facilities') || '[]');

  const getNextDose = (r: Reminder) => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const sortedTimes = r.times.map(t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    }).sort((a,b) => a - b);
    const nextTimeToday = sortedTimes.find(m => m > currentMinutes);
    if (nextTimeToday) {
       const h = Math.floor(nextTimeToday / 60);
       const m = nextTimeToday % 60;
       return `Today ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    } else {
       const h = Math.floor(sortedTimes[0] / 60);
       const m = sortedTimes[0] % 60;
       return `Tomorrow ${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }
  };

  const markDoseTaken = (r: Reminder) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    const newDose = { date: today, time: nowTime, taken: true };
    const updated = { ...r, doses: [...(r.doses || []), newDose] };
    onUpdateReminder(updated);
  };

  const severityColors: Record<string, string> = {
    low: 'bg-green-500',
    medium: 'bg-yellow-400',
    high: 'bg-orange-500',
    emergency: 'bg-red-600'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4 animate-fade-in">
       <div className="bg-white w-full md:max-w-4xl h-[95vh] md:h-[85vh] rounded-t-2xl md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
             <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2"><LayoutDashboard className="text-blue-600" /> Your Health Dashboard</h2>
             <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><X size={20} className="text-slate-500" /></button>
          </div>
          <div className="flex border-b border-slate-200 overflow-x-auto">
             {[{ id: 'timeline', label: 'Timeline', icon: Clock }, { id: 'medications', label: 'Medications', icon: Pill }, { id: 'risk', label: 'Risk Summary', icon: Activity }, { id: 'quick', label: 'Quick Access', icon: Star }].map(tab => (
               <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[100px] py-4 text-sm font-medium flex flex-col items-center gap-1 border-b-2 transition-colors ${activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}><tab.icon size={18} />{tab.label}</button>
             ))}
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50/50">
             {activeTab === 'timeline' && (
                <div className="max-w-2xl mx-auto">
                  {history.length === 0 ? <div className="text-center py-12 text-slate-400"><ClipboardList size={48} className="mx-auto mb-4 opacity-20" /><p>No consultations yet.</p></div> : 
                    <div className="space-y-6 relative pl-4"><div className="absolute top-2 bottom-2 left-[19px] w-0.5 bg-slate-200"></div>{history.map((c: any) => (<div key={c.id} className="relative pl-8 animate-slide-in"><div className={`absolute left-3 top-3 w-4 h-4 rounded-full border-2 border-white shadow-sm z-10 ${c.report?.severity === 'emergency' ? 'bg-red-600' : c.report?.severity === 'high' ? 'bg-orange-500' : c.report?.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-500'}`}></div><div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"><div className="flex justify-between items-start mb-2"><span className="text-xs font-semibold text-slate-400 uppercase">{new Date(c.date).toLocaleDateString()}</span><SeverityBadge severity={c.report?.severity} /></div><p className="font-medium text-slate-800 text-sm mb-2">{c.report?.summary || "Consultation Record"}</p></div></div>))}</div>
                  }
                </div>
             )}
             {activeTab === 'medications' && (
               <div className="max-w-2xl mx-auto">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-slate-700">Active Medications</h3><button onClick={() => setShowAddMed(!showAddMed)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">{showAddMed ? <X size={16} /> : <Plus size={16} />} {showAddMed ? 'Cancel' : 'Add Medication'}</button></div>
                  {showAddMed && <div className="mb-6"><ReminderForm onAdd={(r) => { onAddReminder(r); setShowAddMed(false); }} language={userData.language} /></div>}
                  {reminders.length === 0 && !showAddMed ? <div className="text-center py-12 text-slate-400"><Pill size={48} className="mx-auto mb-4 opacity-20" /><p>No medications tracked.</p></div> : 
                    <div className="grid gap-4">{reminders.map((r: Reminder) => (<div key={r.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between gap-4"><div className="flex-1"><div className="flex items-center gap-2 mb-1"><h4 className="font-bold text-slate-800">{r.medicineName}</h4>{r.dosage && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">{r.dosage}</span>}</div><p className="text-xs text-slate-500 mb-3">{r.frequency} • {r.durationDays} days total</p><p className="text-xs text-blue-600 flex items-center gap-1 font-medium"><Clock size={12} /> Next dose: {getNextDose(r)}</p></div><div className="flex items-center"><button onClick={() => markDoseTaken(r)} className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 hover:bg-green-50 text-slate-600 hover:text-green-700 border border-slate-200 hover:border-green-200 rounded-lg transition-colors group"><CheckSquare size={18} className="group-hover:scale-110 transition-transform" /><span className="text-sm font-medium">Mark Taken</span></button></div></div>))}</div>
                  }
               </div>
             )}
             {activeTab === 'risk' && (
                <div className="max-w-2xl mx-auto p-4">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><Activity className="text-blue-600"/> Risk Analysis Summary</h3>
                  {history.length === 0 ? (
                     <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                       <BarChart2 size={48} className="mx-auto mb-4 opacity-20" />
                       <p>No health reports available for analysis.</p>
                     </div>
                  ) : (
                     <div className="space-y-6">
                       {['low', 'medium', 'high', 'emergency'].map(sev => {
                         const count = severityCounts[sev] || 0;
                         const percentage = history.length > 0 ? (count / history.length) * 100 : 0;
                         return (
                           <div key={sev} className="space-y-2">
                             <div className="flex justify-between items-end">
                               <span className="text-xs font-bold uppercase text-slate-500 tracking-wider">{sev} Priority</span>
                               <span className="text-sm font-bold text-slate-800">{count} <span className="text-slate-400 text-xs font-normal">({Math.round(percentage)}%)</span></span>
                             </div>
                             <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden shadow-inner">
                               <div className={`h-full rounded-full ${severityColors[sev]} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }}></div>
                             </div>
                           </div>
                         );
                       })}
                       
                       <div className="mt-8 p-5 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                          <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                          <div>
                             <h4 className="font-bold text-blue-800 text-sm mb-1">Health Insight</h4>
                             <p className="text-xs text-blue-700 leading-relaxed">
                               You have recorded {history.length} consultation(s). 
                               {severityCounts['emergency'] > 0 || severityCounts['high'] > 0 
                                 ? " There have been high-risk symptoms reported recently. Please ensure you are following the recommended doctor visits." 
                                 : " Most reported symptoms appear to be lower risk. Continue monitoring your health and maintaining good hygiene."}
                             </p>
                          </div>
                       </div>
                     </div>
                  )}
                </div>
             )}
             {activeTab === 'quick' && <div className="max-w-4xl mx-auto space-y-6"><div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm"><h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><MapPin className="text-blue-600" /> Saved Facilities</h3>{savedFacilities.length === 0 ? <p className="text-sm text-slate-400">No facilities saved.</p> : <div className="space-y-3">{savedFacilities.slice(0, 3).map((f: any) => (<div key={f.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100"><div><p className="font-medium text-slate-800 text-sm">{f.name}</p><div className="flex items-center gap-2 mt-1"><span className="text-xs text-slate-500">{f.distance?.toFixed(1)} km away</span>{f.rating && <span className="flex items-center gap-0.5 text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100"><Star size={8} className="fill-yellow-500" />{f.rating}</span>} {f.opening_hours?.open_now ? <span className="text-[10px] text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100">Open</span> : f.opening_hours ? <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">Closed</span> : null}</div></div><a href={`https://www.google.com/maps/dir/?api=1&destination=${f.geometry.location.lat},${f.geometry.location.lng}`} target="_blank" rel="noreferrer" className="p-2 bg-white text-blue-600 rounded-full shadow-sm border border-slate-100 hover:bg-blue-50 transition-colors"><Navigation size={14} /></a></div>))}</div>}</div></div>}
          </div>
       </div>
    </div>
  );
};

// ... NEW COMPONENT DEFINITIONS ...

const ConsultationSummaryModal = ({ isOpen, onClose, report }: any) => {
   if (!isOpen || !report) return null;

   const severityColors: Record<string, string> = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      emergency: 'bg-red-100 text-red-800'
   };

   return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
         <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-800 flex items-center gap-2"><ClipboardCheck className="text-blue-600" /> Medical Summary Report</h3>
               <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-6">
               <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg text-slate-800">Assessment</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${severityColors[report.severity] || severityColors.low}`}>
                     {report.severity} Priority
                  </span>
               </div>
               
               <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed text-sm">{report.summary}</p>
               </div>
               
               <div>
                  <h5 className="font-bold text-sm text-slate-700 mb-2">Potential Conditions</h5>
                  <div className="flex flex-wrap gap-2">
                     {report.potentialConditions.map((c: string, i: number) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-medium border border-blue-100">
                           {c}
                        </span>
                     ))}
                  </div>
               </div>
               
               <div>
                  <h5 className="font-bold text-sm text-slate-700 mb-2">Recommendations</h5>
                  <ul className="space-y-2">
                     {report.recommendations.map((r: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                           <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                           {r}
                        </li>
                     ))}
                  </ul>
               </div>
               
               <div className="text-xs text-slate-400 italic pt-4 border-t border-slate-100">
                  ⚠️ {report.disclaimer}
               </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
               <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors">
                  Close
               </button>
            </div>
         </div>
      </div>
   );
};

const ApiKeyModal = ({ isOpen, onClose, onSave, onChangePersona, onChangeLocation, onChangeLanguage, location, persona }: any) => {
  if (!isOpen) return null;
  const [key, setKey] = useState(localStorage.getItem('medsahayak_api_key') || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <h3 className="font-bold text-slate-800">Settings</h3>
           <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600" /></button>
        </div>
        <div className="p-4 space-y-6">
           {/* API Key Section */}
           <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gemini API Key</label>
              <div className="relative">
                 <input 
                   type="password" 
                   value={key} 
                   onChange={(e) => setKey(e.target.value)} 
                   placeholder="Enter your API Key" 
                   className="w-full p-3 pr-10 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" 
                 />
                 <button onClick={() => onSave(key)} className="absolute right-2 top-2 p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors">
                    <Save size={16} />
                 </button>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Leave empty to use limited Demo Key.</p>
           </div>
           
           {/* User Preferences */}
           <div className="border-t border-slate-100 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Preferences</h4>
              
              <button 
                onClick={() => { onClose(); onChangePersona(); }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform">
                        {persona === 'female' ? '👩‍⚕️' : persona === 'male' ? '👨‍⚕️' : '🤖'}
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700">Switch Doctor</span>
                        <span className="text-xs text-slate-500">Current: {persona === 'female' ? 'Dr. Priya' : persona === 'male' ? 'Dr. Rajesh' : 'AI Assistant'}</span>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500" />
              </button>

              <button 
                onClick={() => { onClose(); onChangeLocation(); }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform">
                        <MapPin size={20} className="text-red-500" />
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700">Change Location</span>
                        <span className="text-xs text-slate-500 truncate max-w-[150px]">{location || 'Set your location'}</span>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500" />
              </button>

              <button 
                onClick={() => { onClose(); onChangeLanguage(); }}
                className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-200 transition-all group"
              >
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm group-hover:scale-110 transition-transform">
                        <Globe size={20} className="text-blue-500" />
                    </div>
                    <div className="text-left">
                        <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-700">Change Language</span>
                        <span className="text-xs text-slate-500">Update app language</span>
                    </div>
                 </div>
                 <ChevronRight size={18} className="text-slate-400 group-hover:text-blue-500" />
              </button>
           </div>
           
           <div className="text-center pt-2">
              <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noreferrer" className="text-xs text-slate-400 hover:text-blue-600 underline">Get Gemini API Key</a>
           </div>
        </div>
      </div>
    </div>
  );
};

const ResetConfirmModal = ({ isOpen, onClose, onConfirm }: any) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden transform transition-all scale-100 opacity-100">
        <div className="p-4 bg-red-50 border-b border-red-100 flex justify-between items-center">
           <h3 className="font-bold text-red-700 flex items-center gap-2">
             <AlertTriangle size={20} /> Reset Application
           </h3>
           <button onClick={onClose} className="text-red-300 hover:text-red-500 transition-colors">
             <X size={20} />
           </button>
        </div>
        
        <div className="p-5">
           <p className="text-slate-700 font-medium mb-3">Are you sure you want to reset?</p>
           <p className="text-xs text-slate-500 mb-4">This will permanently delete all your data including:</p>
           
           <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 mb-6">
              <ul className="text-xs text-slate-600 space-y-1.5">
                 <li className="flex items-center gap-2"><History size={12} /> Consultation History</li>
                 <li className="flex items-center gap-2"><Bell size={12} /> Reminders & Medications</li>
                 <li className="flex items-center gap-2"><User size={12} /> Personal Profile & Settings</li>
                 <li className="flex items-center gap-2"><FileText size={12} /> Medical Reports</li>
              </ul>
           </div>
           
           <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                 Cancel
              </button>
              <button onClick={onConfirm} className="flex-1 py-2.5 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 shadow-md transition-all active:scale-95">
                 Reset Everything
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const ReportAnalysisModal = ({ isOpen, onClose, onAnalyze, language }: any) => {
  if (!isOpen) return null;
  const t = LANGUAGES[language].translations.reportModal;
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const r = new FileReader();
      r.onloadend = () => setSelectedFile(r.result as string);
      r.readAsDataURL(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">{t.title}</h3>
        
        {!selectedFile ? (
            <label className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors">
                <Upload size={32} className="text-slate-400 mb-3" />
                <p className="text-sm text-slate-500 text-center font-medium">{t.dropzone}</p>
                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>
        ) : (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-4">
                <img src={selectedFile} alt="Report" className="w-full h-48 object-cover" />
                <button onClick={() => setSelectedFile(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full"><X size={16} /></button>
            </div>
        )}

        <div className="flex gap-3 mt-6">
            <button onClick={onClose} className="flex-1 py-3 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors">{t.cancelBtn}</button>
            <button onClick={() => { if(selectedFile) onAnalyze([selectedFile]); }} disabled={!selectedFile} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{t.analyzeBtn}</button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-3">{t.note}</p>
      </div>
    </div>
  );
};

const ActiveRemindersModal = ({ isOpen, onClose, reminders, onDelete, language }: any) => {
    if (!isOpen) return null;
    const t = LANGUAGES[language].translations.reminders;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
               <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                   <h3 className="font-bold text-slate-800 flex items-center gap-2"><BellRing size={18} /> {t.activeTitle}</h3>
                   <button onClick={onClose}><X size={20} className="text-slate-400" /></button>
               </div>
               <div className="p-4 overflow-y-auto flex-1">
                   {reminders.length === 0 ? (
                       <div className="text-center py-8 text-slate-400">
                           <Bell size={48} className="mx-auto mb-3 opacity-20" />
                           <p>{t.empty}</p>
                       </div>
                   ) : (
                       <div className="space-y-3">
                           {reminders.map((r: any) => (
                               <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex justify-between items-start">
                                   <div>
                                       <h4 className="font-bold text-slate-800 text-sm">{r.medicineName}</h4>
                                       <div className="text-xs text-slate-500 mt-1 flex flex-col gap-1">
                                           <span className="flex items-center gap-1"><Clock size={12} /> {r.frequency} ({r.times.join(', ')})</span>
                                           <span className="flex items-center gap-1"><Calendar size={12} /> {r.durationDays} {t.days}</span>
                                           {r.notes && <span className="italic">"{r.notes}"</span>}
                                       </div>
                                   </div>
                                   <button onClick={() => onDelete(r.id)} className="text-slate-300 hover:text-red-500 p-1"><Trash2 size={16} /></button>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
               <div className="p-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-500 text-center">
                   {t.enableNotif}
               </div>
           </div>
        </div>
    );
};

const FacilityListModal = ({ isOpen, onClose, facilities, isLoading, error, language }: any) => {
    if (!isOpen) return null;
    const t = LANGUAGES[language].translations.facilities;

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4 animate-fade-in">
            <div className="bg-white w-full md:max-w-lg h-[80vh] rounded-t-2xl md:rounded-2xl shadow-xl overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-800 flex items-center gap-2"><MapPin className="text-red-500" /> {t.title}</h3>
                    <button onClick={onClose}><X size={20} className="text-slate-500" /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                            <Loader2 size={32} className="animate-spin text-blue-500" />
                            <p>{t.loading}</p>
                        </div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 text-center px-6">
                            <AlertTriangle size={32} className="text-orange-400" />
                            <p>{error}</p>
                        </div>
                    ) : facilities.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                            <MapPin size={32} className="opacity-20" />
                            <p>{t.noResults}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {facilities.map((f: any) => (
                                <div key={f.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-slate-800">{f.name}</h4>
                                        {f.rating && <div className="flex items-center gap-1 text-xs font-bold bg-yellow-50 text-yellow-700 px-1.5 py-0.5 rounded"><Star size={10} className="fill-current" /> {f.rating}</div>}
                                    </div>
                                    <p className="text-sm text-slate-600 mt-1 line-clamp-2">{f.address}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3 text-xs text-slate-500">
                                            {(f.openingHours?.isOpen && typeof f.openingHours.isOpen === 'function') ? (f.openingHours.isOpen() ? <span className="text-green-600 font-medium">{t.openNow}</span> : <span className="text-red-500 font-medium">{t.closed}</span>) : (f.opening_hours?.open_now ? <span className="text-green-600 font-medium">{t.openNow}</span> : null)}
                                            {f.distance && <span>• {f.distance.toFixed(1)} km</span>}
                                        </div>
                                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${f.geometry.location.lat},${f.geometry.location.lng}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors">
                                            <Navigation size={12} /> {t.getDirections}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const isUsingDemoKey = () => {
  return !localStorage.getItem('medsahayak_api_key');
};

const SPLASH_MESSAGES = [
  { text: "MedSahayak\nYour Personal AI Health Assistant for Rural India" },
  { text: "मेडसहायक\nग्रामीण भारत के लिए आपका व्यक्तिगत एआई स्वास्थ्य सहायक" },
  { text: "மெட்சஹாயக்\nகிராமப்புற இந்தியாவுக்கான உங்கள் தனிப்பட்ட AI சுகாதார உதவியாளர்" },
  { text: "మెడ్‌సహాయక్\nగ్రామీణ భారతదేశం కోసం మీ వ్యక్తిగత AI ఆరోగ్య సహాయకుడు" },
  { text: "মেডসহায়ক\nগ্রামীণ ভারতের জন্য আপনার ব্যক্তিগত এআই স্বাস্থ্য সহকারী" },
  { text: "मेडसहायक\nग्रामीण भारतासाठी तुमचा वैयक्तिक एआई आरोग्य सहाय्यक" },
  { text: "મેડસહાયક\nગ્રામીણ ભારત માટે તમારું વ્યક્તિગત AI આરોગ્ય સહાયક" },
  { text: "ಮೆಡ್‌ಸಹಾಯಕ್\nಗ್ರಾಮೀಣ ಭಾರತಕ್ಕಾಗಿ ನಿಮ್ಮ ವೈಯಕ್ತಿಕ AI ಆರೋಗ್ಯ ಸಹಾಯಕ" },
  { text: "മെഡ്‌ಸಹായക്\nഗ്രാമീണ ഇന്ത്യയ്ക്കായുള്ള നിങ്ങളുടെ സ്വകാര്യ AI ആരോഗ്യ സഹായി" },
  { text: "ਮੇਡਸਹਾਇਕ\nਪੇਂਡੂ ਭਾਰਤ ਲਈ ਤੁਹਾਡਾ ਨਿੱਜੀ ਏਆਈ ਸਿਹਤ ਸਹਾਇਕ" }
];

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const totalDuration = 7000;
    const intervalDuration = totalDuration / SPLASH_MESSAGES.length;

    // Timer for total duration
    const timer = setTimeout(() => {
      onComplete();
    }, totalDuration);

    // Timer for text rotation
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % SPLASH_MESSAGES.length);
    }, intervalDuration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onComplete]);

  const currentMessage = SPLASH_MESSAGES[index];
  const [title, subtitle] = currentMessage.text.split('\n');

  return (
    <div className="h-screen w-full bg-blue-600 flex flex-col items-center justify-center text-white p-6 relative overflow-hidden">
       {/* Decorative circles */}
       <div className="absolute top-[-10%] left-[-10%] w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
       <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 rounded-full bg-white/10 blur-3xl"></div>
       
       <div className="relative z-10 flex flex-col items-center text-center max-w-2xl mx-auto">
          <div className="w-24 h-24 bg-white rounded-3xl shadow-2xl flex items-center justify-center mb-8 rotate-3 transform transition-transform hover:rotate-0">
             <Stethoscope size={48} className="text-blue-600" />
          </div>
          
          <div key={index} className="animate-fade-in flex flex-col items-center min-h-[180px] justify-center">
             <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">{title}</h1>
             <p className="text-blue-100 text-lg md:text-xl font-medium leading-relaxed max-w-lg">{subtitle}</p>
          </div>
          
          <div className="flex gap-2 mt-8">
             <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
             <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
             <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
          </div>
       </div>
       
       <div className="absolute bottom-6 text-blue-200/60 text-xs">
          Powered by Gemini 3.0 PRO
       </div>
    </div>
  );
};

const OnboardingScreen = ({ step, onStepChange, userData, onUpdateData }: any) => {
  const t = LANGUAGES[userData.language || 'en'].translations.onboarding;

  // New state for location autocomplete
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const isSelectingRef = useRef(false);

  const handleNext = () => onStepChange(step + 1);
  const handleBack = () => onStepChange(step - 1);
  const handleComplete = () => {
      localStorage.setItem('medsahayak_onboarding_complete', 'true');
      onStepChange(6);
  };

  useEffect(() => {
    // Hide suggestions when step changes
    setShowSuggestions(false);
  }, [step]);

  useEffect(() => {
    if (isSelectingRef.current) {
        // Skip fetch if this update was due to a selection
        return;
    }

    const timer = setTimeout(() => {
        if (step === 2 && userData.location && userData.location.length > 2) {
            fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userData.location)}&countrycodes=in&limit=5&addressdetails=1`)
            .then(res => res.json())
            .then(data => {
                const uniqueCities = new Set<string>();
                data.forEach((item: any) => {
                    const addr = item.address;
                    const city = addr.city || addr.town || addr.village || addr.county || addr.suburb;
                    const state = addr.state;
                    if (city && state) {
                        uniqueCities.add(`${city}, ${state}`);
                    } else {
                        // Fallback
                        uniqueCities.add(item.display_name.split(',').slice(0,2).join(','));
                    }
                });
                
                if (uniqueCities.size > 0) {
                    setSuggestions(Array.from(uniqueCities));
                    setShowSuggestions(true);
                } else {
                    setShowSuggestions(false);
                }
            })
            .catch(() => setShowSuggestions(false));
        } else {
            setShowSuggestions(false);
        }
    }, 400); 
    return () => clearTimeout(timer);
  }, [userData.location, step]);

  const handleLocationSelect = (loc: string) => {
      isSelectingRef.current = true;
      onUpdateData({...userData, location: loc});
      setShowSuggestions(false);
      // Reset ref after a short delay to allow subsequent editing
      setTimeout(() => { isSelectingRef.current = false; }, 500);
  };

  const handleLocationInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      isSelectingRef.current = false;
      onUpdateData({...userData, location: e.target.value});
  };

  const steps = [
    { num: 2, label: 'Language' },
    { num: 3, label: 'Details' },
    { num: 4, label: 'Doctor' },
    { num: 5, label: 'Finish' }
  ];

  const StepIndicator = () => (
     <div className="mb-10 px-2">
        <div className="flex justify-between items-center relative">
           {/* Background Line */}
           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-100 rounded-full -z-10"></div>
           
           {/* Active Line */}
           <div 
             className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-500 ease-out"
             style={{ width: `${((step - 2) / 3) * 100}%` }}
           ></div>

           {steps.map((s, idx) => {
              const isActive = step === s.num;
              const isCompleted = step > s.num;
              
              return (
                 <div key={s.num} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'bg-white border-blue-600 text-blue-600 scale-110 shadow-lg' : isCompleted ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200 text-slate-300'}`}>
                       {isCompleted ? <CheckCircle size={14} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                    </div>
                    <span className={`absolute -bottom-6 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${isActive ? 'text-blue-600 transform translate-y-0 opacity-100' : 'text-slate-400 opacity-0 transform -translate-y-1'}`}>
                       {s.label}
                    </span>
                 </div>
              );
           })}
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
       <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-6 md:p-8 animate-fade-in relative overflow-hidden flex flex-col min-h-[500px]">
          {step > 2 && (
            <button onClick={handleBack} className="absolute top-6 left-6 text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-full transition-colors">
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="text-center pt-8 pb-4">
             <StepIndicator />
             <div className="animate-slide-up" key={`h2-${step}`}>
                {(step === 2 || step === 3 || step === 4) && (
                    <h2 className="text-2xl font-bold text-slate-800">
                        {step === 2 && t.step2Title}
                        {step === 3 && t.step3Title}
                        {step === 4 && t.step4Title}
                    </h2>
                )}
                {step === 5 && (
                    <div className="text-xl md:text-2xl font-bold text-slate-800 leading-snug px-2">
                        Welcome <span className="text-blue-600">{userData.name}</span>.<br />
                        I am {(t.personas[userData.persona as keyof typeof t.personas] || t.personas.neutral).name}, your Medical AI assistant.
                    </div>
                )}
             </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center animate-slide-up" key={`content-${step}`}>

          {step === 2 && (
             <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                   <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2"><Globe size={14}/> {t.languageLabel}</label>
                   <div className="grid grid-cols-2 gap-3">
                      {Object.keys(LANGUAGES).map((code) => {
                          const lang = LANGUAGES[code as Language];
                          return (
                             <button key={code} onClick={() => onUpdateData({...userData, language: code})} className={`p-3 rounded-xl border text-left transition-all hover:scale-105 active:scale-95 ${userData.language === code ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600 shadow-sm' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                <div className="flex items-center gap-3">
                                  {/* Replaced Flag with branded icon */}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${userData.language === code ? 'bg-blue-100 text-blue-600' : 'bg-slate-50 text-slate-300'}`}>
                                    <Stethoscope size={16} />
                                  </div>
                                  <span className={`font-medium text-sm ${userData.language === code ? 'text-blue-800' : 'text-slate-700'}`}>{lang.native}</span>
                                </div>
                             </button>
                          );
                      })}
                   </div>
                </div>
                
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-2"><MapPin size={14}/> {t.locationLabel}</label>
                   <div className="relative group">
                      <MapPin className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input 
                         type="text" 
                         value={userData.location} 
                         onChange={handleLocationInput}
                         placeholder={t.locationPlaceholder}
                         className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm" 
                         autoComplete="off"
                      />
                      <button className="absolute right-2 top-2 p-1.5 bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors" title={t.detectLocation}>
                         <Navigation size={16} />
                      </button>
                      
                      {/* Suggestions Dropdown */}
                      {suggestions.length > 0 && showSuggestions && (
                          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl z-20 max-h-60 overflow-y-auto animate-fade-in">
                              {suggestions.map((s, i) => (
                                  <button 
                                    key={i}
                                    onClick={() => handleLocationSelect(s)}
                                    className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 border-b border-slate-50 last:border-none flex items-center gap-2 transition-colors"
                                  >
                                      <MapPin size={14} className="text-slate-400" />
                                      {s}
                                  </button>
                              ))}
                          </div>
                      )}
                   </div>
                </div>
                
                <button onClick={handleNext} disabled={!userData.location} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group">
                   {t.continueBtn} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          )}

          {step === 3 && (
             <div className="space-y-5">
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.nameLabel}</label>
                   <div className="relative group">
                      <User className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input type="text" value={userData.name} onChange={e => onUpdateData({...userData, name: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="e.g. Rahul Kumar" />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.ageLabel}</label>
                   <div className="relative group">
                      <Calendar className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input type="number" value={userData.age} onChange={e => onUpdateData({...userData, age: e.target.value})} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="e.g. 35" />
                   </div>
                </div>
                <div>
                   <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">{t.phoneLabel} (Optional)</label>
                   <div className="relative group">
                      <Phone className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={18} />
                      <input type="tel" value={userData.phone} onChange={e => onUpdateData({...userData, phone: e.target.value})} placeholder={t.phonePlaceholder} className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm" />
                   </div>
                </div>
                <button onClick={handleNext} disabled={!userData.name || !userData.age} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2">
                   {t.continueBtn} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          )}

          {step === 4 && (
             <div className="space-y-4">
                <p className="text-sm text-slate-500 text-center mb-2">Select who you'd like to consult with:</p>
                {[
                  { id: 'female', icon: '👩‍⚕️', ...t.personas.female },
                  { id: 'male', icon: '👨‍⚕️', ...t.personas.male },
                  { id: 'neutral', icon: '🤖', ...t.personas.neutral }
                ].map(p => (
                   <button key={p.id} onClick={() => onUpdateData({...userData, persona: p.id})} className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all duration-300 ${userData.persona === p.id ? 'border-blue-600 bg-blue-50 shadow-md scale-[1.02]' : 'border-slate-100 hover:border-blue-200 bg-white hover:bg-slate-50'}`}>
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shadow-sm mr-4 border transition-colors ${userData.persona === p.id ? 'bg-white border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                         {p.icon}
                      </div>
                      <div className="text-left flex-1">
                         <h3 className={`font-bold text-lg ${userData.persona === p.id ? 'text-blue-800' : 'text-slate-800'}`}>{p.name}</h3>
                         <p className="text-xs text-slate-500">{p.desc}</p>
                      </div>
                      {userData.persona === p.id && <div className="ml-2 text-blue-600 animate-fade-in"><CheckCircle size={24} className="fill-blue-600 text-white" /></div>}
                   </button>
                ))}
                <button onClick={handleNext} className="w-full mt-4 bg-blue-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 group">
                   {t.continueBtn} <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
             </div>
          )}

          {step === 5 && (
             <div className="space-y-6">
                <div className="bg-white rounded-3xl p-1 border border-slate-100 shadow-sm relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-50 to-transparent"></div>
                   <div className="p-5 relative z-10">
                      <div className="flex justify-center mb-6">
                         <div className="w-20 h-20 bg-white rounded-full p-1 shadow-lg relative">
                           <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-3xl">
                             {userData.persona === 'female' ? '👩‍⚕️' : userData.persona === 'male' ? '👨‍⚕️' : '🤖'}
                           </div>
                         </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl"><User size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Patient Details</p>
                                    <p className="font-bold text-slate-800 text-lg">{userData.name}</p>
                                    <p className="text-sm text-slate-500 font-medium">{userData.age} years old</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-green-100 text-green-600 rounded-xl"><MapPin size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Location</p>
                                    <p className="font-bold text-slate-800 text-lg">{userData.location}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl"><Globe size={20} /></div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Selected Language</p>
                                    <div className="flex items-center gap-2 font-bold text-slate-800 text-lg">
                                       <span>{LANGUAGES[userData.language as Language].name}</span>
                                       <span className="text-xl">{LANGUAGES[userData.language as Language].flag}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="flex gap-3 mt-4">
                   <button onClick={() => onStepChange(2)} className="flex-1 py-3.5 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors text-sm">
                      {t.resetBtn}
                   </button>
                   <button onClick={handleComplete} className="flex-[2] bg-blue-600 text-white py-3.5 rounded-xl font-bold shadow-lg hover:bg-blue-700 hover:shadow-blue-500/30 transition-all flex items-center justify-center gap-2 active:scale-95">
                      {t.startChatBtn} <ArrowRight size={18} />
                   </button>
                </div>
             </div>
          )}
          
          </div>
       </div>
    </div>
  );
};

const Header = ({ language, onOpenSettings, onOpenSidebar, onOpenReminders, onOpenFacilityFinder, activeRemindersCount, persona, location, onOpenDashboard }: any) => {
  const personaData = LANGUAGES[language]?.translations.onboarding.personas[persona] || LANGUAGES['en'].translations.onboarding.personas['neutral'];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
       <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <button onClick={onOpenSidebar} className="p-2 hover:bg-slate-100 rounded-full text-slate-600 transition-colors md:hidden">
                <Menu size={24} />
             </button>
             <div className="flex items-center gap-2" onClick={onOpenDashboard} role="button">
                <div className="bg-blue-600 text-white p-1.5 rounded-lg">
                   <Stethoscope size={20} />
                </div>
                <div className="hidden md:block">
                   <h1 className="font-bold text-lg text-slate-800 leading-tight">MedSahayak</h1>
                   <p className="text-[10px] text-slate-500 font-medium">with {personaData.name}</p>
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
             {location && (
                <div className="hidden md:flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                   <MapPin size={14} className="text-red-500" />
                   <span className="text-xs font-medium text-slate-600 max-w-[100px] truncate">{location}</span>
                </div>
             )}
             
             <button onClick={onOpenFacilityFinder} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative" title="Find Facilities">
                <Map size={20} />
             </button>

             <button onClick={onOpenReminders} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative" title="Reminders">
                <Bell size={20} />
                {activeRemindersCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
             </button>

             <button onClick={onOpenDashboard} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative" title="Dashboard">
                <LayoutDashboard size={20} />
             </button>

             <button onClick={onOpenSettings} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative" title="Settings">
                <Settings size={20} />
             </button>
          </div>
       </div>
    </header>
  );
};

const EmergencyBanner = ({ visible, text }: { visible: boolean, text: any }) => {
  if (!visible) return null;
  return (
    <div className="bg-red-600 text-white p-4 animate-pulse shadow-lg z-10">
       <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
             <ShieldAlert size={32} className="animate-bounce" />
             <div>
                <h3 className="font-bold text-lg uppercase tracking-wider">{text.emergencyTitle}</h3>
                <p className="text-sm text-red-100 font-medium">{text.hospitalMsg}</p>
             </div>
          </div>
          <a href="tel:108" className="bg-white text-red-600 px-6 py-2 rounded-full font-black shadow-md hover:scale-105 transition-transform flex items-center gap-2">
             <Phone size={18} className="fill-current" /> {text.callBtn}
          </a>
       </div>
    </div>
  );
};

const ChatMessage = ({ message, languageCode, playingMessageId, setPlayingMessageId }: any) => {
  const isBot = message.sender === Sender.BOT;
  const isPlaying = playingMessageId === message.id;

  const toggleSpeech = () => {
    if (isPlaying) {
       window.speechSynthesis.cancel();
       setPlayingMessageId(null);
    } else {
       window.speechSynthesis.cancel(); // Stop any current
       const utterance = new SpeechSynthesisUtterance(message.text);
       utterance.lang = languageCode || 'en-IN';
       utterance.onend = () => setPlayingMessageId(null);
       window.speechSynthesis.speak(utterance);
       setPlayingMessageId(message.id);
    }
  };

  // Simple formatter for bold text (**text**)
  const formatText = (text: string) => {
      const parts = text.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i}>{part.slice(2, -2)}</strong>;
          }
          return part;
      });
  };

  return (
    <div className={`flex w-full mb-6 animate-slide-in ${isBot ? 'justify-start' : 'justify-end'}`}>
       <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-sm ${isBot ? 'bg-white border border-slate-200' : 'bg-blue-600 text-white'}`}>
             {isBot ? <Stethoscope size={18} className="text-blue-600" /> : <User size={18} />}
          </div>
          
          <div className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
             <div className={`p-4 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${isBot ? 'bg-white border border-slate-100 text-slate-800 rounded-tl-none' : 'bg-blue-600 text-white rounded-tr-none'}`}>
                {message.image && (
                   <div className="mb-3 rounded-xl overflow-hidden border border-black/10">
                      <img src={message.image} alt="Uploaded" className="max-w-full h-auto object-cover max-h-60" />
                   </div>
                )}
                <div className="whitespace-pre-wrap">{formatText(message.text)}</div>
             </div>
             
             {isBot && (
                <div className="mt-1 flex gap-2">
                   <button onClick={toggleSpeech} className={`p-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${isPlaying ? 'bg-blue-100 text-blue-700' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                      {isPlaying ? <Volume2 size={14} className="animate-pulse" /> : <Volume2 size={14} />}
                      {isPlaying ? 'Playing...' : 'Listen'}
                   </button>
                </div>
             )}
             <span className="text-[10px] text-slate-300 mt-1 mx-2">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
             </span>
          </div>
       </div>
    </div>
  );
};

const ResultPanel = ({ report, onDownload, onAddReminder, onFindFacilities, language, onWhatsAppShare }: any) => {
  const t = LANGUAGES[language].translations;
  const isEmergency = report.severity === 'emergency';
  
  return (
    <div className={`rounded-2xl border-l-4 shadow-md overflow-hidden animate-fade-in ${isEmergency ? 'bg-red-50 border-red-500' : 'bg-white border-blue-500'}`}>
       <div className={`p-4 border-b flex justify-between items-start ${isEmergency ? 'border-red-100' : 'border-slate-100'}`}>
          <div>
             <div className="flex items-center gap-2 mb-1">
                <SeverityBadge severity={report.severity} />
                <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">AI Medical Summary</span>
             </div>
             <h3 className={`font-bold text-lg ${isEmergency ? 'text-red-700' : 'text-slate-800'}`}>{report.summary}</h3>
          </div>
       </div>
       
       <div className="p-4 space-y-4">
          <div>
             <h4 className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><Activity size={16} /> Potential Conditions</h4>
             <div className="flex flex-wrap gap-2">
                {report.potentialConditions.map((c: string, i: number) => (
                   <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">{c}</span>
                ))}
             </div>
          </div>
          
          <div>
             <h4 className="text-sm font-bold text-slate-500 uppercase mb-2 flex items-center gap-2"><CheckCircle size={16} /> Recommended Actions</h4>
             <ul className="space-y-2">
                {report.recommendations.map((r: string, i: number) => (
                   <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                      <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0"></div>
                      {r}
                   </li>
                ))}
             </ul>
          </div>
       </div>
       
       <div className="bg-slate-50 p-4 border-t border-slate-100 flex flex-wrap gap-2">
          <button onClick={onDownload} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm">
             <FileText size={16} /> Download PDF
          </button>
          <button onClick={onFindFacilities} className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm">
             <MapPin size={16} /> {t.facilities.btn}
          </button>
          <button onClick={onWhatsAppShare} className="flex items-center justify-center gap-2 bg-[#25D366] text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-[#128C7E] transition-colors shadow-sm">
             <Share2 size={16} /> Share
          </button>
       </div>
       
       <div className="px-4 py-2 bg-slate-100 text-[10px] text-slate-400 text-center">
          {report.disclaimer}
       </div>
    </div>
  );
};

// ... Main App Component ...

const App: React.FC = () => {
  // Load initial state from local storage
  const getStoredData = () => {
    try {
      const saved = localStorage.getItem('medsahayak_user_data');
      return saved ? JSON.parse(saved) : { 
        language: 'en', 
        persona: 'neutral', 
        name: '', 
        age: '', 
        phone: '', 
        location: '' 
      };
    } catch { 
      return { language: 'en', persona: 'neutral', name: '', age: '', phone: '', location: '' }; 
    }
  };

  // Always start at Step 1 (Splash) on reload
  const [step, setStep] = useState<number>(1);

  const [userData, setUserData] = useState<any>(getStoredData());

  // App Logic State
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [history, setHistory] = useState<Consultation[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isEmergencyAlert, setIsEmergencyAlert] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(isUsingDemoKey());
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [isFindingFacilities, setIsFindingFacilities] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [facilityError, setFacilityError] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [analyzingReport, setAnalyzingReport] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // New State for Report Summary
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [currentReport, setCurrentReport] = useState<MedicalReport | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save User Data whenever it changes
  useEffect(() => {
    localStorage.setItem('medsahayak_user_data', JSON.stringify(userData));
  }, [userData]);

  // Load history/reminders
  useEffect(() => {
    const savedHistory = localStorage.getItem('medsahayak_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    const savedReminders = localStorage.getItem('medsahayak_reminders');
    if (savedReminders) setReminders(JSON.parse(savedReminders));
  }, []);

  // Initialize Chat when entering Step 6
  useEffect(() => {
    if (step === 6 && messages.length === 0) {
      addWelcomeMessage(userData.persona, userData.language, userData.name);
    }
  }, [step]);

  // Sync state persistence
  useEffect(() => { localStorage.setItem('medsahayak_history', JSON.stringify(history)); }, [history]);
  useEffect(() => { localStorage.setItem('medsahayak_reminders', JSON.stringify(reminders)); }, [reminders]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, analyzingReport]);

  const addWelcomeMessage = (persona: DoctorPersona, lang: Language, name?: string) => {
    let welcomeText = LANGUAGES[lang].translations.welcomeMessages[persona] || LANGUAGES['en'].translations.welcomeMessages[persona];
    if (name) welcomeText = welcomeText.replace(/^([^\!]+)\!/, `$1 ${name}!`);
    setMessages([{ id: 'init', text: welcomeText, sender: Sender.BOT, timestamp: Date.now() }]);
  };

  // --- Handlers for Settings ---

  const handleResetLocation = () => {
    setUserData({ ...userData, location: '' });
    setStep(2);
  };

  const handleResetPersona = () => {
    setStep(4);
  };

  const handleResetLanguage = () => {
    setStep(2);
  };

  const handleStartNewConsultation = () => {
    // 1. Reset Chat State
    setReport(null);
    setIsEmergencyAlert(false);
    setLoading(false);
    setInput('');
    setMessages([]); // Clear messages immediately
    
    // 2. Add Welcome Message after short delay to ensure clean state
    setTimeout(() => {
        addWelcomeMessage(userData.persona, userData.language, userData.name);
    }, 50);

    // 3. Close Sidebar on mobile
    setShowHistorySidebar(false);
  };

  const handleFullReset = () => {
    const t = LANGUAGES[userData.language].translations;
    // 1. Confirmation Dialog
    if(window.confirm(t.confirmReset)) {
        // 2. Clear All Storage
        localStorage.clear();
        // 3. Reload Page to restart from Splash
        window.location.reload();
    }
  };

  const handleSaveApiKey = (key: string) => {
    if (key.trim()) localStorage.setItem('medsahayak_api_key', key.trim());
    else localStorage.removeItem('medsahayak_api_key');
    setIsDemoMode(isUsingDemoKey());
  };
  
  // --- Core Features Handlers (simplified for brevity, logic preserved) ---
  const handleAddReminder = (reminder: Reminder) => setReminders(prev => [...prev, reminder]);
  const handleUpdateReminder = (updatedReminder: Reminder) => setReminders(prev => prev.map(r => r.id === updatedReminder.id ? updatedReminder : r));
  const handleDeleteReminder = (id: string) => setReminders(prev => prev.filter(r => r.id !== id));
  
  const handleFindFacilities = async () => {
    setIsFindingFacilities(true);
    setFacilityError(null);
    setShowFacilityModal(true);
    setFacilities([]);
    try {
      const savedLocation = userData?.location;
      let latitude = 12.9716;  // Default: Bangalore
      let longitude = 77.5946;

      if (savedLocation && savedLocation.trim()) {
        try {
          // Call our backend to geocode the location
          const geocodeResponse = await fetch('https://medsahayak-api.vercel.app/api/maps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address: savedLocation })
          });
          
          if (geocodeResponse.ok) {
            const geocodeData = await geocodeResponse.json();
            if (geocodeData.latitude && geocodeData.longitude) {
              latitude = geocodeData.latitude;
              longitude = geocodeData.longitude;
            }
          } else {
            console.error('Geocoding failed, using default location');
          }
        } catch (error) {
          console.error('Geocoding error:', error);
        }
      }

      const response = await fetch('https://medsahayak-api.vercel.app/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latitude, longitude, severity: report?.severity || 'medium' })
      });
      const data = await response.json();
      if (data.facilities?.length > 0) {
        const mapped = data.facilities.map((f: any) => ({ ...f, id: f.placeId, distance: parseFloat(f.distance.replace(' km', '')), geometry: { location: f.location } }));
        setFacilities(mapped);
        localStorage.setItem('medsahayak_saved_facilities', JSON.stringify(mapped.slice(0, 5)));
      } else { setFacilityError(LANGUAGES[userData.language].translations.facilities.noResults); }
    } catch (e) { setFacilityError("Unable to find facilities."); } finally { setIsFindingFacilities(false); }
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !selectedImage) || loading) return;
    const userMsg: Message = { id: Date.now().toString(), text: input, image: selectedImage || undefined, sender: Sender.USER, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]); setInput(''); setSelectedImage(null); setLoading(true);
    const response = await sendMessageToGemini(messages, input, selectedImage, userData.language, userData.persona);
    const botMsg: Message = { id: (Date.now() + 1).toString(), text: response.text, sender: Sender.BOT, timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg, botMsg];
    setMessages(prev => [...prev, botMsg]); setLoading(false);
    if (response.isEmergency) {
      setIsEmergencyAlert(true);
      generateMedicalReport(updatedMessages, userData.language).then(rep => { setReport(rep); setHistory(prev => [{ id: Date.now().toString(), date: new Date().toISOString(), messages: updatedMessages, report: rep }, ...prev]); });
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    const rep = await generateMedicalReport(messages, userData.language);
    setReport(rep); setLoading(false);
    setHistory(prev => [{ id: Date.now().toString(), date: new Date().toISOString(), messages, report: rep }, ...prev]);
  };
  
  const handleGenerateSummary = async () => {
     if (messages.length < 2) return; // Need at least some conversation
     
     setLoading(true);
     const report = await generateMedicalReport(messages, userData.language as Language);
     setLoading(false);
     
     if (report) {
        setCurrentReport(report);
        setShowSummaryReport(true);
        
        // Save to history with report
        const newConsultation: Consultation = {
           id: Date.now().toString(),
           date: new Date().toISOString(),
           messages: messages,
           report: report
        };
        
        // Check if we should update existing history item or create new
        // For simplicity, just append to history for now
        setHistory(prev => [...prev, newConsultation]);
     }
  };

  const handleAnalyzeReport = async (images: string[]) => {
    setShowReportModal(false); setAnalyzingReport(true);
    const userMsg: Message = { id: Date.now().toString(), text: "📄 Document Analysis", image: images[0], sender: Sender.USER, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    const txt = await analyzeMedicalReport(images, userData.language);
    setAnalyzingReport(false);
    setMessages(prev => [...prev, { id: Date.now().toString(), text: txt, sender: Sender.BOT, timestamp: Date.now() }]);
  };

  const handleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) return;
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = LANGUAGES[userData.language].code;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => setInput(prev => prev + (prev ? ' ' : '') + e.results[0][0].transcript);
    recognition.start();
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(41, 128, 185); // Blue color
    doc.text("MedSahayak Medical Report", 20, 20);
    
    // Date
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 30);
    doc.text(`Patient: ${userData.name || 'Anonymous'} (${userData.age || 'N/A'})`, 20, 35);
    
    // Severity
    doc.setFontSize(14);
    if (report.severity === 'emergency') doc.setTextColor(220, 53, 69); // Red
    else if (report.severity === 'high') doc.setTextColor(253, 126, 20); // Orange
    else doc.setTextColor(40, 167, 69); // Green
    
    doc.text(`Severity Level: ${report.severity.toUpperCase()}`, 20, 50);
    
    // Summary
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Summary:", 20, 65);
    doc.setFontSize(10);
    const summaryLines = doc.splitTextToSize(report.summary, 170);
    doc.text(summaryLines, 20, 72);
    
    let yPos = 72 + (summaryLines.length * 5) + 10;
    
    // Potential Conditions
    doc.setFontSize(12);
    doc.text("Potential Conditions:", 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    report.potentialConditions.forEach((cond: string) => {
      doc.text(`• ${cond}`, 25, yPos);
      yPos += 5;
    });
    yPos += 5;
    
    // Recommendations
    doc.setFontSize(12);
    doc.text("Recommended Actions:", 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    report.recommendations.forEach((rec: string) => {
      doc.text(`• ${rec}`, 25, yPos);
      yPos += 5;
    });
    
    // Disclaimer
    yPos += 15;
    doc.setFontSize(8);
    doc.setTextColor(150);
    const disclaimerLines = doc.splitTextToSize(`Disclaimer: ${report.disclaimer}`, 170);
    doc.text(disclaimerLines, 20, yPos);
    
    doc.save(`MedSahayak_Report_${Date.now()}.pdf`);
  };

  const handleWhatsAppShare = () => {
    if (!report) return;
    const text = `*MedSahayak Report*\n\n*Severity:* ${report.severity.toUpperCase()}\n\n*Summary:* ${report.summary}\n\n*Recommendations:*\n${report.recommendations.map(r => `• ${r}`).join('\n')}\n\n*Disclaimer:* ${report.disclaimer}`;
    const encodedText = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encodedText}`, '_blank');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
     if (e.target.files?.[0]) {
        const reader = new FileReader();
        reader.onloadend = async () => {
           const base64 = reader.result as string;
           const userMsg: Message = {
              id: Date.now().toString(),
              text: "Analyzed this image",
              sender: Sender.USER,
              timestamp: Date.now(),
              image: base64
           };
           setMessages(prev => [...prev, userMsg]);
           setLoading(true);
           
           const response = await sendMessageToGemini(
              messages,
              "I have uploaded an image. Please analyze it.",
              base64,
              userData.language as Language,
              userData.persona as DoctorPersona
           );
           
           const botMsg: Message = {
             id: (Date.now() + 1).toString(),
             text: response.text,
             sender: Sender.BOT,
             timestamp: Date.now()
           };
           setMessages(prev => [...prev, botMsg]);
           setLoading(false);
        };
        reader.readAsDataURL(e.target.files[0]);
     }
  };

  // --- RENDER FLOW ---

  // Step 1: Splash Screen
  if (step === 1) {
    return <SplashScreen onComplete={() => {
        const isComplete = localStorage.getItem('medsahayak_onboarding_complete');
        if (isComplete === 'true') {
            setStep(5);
        } else {
            setStep(2);
        }
    }} />;
  }

  // Steps 2-5: Onboarding Flow
  if (step >= 2 && step <= 5) {
    return (
      <OnboardingScreen 
        step={step} 
        onStepChange={setStep} 
        userData={userData} 
        onUpdateData={setUserData} 
      />
    );
  }

  // Step 6: Main Chat Application
  const currentTranslations = LANGUAGES[userData.language].translations;

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">
      <ApiKeyModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
        onSave={handleSaveApiKey}
        onChangePersona={handleResetPersona}
        onChangeLocation={handleResetLocation}
        onChangeLanguage={handleResetLanguage}
        location={userData.location || ''}
        persona={userData.persona}
      />
      <ReportAnalysisModal isOpen={showReportModal} onClose={() => setShowReportModal(false)} onAnalyze={handleAnalyzeReport} language={userData.language} />
      <DashboardModal isOpen={showDashboard} onClose={() => setShowDashboard(false)} history={history} reminders={reminders} onAddReminder={handleAddReminder} onUpdateReminder={handleUpdateReminder} onDeleteReminder={handleDeleteReminder} facilities={facilities} userData={userData} />
      <ActiveRemindersModal isOpen={showRemindersModal} onClose={() => setShowRemindersModal(false)} reminders={reminders} onDelete={handleDeleteReminder} language={userData.language} />
      <FacilityListModal isOpen={showFacilityModal} onClose={() => setShowFacilityModal(false)} facilities={facilities} isLoading={isFindingFacilities} error={facilityError} language={userData.language} />
      
      <ConsultationSummaryModal 
         isOpen={showSummaryReport}
         onClose={() => setShowSummaryReport(false)}
         report={currentReport}
      />
      
      <Header 
        language={userData.language} 
        onOpenSettings={() => setShowSettings(true)}
        onOpenSidebar={() => setShowHistorySidebar(true)}
        onOpenReminders={() => setShowRemindersModal(true)}
        onOpenFacilityFinder={handleFindFacilities}
        activeRemindersCount={reminders.length}
        persona={userData.persona}
        location={userData.location}
        onOpenDashboard={() => setShowDashboard(true)}
      />

      <div className="flex flex-1 overflow-hidden max-w-6xl mx-auto w-full">
        {/* Sidebar */}
        <aside className={`absolute inset-y-0 left-0 z-30 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 shadow-xl md:shadow-none ${showHistorySidebar ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Menu size={20} className="text-slate-600" /> Menu</h2>
              <button onClick={() => setShowHistorySidebar(false)} className="md:hidden text-slate-400 hover:text-slate-600 p-1"><X size={20} /></button>
            </div>
            
            <div className="p-4 border-b border-slate-100 bg-white shadow-[0_2px_8px_-4px_rgba(0,0,0,0.1)] z-10">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><Zap size={14} /> Quick Actions</h3>
                
                <button type="button" onClick={() => { setShowHistorySidebar(false); setShowRemindersModal(true); }} className="w-full flex items-center justify-between p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm mb-3">
                    <div className="flex items-center gap-3"><BellRing size={18} /> <span>{currentTranslations.reminders.activeTitle}</span></div>
                    {reminders.length > 0 && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">{reminders.length}</span>}
                </button>

                <button type="button" onClick={handleStartNewConsultation} className="w-full flex items-center justify-start gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm mb-3">
                    <MessageSquarePlus size={18} /> <span>{currentTranslations.startNew}</span>
                </button>

                <button type="button" onClick={handleFullReset} className="w-full flex items-center justify-start gap-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors shadow-sm">
                    <RotateCcw size={18} /> <span>{currentTranslations.resetConversation}</span>
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2"><History size={14} /> Past Consultations</h3>
                {history.length === 0 ? 
                    <div className="text-center p-8 text-slate-400 text-sm italic border-2 border-dashed border-slate-200 rounded-xl">No past consultations found.</div> : 
                    <div className="space-y-2">
                        {history.map((c) => (
                            <div key={c.id} onClick={() => { setMessages(c.messages); setReport(c.report || null); setShowHistorySidebar(false); setIsEmergencyAlert(c.report?.severity === Severity.EMERGENCY); }} className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer group transition-all">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(c.date).toLocaleDateString()}</span>
                                    <button onClick={(e) => { e.stopPropagation(); setHistory(prev => prev.filter(h => h.id !== c.id)); }} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                                <p className="text-sm text-slate-700 font-medium line-clamp-1">{c.report?.summary || c.messages[1]?.text || "Consultation Record"}</p>
                            </div>
                        ))}
                    </div>
                }
            </div>
          </div>
        </aside>
        {showHistorySidebar && <div className="fixed inset-0 bg-black/20 z-20 md:hidden" onClick={() => setShowHistorySidebar(false)} />}

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full relative">
          <EmergencyBanner visible={isEmergencyAlert} text={currentTranslations} />
          <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-32">
             <div className="max-w-2xl mx-auto">
                {messages.map((msg) => (<ChatMessage key={msg.id} message={msg} languageCode={LANGUAGES[userData.language].code} playingMessageId={playingMessageId} setPlayingMessageId={setPlayingMessageId} />))}
                {(loading || analyzingReport) && <div className="flex justify-start w-full mb-4"><div className="bg-white px-4 py-3 rounded-2xl rounded-bl-none shadow-sm border border-slate-100 flex items-center gap-2">{analyzingReport ? <><FileText size={18} className="text-blue-500 animate-pulse" /><span className="text-sm text-slate-500 font-medium">{currentTranslations.reportModal.analyzing}</span></> : <><Loader2 size={18} className="text-blue-500 animate-spin" /><span className="text-sm text-slate-500 font-medium">MedSahayak is thinking...</span></>}</div></div>}
                {report && <div className="mb-6"><ResultPanel report={report} onDownload={downloadPDF} onAddReminder={handleAddReminder} onFindFacilities={handleFindFacilities} language={userData.language} onWhatsAppShare={handleWhatsAppShare} /></div>}
                <div ref={messagesEndRef} />
             </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 md:p-4">
             <div className="max-w-2xl mx-auto flex flex-col gap-2">
                {(selectedImage || isProcessingImage) && <div className="relative inline-block w-20 h-20 rounded-lg overflow-hidden border border-slate-300 bg-slate-50">{isProcessingImage ? <div className="w-full h-full flex flex-col items-center justify-center text-slate-400"><Loader2 className="animate-spin mb-1" size={20} /><span className="text-[10px]">Processing</span></div> : <img src={selectedImage!} alt="Preview" className="w-full h-full object-cover" />}{!isProcessingImage && <button onClick={() => setSelectedImage(null)} className="absolute top-0 right-0 bg-black/50 text-white p-1 hover:bg-black/70"><X size={12} /></button>}</div>}
                <div className="flex items-end gap-1 md:gap-2">
                  <button onClick={() => setShowReportModal(true)} disabled={isEmergencyAlert || analyzingReport} className={`p-2 md:p-3 rounded-full transition-colors flex-shrink-0 ${isEmergencyAlert ? 'text-slate-300 cursor-not-allowed bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`} title="Upload Report"><ClipboardList size={20} /></button>
                  <button onClick={() => fileInputRef.current?.click()} disabled={isEmergencyAlert} className={`p-2 md:p-3 rounded-full transition-colors flex-shrink-0 ${isEmergencyAlert ? 'text-slate-300 cursor-not-allowed bg-slate-100' : 'text-slate-500 hover:bg-slate-100'}`} title="Upload Image"><ImageIcon size={20} /><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" disabled={isEmergencyAlert} /></button>
                  <div className="flex-1 relative">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}} disabled={isEmergencyAlert} placeholder={isEmergencyAlert ? currentTranslations.emergencyPlaceholder : currentTranslations.placeholder} className={`w-full p-2 pr-10 border rounded-2xl focus:outline-none resize-none max-h-32 text-sm md:text-base transition-colors ${isEmergencyAlert ? 'bg-red-50 border-red-200 text-red-400 cursor-not-allowed placeholder-red-300' : 'bg-slate-50 border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'}`} rows={1} style={{ minHeight: '46px' }} />
                    <button onClick={handleVoiceInput} disabled={isEmergencyAlert} className={`absolute right-2 bottom-2 p-1.5 rounded-full transition-all ${isListening ? 'bg-red-100 text-red-600 animate-pulse ring-4 ring-red-200' : isEmergencyAlert ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-blue-500'}`}><Mic size={18} /></button>
                  </div>
                  <button onClick={handleSendMessage} disabled={(!input.trim() && !selectedImage) || loading || isEmergencyAlert} className={`p-2 md:p-3 rounded-full shadow-md transition-all active:scale-95 flex-shrink-0 ${isEmergencyAlert ? 'bg-slate-300 text-white cursor-not-allowed opacity-70' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'}`}><Send size={20} /></button>
                </div>
                <div className="flex justify-between items-center px-1">
                   <button onClick={() => setShowSettings(true)} className="text-[10px] text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1">{isDemoMode ? <>🔑 Demo Mode: Using rate-limited key. <span className="underline">Use Your Own Key</span></> : <>🔑 Using your API key. <span className="underline">Change Key</span></>}</button>
                   {!report && messages.length > 2 && !isEmergencyAlert && !analyzingReport && (
                      <button onClick={handleGenerateReport} className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors">
                          {currentTranslations.generateReport} <ArrowRight size={12} />
                      </button>
                   )}
                </div>
             </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;