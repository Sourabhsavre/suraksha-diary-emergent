import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LanguageToggle from '@/components/LanguageToggle';
import { api, getOrCreateSevadarDeviceId, getSevadarName } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

function summarize(it, t) {
  if (it.text) return it.text;
  if (it.transcript) return it.transcript;
  if (it.photo_url) return `📷 ${t('label_photo')}`;
  if (it.audio_url) return `🎤 ${t('label_voice')}`;
  return '';
}

export default function MyReports() {
  const nav = useNavigate();
  const { t, lang } = useI18n();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const name = getSevadarName();

  const STATUS = {
    new: { label: t('st_new'), border: 'border-yellow-500', bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
    in_progress: { label: t('st_in_progress'), border: 'border-orange-500', bg: 'bg-orange-100', text: 'text-orange-800', icon: Eye },
    resolved: { label: t('st_resolved'), border: 'border-emerald-500', bg: 'bg-emerald-100', text: 'text-emerald-800', icon: CheckCircle2 },
  };

  useEffect(() => {
    if (!name) { nav('/report'); return; }
    api.get('/incidents/mine', { params: { reporter_name: name, device_id: getOrCreateSevadarDeviceId() } })
      .then((r) => setItems(r.data))
      .catch((err) => console.error('Failed to load my reports:', err))
      .finally(() => setLoading(false));
  }, [name, nav]);

  return (
    <div className="min-h-[100dvh] relative z-10 pb-24 paper-texture">
      <header className="px-6 pt-5 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 font-heading text-[#0F172A]">
          <BookOpen className="w-6 h-6" /><span className="text-xl">{t('my_reports')}</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <Button data-testid="back-home" variant="ghost" onClick={() => nav('/report')} className="text-[#0F172A]">
            <ArrowLeft className="w-5 h-5 mr-1" /> {t('back')}
          </Button>
        </div>
      </header>
      <div className="px-6">
        <p className="text-slate-600 mb-4 text-base">{t('reporter')}: <strong>{name}</strong></p>
        {loading && <div className="text-slate-500">{t('loading')}</div>}
        {!loading && items.length === 0 && (
          <div className="p-6 bg-white rounded-2xl border-2 border-[#0F172A]/20 text-center text-slate-600" data-testid="my-empty">
            {t('no_reports_yet')}
          </div>
        )}
        <ul className="space-y-3" data-testid="my-list">
          {items.map((it) => {
            const s = STATUS[it.status] || STATUS.new;
            const Icon = s.icon;
            const date = new Date(it.created_at);
            return (
              <li key={it.id} data-testid={`my-item-${it.id}`} className={`bg-white border-2 border-l-8 ${s.border} rounded-2xl p-4`}>
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <div className="text-sm text-slate-500 font-bold tracking-wider">{date.toLocaleString(lang === 'en' ? 'en-IN' : 'hi-IN')}</div>
                    <div className="mt-1 text-lg text-[#0F172A] font-semibold">{it.location_label || '—'}</div>
                    <div className="mt-1 text-base text-slate-700">{summarize(it, t)}</div>
                    {it.is_urgent && <div className="inline-block mt-2 px-2 py-0.5 text-xs font-bold text-red-800 bg-red-100 border border-red-400 rounded">{t('urgent')}</div>}
                  </div>
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full border-2 ${s.border} ${s.bg} ${s.text} font-bold text-sm whitespace-nowrap`}>
                    <Icon className="w-4 h-4" strokeWidth={2.5} /> {s.label}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
