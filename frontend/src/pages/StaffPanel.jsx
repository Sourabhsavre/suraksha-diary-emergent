import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { UserPlus, Trash2, X, Mail, Lock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

export default function StaffPanel({ open, onClose }) {
  const { t } = useI18n();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', can_google_login: true });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.get('/auth/staff');
      setStaff(r.data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { if (open) load(); }, [open]);

  const add = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/auth/staff', {
        email: form.email.trim(),
        name: form.name.trim() || null,
        password: form.password || null,
        can_google_login: form.can_google_login,
      });
      toast.success(t('staff_added'));
      setForm({ email: '', name: '', password: '', can_google_login: true });
      load();
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 409) toast.error(t('staff_exists'));
      else toast.error(detail || t('generic_error'));
    } finally { setSubmitting(false); }
  };

  const remove = async (email) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm(t('confirm_remove'))) return;
    try {
      await api.delete(`/auth/staff/${encodeURIComponent(email)}`);
      toast.success(t('staff_removed'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('generic_error'));
    }
  };

  const updateRole = async (email, newRole) => {
    try {
      await api.patch(`/auth/staff/${encodeURIComponent(email)}/role`, { role: newRole });
      toast.success(t('role_updated'));
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('generic_error'));
    }
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div className="bg-white w-full md:max-w-3xl md:rounded-3xl rounded-t-3xl border-2 border-[#0F172A] max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="staff-panel">
        <div className="sticky top-0 bg-[#0F172A] text-white px-5 py-3 flex items-center justify-between rounded-t-3xl">
          <div className="flex items-center gap-2 font-heading text-lg"><Users className="w-5 h-5" /> {t('manage_staff')}</div>
          <button data-testid="staff-close" onClick={onClose} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={add} className="p-5 border-b-2 border-[#0F172A]/10 grid gap-3 md:grid-cols-2">
          <div className="relative md:col-span-1">
            <Mail className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
            <Input data-testid="staff-email" required type="email" placeholder={t('staff_email')}
              value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="h-12 pl-10 border-2" />
          </div>
          <div className="md:col-span-1">
            <Input data-testid="staff-name" placeholder={t('staff_name')}
              value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-12 border-2" />
          </div>
          <div className="relative md:col-span-2">
            <Lock className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
            <Input data-testid="staff-password" type="password" placeholder={t('staff_password_optional')}
              value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="h-12 pl-10 border-2" />
          </div>
          <label className="flex items-center gap-3 md:col-span-1 text-sm font-semibold text-[#0F172A]">
            <Switch data-testid="staff-can-google" checked={form.can_google_login}
              onCheckedChange={(v) => setForm((f) => ({ ...f, can_google_login: v }))} />
            {t('staff_can_google')}
          </label>
          <Button data-testid="staff-add-btn" type="submit" disabled={submitting}
            className="md:col-span-1 h-12 rounded-xl bg-[#D97706] text-white font-bold btn-tactile-amber">
            <UserPlus className="w-4 h-4 mr-1" /> {t('add_staff')}
          </Button>
        </form>

        <div className="p-5">
          {loading && <div className="text-slate-500">{t('loading')}</div>}
          <ul className="divide-y" data-testid="staff-list">
            {staff.map((s) => (
              <li key={s.email} data-testid={`staff-row-${s.email}`} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-bold text-[#0F172A] truncate">{s.name || s.email}</div>
                  <div className="text-sm text-slate-500 truncate">{s.email}</div>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <select
                      data-testid={`staff-role-select-${s.email}`}
                      value={s.role || 'staff'}
                      onChange={(e) => updateRole(s.email, e.target.value)}
                      className="text-xs px-2 py-1 rounded border border-slate-300 bg-white font-semibold text-[#0F172A]"
                    >
                      <option value="staff">Staff</option>
                      <option value="operator">Operator</option>
                      <option value="admin">Admin</option>
                    </select>
                    {s.password_hash === undefined && s.can_google_login && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 border border-blue-300 text-blue-700">Google</span>
                    )}
                  </div>
                </div>
                <Button data-testid={`staff-remove-${s.email}`} onClick={() => remove(s.email)} variant="outline"
                  className="border-2 border-red-300 text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-1" /> {t('remove')}
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
