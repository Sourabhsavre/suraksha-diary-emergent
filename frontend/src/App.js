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
