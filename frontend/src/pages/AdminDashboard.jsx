import { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Bell, BellRing, LogOut, Search, Filter, MapPin, FileDown, Shield, AlertTriangle, CheckCircle2, Eye, Clock, RefreshCw, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LanguageToggle from '@/components/LanguageToggle';
import StaffPanel from '@/pages/StaffPanel';
import { api, API } from '@/lib/api';
import { POLLING_INTERVAL_MS, SESSION_STORAGE_KEY, ADMIN_PROFILE_KEY } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const b64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export default function AdminDashboard() {
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [admin, setAdmin] = useState(null);
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('all');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [pushOn, setPushOn] = useState(false);
  const [staffOpen, setStaffOpen] = useState(false);
  const lastIdsRef = useRef(new Set());
  const alertRef = useRef(null);
  const silentAudio = 'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBvT18=';

  const STATUS = useMemo(() => ({
    new: { label: t('st_new'), color: 'bg-yellow-100 text-yellow-800 border-yellow-500', icon: Clock },
    in_progress: { label: t('st_in_progress'), color: 'bg-orange-100 text-orange-800 border-orange-500', icon: Eye },
    resolved: { label: t('st_resolved'), color: 'bg-emerald-100 text-emerald-800 border-emerald-500', icon: CheckCircle2 },
  }), [t]);

  useEffect(() => {
    const tok = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!tok) { nav('/admin/login'); return; }
    api.get('/auth/me')
      .then((r) => setAdmin(r.data))
      .catch((err) => {
        console.error('Auth check failed:', err);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        nav('/admin/login');
      });
  }, [nav]);

  const refresh = useCallback(async () => {
    const params = {};
    if (status !== 'all') params.status = status;
    if (urgentOnly) params.urgent_only = true;
    if (q) params.q = q;
    try {
      const r = await api.get('/incidents', { params });
      const currIds = new Set(r.data.map((x) => x.id));
      const newOnes = r.data.filter((x) => !lastIdsRef.current.has(x.id));
      if (lastIdsRef.current.size > 0 && newOnes.length > 0) {
        const anyUrgent = newOnes.some((x) => x.is_urgent);
        try { alertRef.current?.play(); } catch (playErr) { console.error('Alert sound failed:', playErr); }
        toast[anyUrgent ? 'error' : 'info'](`${newOnes.length} ${t('new_reports_toast')}${anyUrgent ? ' — ' + t('urgent') : ''}`);
      }
      lastIdsRef.current = currIds;
      setItems(r.data);
    } catch (err) {
      console.error('Failed to refresh incidents:', err);
    }
  }, [status, urgentOnly, q, t]);

  useEffect(() => {
    if (!admin) return;
    refresh();
    const id = setInterval(refresh, POLLING_INTERVAL_MS);
    return () => clearInterval(id);
  }, [admin, refresh]);

  const enablePush = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) { toast.error(t('push_not_supported')); return; }
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { toast.error(t('notifications_denied')); return; }
      const reg = await navigator.serviceWorker.ready;
      const { data: keyResp } = await api.get('/push/vapid-key');
      const applicationServerKey = urlBase64ToUint8Array(keyResp.public_key);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey });
      const sj = sub.toJSON();
      await api.post('/push/subscribe', { endpoint: sj.endpoint, keys: sj.keys });
      setPushOn(true);
      toast.success(t('notifications_on'));
    } catch (err) {
      console.error('Push setup failed:', err);
      toast.error(t('push_setup_failed'));
    }
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch (err) { console.error('Logout call failed:', err); }
    localStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(ADMIN_PROFILE_KEY);
    nav('/admin/login');
  };

  const download = async (kind) => {
    const tok = localStorage.getItem(SESSION_STORAGE_KEY);
    const r = await fetch(`${API}/export/${kind}`, { headers: { 'X-Session-Token': tok || '' } });
    if (!r.ok) { toast.error(t('export_failed')); return; }
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `suraksha-diary.${kind === 'pdf' ? 'pdf' : 'csv'}`; a.click(); URL.revokeObjectURL(url);
  };

  const stats = useMemo(() => ({
    total: items.length,
    urgent: items.filter((x) => x.is_urgent).length,
    new: items.filter((x) => x.status === 'new').length,
    inProgress: items.filter((x) => x.status === 'in_progress').length,
    resolved: items.filter((x) => x.status === 'resolved').length,
  }), [items]);

  return (
    <div className="min-h-[100dvh] font-dash bg-[#FDFBF7] relative z-10">
      <audio ref={alertRef} src={silentAudio} preload="auto" />
      <header className="bg-[#0F172A] text-white px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Shield className="w-7 h-7 text-[#D97706]" strokeWidth={2.5} />
          <div>
            <div className="font-heading text-xl">{t('admin_title')}</div>
            <div className="text-xs text-slate-300">{t('admin_subtitle')}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <LanguageToggle variant="dark" />
          {admin?.role === 'admin' && (
            <Button data-testid="staff-open-btn" onClick={() => setStaffOpen(true)} variant="outline" className="border-slate-500 text-white bg-transparent hover:bg-white/10"><Users className="w-4 h-4 mr-1" /> {t('manage_staff')}</Button>
          )}
          <Button data-testid="enable-push-btn" onClick={enablePush} variant="outline" className="border-slate-500 text-white bg-transparent hover:bg-white/10">{pushOn ? <BellRing className="w-4 h-4 mr-1" /> : <Bell className="w-4 h-4 mr-1" />} {pushOn ? t('notify_on') : t('notify')}</Button>
          <Button data-testid="export-csv-btn" onClick={() => download('csv')} variant="outline" className="border-slate-500 text-white bg-transparent hover:bg-white/10"><FileDown className="w-4 h-4 mr-1" /> CSV</Button>
          <Button data-testid="export-pdf-btn" onClick={() => download('pdf')} variant="outline" className="border-slate-500 text-white bg-transparent hover:bg-white/10"><FileDown className="w-4 h-4 mr-1" /> PDF</Button>
          {admin && (
            <div className="flex items-center gap-2 pl-3 border-l border-slate-600">
              {admin.picture && <img src={admin.picture} alt="" className="w-8 h-8 rounded-full" />}
              <div className="text-xs">
                <div className="font-bold">{admin.name || admin.email}</div>
                <div className="text-slate-300">{admin.email}</div>
              </div>
              <Button data-testid="logout-btn" onClick={logout} variant="ghost" className="text-white hover:bg-white/10"><LogOut className="w-4 h-4" /></Button>
            </div>
          )}
        </div>
      </header>

      <div className="px-6 py-5">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <Stat label={t('stat_total')} value={stats.total} />
          <Stat label={t('stat_urgent')} value={stats.urgent} accent="text-red-700 border-red-500 bg-red-50" />
          <Stat label={t('stat_new')} value={stats.new} accent="text-yellow-800 border-yellow-500 bg-yellow-50" />
          <Stat label={t('stat_in_progress')} value={stats.inProgress} accent="text-orange-800 border-orange-500 bg-orange-50" />
          <Stat label={t('stat_resolved')} value={stats.resolved} accent="text-emerald-800 border-emerald-500 bg-emerald-50" />
        </div>

        <div className="bg-white border-2 border-[#0F172A]/20 rounded-2xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2"><Filter className="w-4 h-4" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="filter-status" className="w-48 h-11 border-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('filter_all')}</SelectItem>
                <SelectItem value="new">{t('st_new')}</SelectItem>
                <SelectItem value="in_progress">{t('st_in_progress')}</SelectItem>
                <SelectItem value="resolved">{t('st_resolved')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button data-testid="urgent-only-btn" onClick={() => setUrgentOnly((v) => !v)} className={`h-11 ${urgentOnly ? 'bg-red-600 text-white' : 'bg-white text-[#0F172A] border-2 border-[#0F172A]/40'}`}><AlertTriangle className="w-4 h-4 mr-1" /> {t('urgent_only')}</Button>
          <div className="flex-1 min-w-56 relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-500" />
            <Input data-testid="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('search_placeholder')} className="h-11 pl-9 border-2" />
          </div>
          <Button data-testid="refresh-btn" onClick={refresh} variant="outline" className="h-11"><RefreshCw className="w-4 h-4 mr-1" /> {t('refresh')}</Button>
        </div>

        <div className="grid gap-3">
          {items.length === 0 && <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border-2 border-dashed border-[#0F172A]/20" data-testid="dashboard-empty">{t('no_reports_found')}</div>}
          {items.map((it) => {
            const s = STATUS[it.status] || STATUS.new;
            const Icon = s.icon;
            const d = new Date(it.created_at);
            return (
              <button data-testid={`inc-${it.id}`} key={it.id} onClick={() => setSelected(it)} className={`text-left bg-white border-2 rounded-2xl p-4 hover:shadow-lg transition-shadow ${it.is_urgent ? 'border-red-500 urgent-row' : 'border-[#0F172A]/20'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-mono">
                      <MapPin className="w-4 h-4" /> {it.location_label || (it.gps_lat ? `GPS ${it.gps_lat.toFixed(3)}` : '—')}
                      <span className="mx-1">•</span>
                      <span>{d.toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN')}</span>
                      <span className="mx-1">•</span>
                      <span className="font-bold text-[#0F172A]">{it.reporter_name}</span>
                    </div>
                    <div className="mt-1 text-lg text-[#0F172A]">{it.text || it.transcript || <em className="text-slate-500">—</em>}</div>
                    <div className="mt-2 flex gap-2 items-center">
                      {it.photo_url && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300">📷 {t('label_photo')}</span>}
                      {it.audio_url && <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-300">🎤 {t('label_voice')}</span>}
                      {it.is_urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 border border-red-500 text-red-800 font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {t('urgent')}</span>}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 font-bold text-sm ${s.color}`}><Icon className="w-4 h-4" strokeWidth={2.5} /> {s.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {selected && <DetailPanel inc={selected} onClose={() => setSelected(null)} onUpdated={(u) => { setSelected(u); refresh(); }} />}
      <StaffPanel open={staffOpen} onClose={() => setStaffOpen(false)} />
    </div>
  );
}

const Stat = ({ label, value, accent }) => (
  <div className={`rounded-2xl border-2 bg-white p-4 ${accent || 'border-[#0F172A]/20 text-[#0F172A]'}`}>
    <div className="text-xs font-bold uppercase tracking-wider">{label}</div>
    <div className="text-3xl font-bold mt-1">{value}</div>
  </div>
);

function DetailPanel({ inc, onClose, onUpdated }) {
  const { t, lang } = useI18n();
  const [notes, setNotes] = useState(inc.office_notes || '');
  const [status, setStatus] = useState(inc.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.patch(`/incidents/${inc.id}`, { status, office_notes: notes });
      toast.success(t('update_saved'));
      onUpdated(r.data);
    } catch (err) {
      console.error('Update failed:', err);
      toast.error(t('update_failed'));
    } finally { setSaving(false); }
  };
  const mapUrl = inc.gps_lat ? `https://www.openstreetmap.org/?mlat=${inc.gps_lat}&mlon=${inc.gps_lng}#map=17/${inc.gps_lat}/${inc.gps_lng}` : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-6" onClick={onClose}>
      <div className="bg-white w-full md:max-w-2xl md:rounded-3xl rounded-t-3xl border-2 border-[#0F172A] max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} data-testid="detail-panel">
        <div className="sticky top-0 bg-[#0F172A] text-white px-5 py-3 flex items-center justify-between rounded-t-3xl">
          <div className="font-heading text-lg">{t('detail_title')}</div>
          <button data-testid="close-detail" onClick={onClose} className="p-2 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <Field label={t('reporter')} value={inc.reporter_name} />
            <Field label={t('time_label')} value={new Date(inc.created_at).toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN')} />
            <Field label={t('label_location')} value={inc.location_label || '—'} />
            <Field label={t('gps_label')} value={inc.gps_lat ? `${inc.gps_lat.toFixed(4)}, ${inc.gps_lng.toFixed(4)}` : '—'} />
          </div>
          {mapUrl && <a href={mapUrl} target="_blank" rel="noreferrer" className="text-[#D97706] underline text-sm" data-testid="map-link">{t('view_on_map')}</a>}
          {inc.is_urgent && <div className="p-2 bg-red-100 border-2 border-red-500 text-red-800 font-bold rounded-xl flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> {t('urgent')}</div>}
          {inc.photo_url && <img src={inc.photo_url} alt="incident" className="w-full max-h-80 object-cover rounded-2xl border-2 border-[#0F172A]/30" />}
          {inc.audio_url && (
            <div>
              <div className="text-sm font-bold text-slate-600 mb-1">{t('voice_recording')}</div>
              <audio src={inc.audio_url} controls className="w-full" />
            </div>
          )}
          {inc.transcript && (
            <div>
              <div className="text-sm font-bold text-slate-600 mb-1">{t('transcript')}</div>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-200">{inc.transcript}</div>
            </div>
          )}
          {inc.text && (
            <div>
              <div className="text-sm font-bold text-slate-600 mb-1">{t('label_details')}</div>
              <div className="p-3 bg-slate-50 rounded-xl border-2 border-slate-200">{inc.text}</div>
            </div>
          )}
          <div>
            <div className="text-sm font-bold text-slate-600 mb-1">{t('change_status')}</div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger data-testid="status-select" className="h-11 border-2"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="new">{t('st_new')}</SelectItem>
                <SelectItem value="in_progress">{t('st_in_progress')}</SelectItem>
                <SelectItem value="resolved">{t('st_resolved')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-sm font-bold text-slate-600 mb-1">{t('office_notes')}</div>
            <Textarea data-testid="office-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-24 border-2" placeholder={t('notes_placeholder')} />
          </div>
          <Button data-testid="save-update-btn" onClick={save} disabled={saving} className="w-full h-12 bg-[#D97706] text-white font-bold btn-tactile-amber rounded-2xl">{saving ? t('saving') : t('save_update')}</Button>
        </div>
      </div>
    </div>
  );
}

const Field = ({ label, value }) => (
  <div className="p-2 bg-slate-50 rounded-xl border border-slate-200">
    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider">{label}</div>
    <div className="text-sm text-[#0F172A] font-semibold mt-0.5 break-words">{value}</div>
  </div>
);
