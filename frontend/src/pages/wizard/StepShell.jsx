import { BookOpen } from 'lucide-react';

export default function StepShell({ n, total, title, children, bottom }) {
  return (
    <div className="min-h-[100dvh] flex flex-col relative z-10">
      <header className="px-6 pt-5 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 font-heading text-[#0F172A]">
          <BookOpen className="w-6 h-6" />
          <span className="text-xl">सुरक्षा डायरी</span>
        </div>
        <div className="text-sm font-bold text-slate-500 tracking-wider">{n}/{total}</div>
      </header>
      <div className="flex-1 px-6 pb-32">
        <h1 className="font-heading text-3xl md:text-4xl leading-snug text-[#0F172A] mt-4 mb-6">{title}</h1>
        {children}
      </div>
      <div className="fixed bottom-0 left-0 right-0 bg-[#FDFBF7]/95 backdrop-blur border-t-2 border-[#E2E8F0] px-6 py-4 z-20">
        {bottom}
      </div>
    </div>
  );
}
