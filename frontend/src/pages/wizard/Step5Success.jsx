import { CheckCircle2, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StepShell from './StepShell';
import { useI18n } from '@/lib/i18n';

export default function Step5Success({ queued, onNew, onMyReports }) {
  const { t } = useI18n();
  return (
    <StepShell
      n={5} total={5} title={t('sent_title')}
      bottom={
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="new-report-btn" onClick={onNew}
            className="h-16 text-xl font-bold rounded-2xl bg-[#0F172A] text-white btn-tactile">{t('new_report')}</Button>
          <Button data-testid="my-reports-nav" onClick={onMyReports} variant="outline"
            className="h-16 text-xl font-bold rounded-2xl border-2 border-[#0F172A] text-[#0F172A]">{t('my_reports')}</Button>
        </div>
      }
    >
      <div className="flex flex-col items-center justify-center py-14 success-check" data-testid="success-screen">
        <div className="w-32 h-32 rounded-full bg-emerald-100 flex items-center justify-center border-4 border-emerald-500 mb-6">
          <CheckCircle2 className="w-20 h-20 text-emerald-600" strokeWidth={2.5} />
        </div>
        <div className="font-heading text-4xl text-[#0F172A]">{t('sent_success')}</div>
        <p className="mt-3 text-lg text-slate-600 text-center">{t('sent_reached')}</p>
        {queued > 0 && (
          <div className="mt-6 flex items-center gap-2 text-amber-800 bg-amber-100 border-2 border-amber-400 px-4 py-2 rounded-xl">
            <WifiOff className="w-5 h-5" /> {queued} {t('queued_count')}
          </div>
        )}
      </div>
    </StepShell>
  );
}
