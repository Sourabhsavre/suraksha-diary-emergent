import { ChevronRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import StepShell from './StepShell';
import { getSevadarName } from '@/lib/api';

export default function Step1Identity({ name, setName, onNext, onAdmin }) {
  const remembered = getSevadarName();
  return (
    <StepShell
      n={1} total={4} title="आप कौन हैं?"
      bottom={
        <Button
          data-testid="step1-next"
          disabled={!name.trim()}
          onClick={onNext}
          className="w-full h-16 text-xl font-bold rounded-2xl bg-[#D97706] text-white btn-tactile-amber disabled:opacity-50 disabled:shadow-none"
        >
          आगे बढ़ें <ChevronRight className="w-6 h-6 ml-2" strokeWidth={2.5} />
        </Button>
      }
    >
      <div className="space-y-4">
        <label className="flex items-center gap-2 text-[#0F172A] font-bold text-lg">
          <User className="w-6 h-6" strokeWidth={2.5} /> अपना नाम लिखें
        </label>
        <Input
          data-testid="sevadar-name-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="जैसे: राम सिंह"
          className="h-16 text-2xl px-5 border-2 border-[#0F172A] rounded-2xl bg-white focus-ring"
          autoFocus
        />
        {remembered && (
          <p className="text-slate-600 text-base">
            पिछली बार आपने लिखा था: <strong>{remembered}</strong>
          </p>
        )}
        <div className="pt-4">
          <Button
            data-testid="admin-link"
            variant="ghost"
            className="text-slate-500 underline text-base"
            onClick={onAdmin}
          >
            कार्यालय लॉगिन
          </Button>
        </div>
      </div>
    </StepShell>
  );
}
