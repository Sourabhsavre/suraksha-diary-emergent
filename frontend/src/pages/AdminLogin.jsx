import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, LogIn, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import LanguageToggle from '@/components/LanguageToggle';
import { api } from '@/lib/api';
import { SESSION_STORAGE_KEY, ADMIN_PROFILE_KEY } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';

export default function AdminLogin() {
  const nav = useNavigate();
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const googleLogin = () => {
    const redirect = `${window.location.origin}/admin/profile`;
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirect)}`;
  };

  const emailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/login', { email, password });
      localStorage.setItem(SESSION_STORAGE_KEY, r.data.session_token);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify({
        email: r.data.email, name: r.data.name, picture: r.data.picture,
      }));
      nav('/admin', { replace: true });
    } catch (err) {
      console.error('Email login failed:', err);
      toast.error(err.response?.data?.detail || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] flex items-start justify-center px-6 py-8">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <LanguageToggle variant="dark" />
        </div>
        <div className="bg-white rounded-3xl border-2 border-[#0F172A] p-6 md:p-8 shadow-[0_8px_0_#000]">
          <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[#0F172A] text-white mx-auto mb-5">
            <Shield className="w-10 h-10" strokeWidth={2.5} />
          </div>
          <h1 className="font-heading text-3xl text-center text-[#0F172A]" data-testid="admin-login-title">
            {t('admin_login_title')}
          </h1>

          <Tabs defaultValue="email" className="mt-6">
            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl border-2 border-[#0F172A]/20 bg-slate-50 p-1">
              <TabsTrigger value="email" data-testid="tab-email" className="rounded-lg h-full text-base font-bold data-[state=active]:bg-[#0F172A] data-[state=active]:text-white">
                {t('tab_email')}
              </TabsTrigger>
              <TabsTrigger value="google" data-testid="tab-google" className="rounded-lg h-full text-base font-bold data-[state=active]:bg-[#0F172A] data-[state=active]:text-white">
                {t('tab_google')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email" className="pt-5">
              <form onSubmit={emailLogin} className="space-y-3">
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <Input
                    data-testid="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('email')}
                    className="h-12 pl-10 border-2 border-[#0F172A]/40 rounded-xl"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <Input
                    data-testid="login-password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('password')}
                    className="h-12 pl-10 border-2 border-[#0F172A]/40 rounded-xl"
                  />
                </div>
                <Button
                  data-testid="email-login-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-[#D97706] text-white btn-tactile-amber flex items-center justify-center gap-2"
                >
                  <LogIn className="w-5 h-5" /> {t('sign_in_email')}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="google" className="pt-5">
              <Button
                data-testid="google-login-btn"
                onClick={googleLogin}
                className="w-full h-14 text-lg font-bold rounded-2xl bg-[#0F172A] text-white btn-tactile flex items-center justify-center gap-2"
              >
                <LogIn className="w-5 h-5" /> {t('sign_in_google')}
              </Button>
              <p className="text-xs text-slate-500 text-center mt-3">
                {t('unauthorized_google')}
              </p>
            </TabsContent>
          </Tabs>

          <a href="/" className="block text-center mt-6 text-slate-500 underline" data-testid="back-landing">
            {t('back_sevadar')}
          </a>
        </div>
      </div>
    </div>
  );
}
