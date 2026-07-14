import { ChevronRight, Loader2, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import StepShell from './StepShell';
import { GPS_TIMEOUT_MS } from '@/lib/constants';

const ZONES = [
  { key: 'main-gate', label: 'मुख्य गेट' },
  { key: 'langar', label: 'लंगर हॉल' },
  { key: 'helipad', label: 'हेलीपैड' },
  { key: 'residence', label: 'निवास' },
  { key: 'satsang', label: 'सत्संग स्थल' },
  { key: 'parking', label: 'पार्किंग' },
  { key: 'gate-2', label: 'गेट 2' },
  { key: 'gate-3', label: 'गेट 3' },
];

export default function Step2Location({ zone, setZone, gps, setGps, gpsLoading, setGpsLoading, onBack, onNext }) {
  const getGps = () => {
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
        toast.success('जीपीएस स्थान मिल गया');
      },
      (err) => {
        console.error('GPS lookup failed:', err);
        setGpsLoading(false);
        toast.error('जीपीएस स्थान नहीं मिला — कृपया गेट/ज़ोन चुनें');
      },
      { enableHighAccuracy: true, timeout: GPS_TIMEOUT_MS }
    );
  };

  return (
    <StepShell
      n={2} total={4} title="आप कहाँ हैं?"
      bottom={
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="step2-back" variant="outline" onClick={onBack}
            className="h-16 text-lg font-bold rounded-2xl border-2 border-[#0F172A]">पीछे</Button>
          <Button data-testid="step2-next" disabled={!zone && !gps} onClick={onNext}
            className="h-16 text-xl font-bold rounded-2xl bg-[#D97706] text-white btn-tactile-amber disabled:opacity-50 disabled:shadow-none">
            आगे बढ़ें<ChevronRight className="w-6 h-6 ml-2" strokeWidth={2.5} />
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
        जीपीएस स्थान लें
      </Button>
      {gps && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 text-emerald-800 font-bold" data-testid="gps-set">
          जीपीएस सेट: {gps.lat.toFixed(4)}, {gps.lng.toFixed(4)}
        </div>
      )}
      <div className="text-slate-600 text-base mb-3">या नीचे से गेट/ज़ोन चुनें:</div>
      <div className="grid grid-cols-2 gap-3">
        {ZONES.map((z) => (
          <button
            key={z.key}
            data-testid={`zone-${z.key}`}
            onClick={() => setZone(z.label)}
            className={`h-24 rounded-2xl border-2 text-xl font-bold ${
              zone === z.label
                ? 'bg-[#0F172A] text-white border-[#0F172A]'
                : 'bg-white text-[#0F172A] border-[#0F172A]/30'
            }`}
          >
            {z.label}
          </button>
        ))}
      </div>
    </StepShell>
  );
}
