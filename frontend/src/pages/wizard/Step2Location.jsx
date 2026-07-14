import { ChevronRight, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StepShell from './StepShell';
import { GPS_TIMEOUT_MS } from '@/lib/constants';
import { useI18n } from '@/lib/i18n';

// Zone keys stay stable; label is looked up from i18n so it translates.
const ZONES = [
  { key: 'main-gate', hi: 'मुख्य गेट', en: 'Main Gate' },
  { key: 'langar', hi: 'लंगर हॉल', en: 'Langar Hall' },
  { key: 'helipad', hi: 'हेलीपैड', en: 'Helipad' },
  { key: 'residence', hi: 'निवास', en: 'Residence' },
  { key: 'satsang', hi: 'सत्संग स्थल', en: 'Satsang Ground' },
  { key: 'parking', hi: 'पार्किंग', en: 'Parking' },
  { key: 'gate-2', hi: 'गेट 2', en: 'Gate 2' },
  { key: 'gate-3', hi: 'गेट 3', en: 'Gate 3' },
];

export default function Step2Location({ zone, setZone, gps, setGps, gpsLoading, setGpsLoading, onBack, onNext }) {
  const { t, lang } = useI18n();

  const getGps = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success(t('gps_success'));
      },
      (err) => {
        console.error('GPS lookup failed:', err);
        setGpsLoading(false);
        toast.error(t('gps_failed'));
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS }
    );
  };

  return (
    <StepShell
      n={2} total={4} title={t('where_are_you')}
      bottom={
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="step2-back" variant="outline" onClick={onBack}
            className="h-16 text-lg font-bold rounded-2xl border-2 border-[#0F172A]">{t('back')}</Button>
          <Button data-testid="step2-next" disabled={!zone && !gps} onClick={onNext}
            className="h-16 text-xl font-bold rounded-2xl bg-[#D97706] text-white btn-tactile-amber disabled:opacity-50 disabled:shadow-none">
            {t('next')}<ChevronRight className="w-6 h-6 ml-2" strokeWidth={2.5} />
          </Button>
        </div>
      }
    >
      <Button
        data-testid="get-gps-btn"
        onClick={getGps}
        disabled={gpsLoading}
        className="w-full h-20 rounded-2xl bg-[#0F172A] text-white text-xl font-bold btn-tactile mb-4 flex items-center justify-center gap-3"
      >
        {gpsLoading
          ? <Loader2 className="w-7 h-7 animate-spin" />
          : <MapPin className="w-7 h-7" strokeWidth={2.5} />}
        {t('take_gps')}
      </Button>
      {gps && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-800 font-bold" data-testid="gps-set">
          {t('gps_set')}: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
        </div>
      )}
      <div className="text-slate-600 text-base mb-3">{t('or_pick_zone')}</div>
      <div className="grid grid-cols-2 gap-3">
        {ZONES.map((z) => {
          const label = lang === 'en' ? z.en : z.hi;
          const active = zone === label;
          return (
            <button
              key={z.key}
              data-testid={`zone-${z.key}`}
              onClick={() => setZone(label)}
              className={`h-24 rounded-2xl border-2 text-xl font-bold ${
                active
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'bg-white text-[#0F172A] border-[#0F172A]/30'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </StepShell>
  );
}
