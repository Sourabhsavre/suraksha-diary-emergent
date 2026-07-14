import { CheckCircle2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepShell from './StepShell';

export default function Step5Success({ queued, onNew, onMyReports }) {
  return (
    <StepShell
      n={4} total={4} title="भेज दिया गया"
      bottom={
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="new-report-btn" onClick={onNew}
            className="h-16 text-xl font-bold rounded-2xl bg-[#0F172A] text-white btn-tactile">नई रिपोर्ट</Button>
          <Button data-testid="my-reports-nav" onClick={onMyReports} variant="outline"
            className="h-16 text-xl font-bold rounded-2xl border-2 border-[#0F172A] text-[#0F172A]">मेरी रिपोर्ट्स</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center py-14 success-check" data-testid="success-screen">
        <div className="w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-500 mb-6">
          <CheckCircle2 className="w-20 h-20 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="font-heading text-4xl text-[#0F172A]">भेज दिया गया ✓</div>
        <p className="mt-3 text-lg text-slate-600 text-center">आपकी रिपोर्ट कार्यालय तक पहुँच गई है।</p>
        {queued > 0 && (
          <div className="mt-6 flex items-center gap-2 text-amber-800 bg-amber-100 border-2 border-amber-400 px-4 py-2 rounded-xl">
            <WifiOff className="w-5 h-5" /> {queued} रिपोर्ट भेजने के लिए तैयार
          </div>
        )}
      </div>
    </StepShell>
  );
}
