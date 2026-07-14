import { useNavigate } from 'react-router-dom';
import { Shield, BookOpen, User, Monitor, ChevronRight, Wifi, Lock } from 'lucide-react';
import LanguageToggle from '@/components/LanguageToggle';
import { useI18n } from '@/lib/i18n';

export default function Landing() {
  const nav = useNavigate();
  const { t } = useI18n();

  return (
    <div className="min-h-[100dvh] bg-[#0F172A] text-white relative overflow-hidden">
      {/* Ambient amber accent glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#D97706] rounded-full blur-[140px] opacity-20 pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-[#D97706] rounded-full blur-[140px] opacity-10 pointer-events-none" />

      <header className="relative z-10 px-6 pt-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#D97706] flex items-center justify-center">
            <Shield className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading text-2xl" data-testid="landing-app-name">{t('app_name')}</span>
        </div>
        <LanguageToggle variant="dark" />
      </header>

      <main className="relative z-10 px-6 py-10 md:py-14 max-w-2xl mx-auto">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#D97706]/50 bg-[#D97706]/10 text-[#F59E0B] text-xs font-bold tracking-wider uppercase mb-6">
            <BookOpen className="w-3.5 h-3.5" /> RSSB Security
          </div>
          <h1 className="font-heading text-4xl md:text-6xl leading-tight" data-testid="landing-title">
            {t('app_name')}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-slate-300 max-w-lg mx-auto" data-testid="landing-tagline">
            {t('app_tagline')}
          </p>
        </div>

        <div className="mt-10 grid gap-4">
          <button
            data-testid="landing-sevadar-cta"
            onClick={() => nav('/report')}
            className="group text-left bg-[#D97706] hover:bg-[#B45309] rounded-3xl p-6 flex items-center gap-5 btn-tactile-amber transition-colors"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <User className="w-9 h-9 text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="font-heading text-2xl text-white">{t('landing_sevadar_title')}</div>
              <div className="text-white/85 text-base mt-0.5">{t('landing_sevadar_sub')}</div>
            </div>
            <ChevronRight className="w-7 h-7 text-white group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </button>

          <button
            data-testid="landing-office-cta"
            onClick={() => nav('/admin/login')}
            className="group text-left bg-white/5 hover:bg-white/10 backdrop-blur border-2 border-white/20 rounded-3xl p-6 flex items-center gap-5 transition-colors"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <Monitor className="w-9 h-9 text-[#F59E0B]" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="font-heading text-2xl text-white">{t('landing_office_title')}</div>
              <div className="text-white/70 text-base mt-0.5">{t('landing_office_sub')}</div>
            </div>
            <ChevronRight className="w-7 h-7 text-white/70 group-hover:translate-x-1 transition-transform" strokeWidth={2.5} />
          </button>
        </div>

        <ul className="mt-10 grid gap-3 text-slate-300">
          <TrustLine icon={<Shield className="w-4 h-4" />} text={t('trust_1')} />
          <TrustLine icon={<Wifi className="w-4 h-4" />} text={t('trust_2')} />
          <TrustLine icon={<Lock className="w-4 h-4" />} text={t('trust_3')} />
        </ul>
      </main>
    </div>
  );
}

const TrustLine = ({ icon, text }) => (
  <li className="flex items-start gap-3 text-base">
    <span className="mt-0.5 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[#F59E0B] flex-shrink-0">{icon}</span>
    <span>{text}</span>
  </li>
);
