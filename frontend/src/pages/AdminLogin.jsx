import { Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLogin() {
  const login = () => {
    const redirect = `${window.location.origin}/admin/profile`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };
  return (
    <div className="min-h-[100dvh] flex items-center justify-center relative z-10 px-6">
      <div className="max-w-md w-full bg-white rounded-3xl border-2 border-[#0F172A] p-8 shadow-[0_8px_0_#0F172A]">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0F172A] text-white mx-auto mb-5"><Shield className="w-10 h-10" strokeWidth={2.5} /></div>
        <h1 className="font-heading text-3xl text-center text-[#0F172A]">कार्यालय लॉगिन</h1>
        <p className="text-slate-600 text-center mt-2">Office / Admin dashboard</p>
        <Button data-testid="google-login-btn" onClick={login} className="mt-6 w-full h-14 text-lg font-bold rounded-2xl bg-[#D97706] text-white btn-tactile-amber flex items-center gap-2 justify-center">
          <LogIn className="w-5 h-5" /> Sign in with Google
        </Button>
        <a href="/" className="block text-center mt-4 text-slate-500 underline" data-testid="back-sevadar">← सेवादार डायरी</a>
      </div>
    </div>
  );
}
