import { Languages } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export default function LanguageToggle({ variant = 'light', className = '' }) {
  const { lang, setLang } = useI18n();
  const toggle = () => setLang(lang === 'hi' ? 'en' : 'hi');
  const isDark = variant === 'dark';
  return (
    <button
      data-testid="language-toggle"
      onClick={toggle}
      aria-label="Toggle language"
      className={`inline-flex items-center gap-2 h-10 px-3 rounded-full border-2 font-bold text-sm transition-colors ${
        isDark
          ? 'bg-white/10 text-white border-white/30 hover:bg-white/20'
          : 'bg-white text-[#0F172A] border-[#0F172A]/30 hover:bg-[#0F172A]/5'
      } ${className}`}
    >
      <Languages className="w-4 h-4" strokeWidth={2.5} />
      <span data-testid="lang-current">{lang === 'hi' ? 'हिंदी' : 'English'}</span>
      <span className={isDark ? 'text-white/50' : 'text-slate-400'}>/</span>
      <span data-testid="lang-other" className={isDark ? 'text-white/50' : 'text-slate-400'}>
        {lang === 'hi' ? 'English' : 'हिंदी'}
      </span>
    </button>
  );
}
