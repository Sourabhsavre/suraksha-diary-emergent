export const LOCATION_ZONES = [
  {
    "id": "gate_3",
    "name_en": "Gate 3",
    "name_hi": "गेट 3"
  },
  {
    "id": "phase_2",
    "name_en": "Phase 2",
    "name_hi": "फेस 2"
  },
  {
    "id": "pandal",
    "name_en": "Pandal",
    "name_hi": "पंडाल"
  },
  {
    "id": "langar",
    "name_en": "Langar",
    "name_hi": "लंगर"
  },
  {
    "id": "canteen",
    "name_en": "Canteen",
    "name_hi": "कैंटीन"
  },
  {
    "id": "kothi",
    "name_en": "Kothi",
    "name_hi": "कोठी"
  },
  {
    "id": "gate_9",
    "name_en": "Gate 9",
    "name_hi": "गेट 9"
  },
  {
    "id": "gate_1",
    "name_en": "Gate 1",
    "name_hi": "गेट 1"
  },
  {
    "id": "admin_block",
    "name_en": "Admin Block",
    "name_hi": "एडमिन ब्लॉक"
  },
  {
    "id": "others",
    "name_en": "Others",
    "name_hi": "अन्य"
  },
  {
    "id": "main_gate",
    "name_en": "Main Gate",
    "name_hi": "मुख्य गेट"
  },
  {
    "id": "langar_hall",
    "name_en": "Langar Hall",
    "name_hi": "लंगर हॉल"
  },
  {
    "id": "helipad",
    "name_en": "Helipad",
    "name_hi": "हेलीपैड"
  },
  {
    "id": "residence",
    "name_en": "Residence",
    "name_hi": "निवास"
  },
  {
    "id": "satsang_ground",
    "name_en": "Satsang Ground",
    "name_hi": "सत्संग स्थल"
  },
  {
    "id": "parking",
    "name_en": "Parking",
    "name_hi": "पार्किंग"
  },
  {
    "id": "gate_2",
    "name_en": "Gate 2",
    "name_hi": "गेट 2"
  },
  {
    "id": "gate_3_old",
    "name_en": "Gate 3 Old",
    "name_hi": "गेट 3 (पुराना)"
  }
];


const ALL_LOCATIONS = [
  // Sir New Zones (10)
  { id: "gate_3", name_en: "Gate 3", name_hi: "गेट 3" },
  { id: "phase_2", name_en: "Phase 2", name_hi: "फेस 2" },
  { id: "pandal", name_en: "Pandal", name_hi: "पंडाल" },
  { id: "langar", name_en: "Langar", name_hi: "लंगर" },
  { id: "canteen", name_en: "Canteen", name_hi: "कैंटीन" },
  { id: "kothi", name_en: "Kothi", name_hi: "कोठी" },
  { id: "gate_9", name_en: "Gate 9", name_hi: "गेट 9" },
  { id: "gate_1", name_en: "Gate 1", name_hi: "गेट 1" },
  { id: "admin_block", name_en: "Admin Block", name_hi: "एडमिन ब्लॉक" },
  { id: "others", name_en: "Others", name_hi: "अन्य" },
  // Old Zones (8)
  { id: "main_gate", name_en: "Main Gate", name_hi: "मुख्य गेट" },
  { id: "langar_hall", name_en: "Langar Hall", name_hi: "लंगर हॉल" },
  { id: "helipad", name_en: "Helipad", name_hi: "हेलीपैड" },
  { id: "residence", name_en: "Residence", name_hi: "निवास" },
  { id: "satsang_ground", name_en: "Satsang Ground", name_hi: "सत्संग स्थल" },
  { id: "parking", name_en: "Parking", name_hi: "पार्किंग" },
  { id: "gate_2", name_en: "Gate 2", name_hi: "गेट 2" },
  { id: "gate_3_old", name_en: "Gate 3 Old", name_hi: "गेट 3 (पुराना)" }
];


import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { I18nProvider } from "@/lib/i18n";
import Landing from "@/pages/Landing";
import SevadarWizard from "@/pages/SevadarWizard";
import MyReports from "@/pages/MyReports";
import AdminLogin from "@/pages/AdminLogin";
import AdminCallback from "@/pages/AdminCallback";
import AdminDashboard from "@/pages/AdminDashboard";

function App() {
  return (
    <I18nProvider>
      <div className="min-h-screen relative">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/report" element={<SevadarWizard />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/profile" element={<AdminCallback />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="top-center" richColors closeButton />
      </div>
    </I18nProvider>
  );
}

export default App;
