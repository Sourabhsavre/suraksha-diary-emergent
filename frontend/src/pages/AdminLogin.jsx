import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Shield, LogIn, Mail, Lock, User, UserPlus } from 'lucide-react';
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
  const [tab, setTab] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const googleAuthBase = process.env.REACT_APP_GOOGLE_AUTH_URL || 'https://auth.emergentagent.com/';

  const googleLogin = () => {
    if (!googleAuthBase) {
      toast.error(t('google_login_unavailable'));
      return;
    }
    const redirect = `${window.location.origin}/admin/profile`;
    window.location.href = `${googleAuthBase}?redirect=${encodeURIComponent(redirect)}`;
  };

  const emailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await api.post('/auth/login', { email, password });
      localStorage.setItem(SESSION_STORAGE_KEY, r.data.session_token);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify({
        email: r.data.email, name: r.data.name, picture: r.data.picture, role: r.data.role,
      }));
      nav('/admin', { replace: true });
    } catch (err) {
      console.error('Email login failed:', err);
      toast.error(err.response?.data?.detail || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const trimmedName = regName.trim();
    const trimmedEmail = regEmail.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !regPassword) {
      toast.error(t('fill_all_fields'));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error(t('invalid_email'));
      return;
    }

    if (regPassword.length < 6) {
      toast.error(t('password_min_len'));
      return;
    }

    setLoading(true);
    try {
      const r = await api.post('/auth/register', {
        name: trimmedName,
        email: trimmedEmail,
        password: regPassword,
      });

      localStorage.setItem(SESSION_STORAGE_KEY, r.data.session_token);
      localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify({
        email: r.data.email, name: r.data.name, picture: r.data.picture, role: r.data.role || 'staff',
      }));
      toast.success(t('reg_success'));
      nav('/admin', { replace: true });
    } catch (err) {
      console.error('Registration failed:', err);
      toast.error(err.response?.data?.detail || t('generic_error'));
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
            {tab === 'register' ? t('register_title') : t('admin_login_title')}
          </h1>

          <Tabs value={tab} onValueChange={setTab} className="mt-6">
            <TabsList className="grid w-full grid-cols-3 h-12 rounded-xl border-2 border-[#0F172A]/20 bg-slate-50 p-1">
              <TabsTrigger value="email" data-testid="tab-email" className="rounded-lg h-full text-xs md:text-sm font-bold data-[state=active]:bg-[#0F172A] data-[state=active]:text-white truncate">
                {t('tab_email')}
              </TabsTrigger>
              <TabsTrigger value="register" data-testid="tab-register" className="rounded-lg h-full text-xs md:text-sm font-bold data-[state=active]:bg-[#0F172A] data-[state=active]:text-white truncate">
                {t('tab_register')}
              </TabsTrigger>
              <TabsTrigger value="google" data-testid="tab-google" className="rounded-lg h-full text-xs md:text-sm font-bold data-[state=active]:bg-[#0F172A] data-[state=active]:text-white truncate">
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

              <button
                type="button"
                data-testid="register-toggle-btn"
                onClick={() => setTab('register')}
                className="w-full text-center mt-4 text-sm font-semibold text-[#D97706] hover:underline"
              >
                {t('create_account_link')}
              </button>
            </TabsContent>

            <TabsContent value="register" className="pt-5">
              <form onSubmit={handleRegister} className="space-y-3">
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <Input
                    data-testid="register-name"
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={t('full_name')}
                    className="h-12 pl-10 border-2 border-[#0F172A]/40 rounded-xl"
                  />
                </div>
                <div className="relative">
                  <Mail className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <Input
                    data-testid="register-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder={t('email')}
                    className="h-12 pl-10 border-2 border-[#0F172A]/40 rounded-xl"
                  />
                </div>
                <div className="relative">
                  <Lock className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                  <Input
                    data-testid="register-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder={t('password')}
                    className="h-12 pl-10 border-2 border-[#0F172A]/40 rounded-xl"
                  />
                </div>
                <p className="text-xs text-slate-500 pl-1">
                  * {t('password_min_len')}
                </p>
                <Button
                  data-testid="register-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-[#0F172A] text-white btn-tactile flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5" /> {t('register_btn')}
                </Button>
              </form>

              <button
                type="button"
                data-testid="login-toggle-btn"
                onClick={() => setTab('email')}
                className="w-full text-center mt-4 text-sm font-semibold text-slate-600 hover:underline"
              >
                {t('already_account')}
              </button>
            </TabsContent>

            <TabsContent value="google" className="pt-5">
              <Button
                data-testid="google-login-btn"
                onClick={googleLogin}
                type="button"
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
