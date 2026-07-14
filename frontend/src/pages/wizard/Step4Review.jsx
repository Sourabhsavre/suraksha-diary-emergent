import { AlertTriangle, Loader2, Send, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepShell from './StepShell';

const Row = ({ label, value }) => (
  <div className="flex justify-between items-center bg-white border-2 border-[#0F172A]/20 rounded-xl px-4 py-3">
    <span className="text-slate-500 font-bold uppercase text-sm tracking-wider">{label}</span>
    <span className="text-lg text-[#0F172A] font-semibold">{value}</span>
  </div>
);

export default function Step4Review({ name, zone, gps, urgent, audio, photo, text, online, sending, onBack, onSubmit }) {
  const locationText =
    zone || (gps ? `जीपीएस ${gps.lat.toFixed(3)}, ${gps.lng.toFixed(3)}` : '—');

  return (
    <StepShell
      n={4} total={4} title="भेजने से पहले देख लें"
      bottom={
        <div className="space-y-2">
          {!online && (
            <div className="flex items-center gap-2 text-amber-800 bg-amber-100 border-2 border-amber-400 px-3 py-2 rounded-xl text-sm">
              <WifiOff className="w-4 h-4" /> ऑफलाइन — रिपोर्ट सेव होगी और नेट आते ही भेजी जाएगी
            </div>
          )}
          <div className="grid grid-cols-4 gap-3">
            <Button data-testid="step4-back" variant="outline" onClick={onBack}
              className="col-span-1 h-16 text-lg font-bold rounded-2xl border-2 border-[#0F172A]">पीछे</Button>
            <Button data-testid="send-btn" disabled={sending} onClick={onSubmit}
              className="col-span-3 h-16 text-2xl font-heading rounded-2xl bg-[#D97706] text-white btn-tactile-amber disabled:opacity-70">
              {sending
                ? <Loader2 className="w-7 h-7 mr-2 animate-spin" />
                : <Send className="w-7 h-7 mr-2" strokeWidth={2.5} />}
              भेजें
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        <Row label="नाम" value={name} />
        <Row label="स्थान" value={locationText} />
        {urgent && (
          <div className="p-3 rounded-xl bg-red-100 border-2 border-red-500 text-red-800 font-bold flex items-center gap-2" data-testid="urgent-badge">
            <AlertTriangle className="w-5 h-5" /> तुरंत ज़रूरी
          </div>
        )}
        {audio && (
          <div>
            <div className="text-sm font-bold text-slate-600 mb-1">आवाज़</div>
            <audio src={audio.dataUrl} controls className="w-full" />
          </div>
        )}
        {photo && (
          <div>
            <div className="text-sm font-bold text-slate-600 mb-1">फोटो</div>
            <img src={photo} alt="review" className="w-full max-h-56 object-cover rounded-xl border-2 border-[#0F172A]/30" />
          </div>
        )}
        {text && (
          <div>
            <div className="text-sm font-bold text-slate-600 mb-1">विवरण</div>
            <div className="p-3 bg-white border-2 border-[#0F172A]/30 rounded-xl">{text}</div>
          </div>
        )}
      </div>
    </StepShell>
  );
}
