import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { SESSION_STORAGE_KEY, ADMIN_PROFILE_KEY } from '@/lib/constants';

export default function AdminCallback() {
  const nav = useNavigate();
  const [err, setErr] = useState('');

  useEffect(() => {
    const hash = window.location.hash || '';
    const params = new URLSearchParams(hash.replace(/^#/, ''));
    const sid = params.get('session_id');
    if (!sid) { setErr('Missing session_id'); return; }
    api.post('/auth/session', { session_id: sid })
      .then((r) => {
        localStorage.setItem(SESSION_STORAGE_KEY, r.data.session_token);
        localStorage.setItem(ADMIN_PROFILE_KEY, JSON.stringify({
          email: r.data.email, name: r.data.name, picture: r.data.picture,
        }));
        nav('/admin', { replace: true });
      })
      .catch((e) => {
        console.error('Session exchange failed:', e);
        setErr(e.response?.data?.detail || 'Login failed');
      });
  }, [nav]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl border-2 border-[#0F172A] p-6">
        {err ? (
          <>
            <div className="text-red-600 font-bold" data-testid="callback-error">{err}</div>
            <a href="/admin/login" className="underline mt-3 inline-block">वापस लॉगिन पर जाएँ</a>
          </>
        ) : (
          <div data-testid="callback-loading">Signing you in…</div>
        )}
      </div>
    </div>
  );
}
