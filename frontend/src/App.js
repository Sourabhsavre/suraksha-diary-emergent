import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SevadarWizard from "@/pages/SevadarWizard";
import MyReports from "@/pages/MyReports";
import AdminLogin from "@/pages/AdminLogin";
import AdminCallback from "@/pages/AdminCallback";
import AdminDashboard from "@/pages/AdminDashboard";

function App() {
  return (
    <div className="min-h-screen paper-texture relative">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SevadarWizard />} />
          <Route path="/my-reports" element={<MyReports />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/profile" element={<AdminCallback />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
