import { LocateFixed, ChevronRight, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StepShell from './StepShell';
import { useI18n } from '@/lib/i18n';
import { LOCATION_ZONES, getLocationLabel } from '@/lib/locations';

function formatGps(gps) {
  if (!gps) return '';
  return `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`;
}

export default function Step2Location({
  zone,
  setZone,
  gps,
  setGps,
  gpsLoading,
  setGpsLoading,
  onBack,
  onNext,
}) {
  const { t, lang } = useI18n();

  const selectedLabel = getLocationLabel(zone, lang);

  const captureGps = () => {
    if (!navigator.geolocation) {
      toast.error(t('gps_failed'));
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success(t('gps_success'));
      },
      (err) => {
        console.error('GPS capture failed:', err);
        setGpsLoading(false);
        toast.error(t('gps_failed'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const currentLocation = zone || (gps ? 'GPS' : '');

  return (
    <StepShell
      n={2} total={5} title={t('where_are_you')}
      bottom={
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="step2-back" variant="outline" onClick={onBack}
            className="h-16 text-lg font-bold rounded-2xl border-2 border-[#0F172A]">{t('back')}</Button>
          <Button data-testid="step2-next" onClick={onNext} disabled={!currentLocation}
            className="h-16 text-xl font-bold rounded-2xl bg-[#D97706] text-white btn-tactile-amber disabled:opacity-50 disabled:shadow-none">
            {t('next')} <ChevronRight className="w-6 h-6 ml-2" strokeWidth={2.5} />
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <button
          data-testid="gps-btn"
          type="button"
          onClick={captureGps}
          disabled={gpsLoading}
          className="w-full rounded-2xl border-2 border-[#0F172A] bg-white px-5 py-4 flex items-center justify-between gap-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="w-12 h-12 rounded-xl bg-[#D97706] text-white flex items-center justify-center">
              <LocateFixed className="w-6 h-6" strokeWidth={2.5} />
            </span>
            <div>
              <div className="font-bold text-[#0F172A]">{t('take_gps')}</div>
              <div className="text-sm text-slate-500">{t('or_pick_zone')}</div>
            </div>
          </div>
          <div className="text-sm font-semibold text-slate-600 text-right">
            {gpsLoading ? t('loading') : gps ? formatGps(gps) : t('gps_set')}
          </div>
        </button>

        {gps && (
          <div className="rounded-2xl border-2 border-emerald-500 bg-emerald-50 px-4 py-3 text-emerald-800 font-semibold" data-testid="gps-preview">
            {t('gps_success')}: {formatGps(gps)}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LOCATION_ZONES.map((item) => {
            const selected = zone === item.id;
            return (
              <button
                key={item.id}
                type="button"
                data-testid={`zone-${item.id}`}
                onClick={() => setZone(item.id)}
                className={`min-h-16 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${selected
                  ? 'bg-[#0F172A] text-white border-[#0F172A]'
                  : 'bg-white text-[#0F172A] border-[#0F172A]/20 hover:border-[#D97706]'
                }`}
              >
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5" />
                  <div>
                    <div className="font-semibold">{item.name_en}</div>
                    <div className={`text-sm ${selected ? 'text-white/80' : 'text-slate-500'}`}>{item.name_hi}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedLabel && (
          <div className="text-sm text-slate-600">
            {t('label_location')}: <strong>{selectedLabel}</strong>
          </div>
        )}
      </div>
    </StepShell>
  );
}