import { useRef, useState } from 'react';
import { AlertTriangle, Camera, ChevronRight, Mic, MicOff, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import StepShell from './StepShell';
import { blobToDataUrl, compressImage } from '@/lib/media';

export default function Step3Capture({
  urgent, setUrgent, text, setText, photo, setPhoto, audio, setAudio, onBack, onNext,
}) {
  const [recording, setRecording] = useState(false);
  const recRef = useRef(null);
  const chunksRef = useRef([]);

  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        const dataUrl = await blobToDataUrl(blob);
        setAudio({ dataUrl, mime: mr.mimeType || 'audio/webm' });
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch (err) {
      console.error('Microphone unavailable:', err);
      toast.error('माइक्रोफोन उपलब्ध नहीं है');
    }
  };

  const stopRec = () => { recRef.current?.stop(); setRecording(false); };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      const dataUrl = await compressImage(f);
      setPhoto(dataUrl);
    } catch (err) {
      console.error('Photo compression failed:', err);
      toast.error('फोटो प्रोसेस नहीं हो सकी');
    }
  };

  const nothingCaptured = !audio && !photo && !text.trim();

  return (
    <StepShell
      n={3} total={4} title="क्या हुआ?"
      bottom={
        <div className="grid grid-cols-2 gap-3">
          <Button data-testid="step3-back" variant="outline" onClick={onBack}
            className="h-16 text-lg font-bold rounded-2xl border-2 border-[#0F172A]">पीछे</Button>
          <Button data-testid="step3-next" onClick={onNext} disabled={nothingCaptured}
            className="h-16 text-xl font-bold rounded-2xl bg-[#D97706] text-white btn-tactile-amber disabled:opacity-50 disabled:shadow-none">
            आगे बढ़ें<ChevronRight className="w-6 h-6 ml-2" strokeWidth={2.5} />
          </Button>
        </div>
      }
    >
      <div className={`mb-5 p-4 rounded-2xl border-4 flex items-center justify-between ${urgent ? 'bg-red-100 border-red-500 urgent-row' : 'bg-white border-[#0F172A]/20'}`}>
        <div className="flex items-center gap-3">
          <AlertTriangle className={`w-8 h-8 ${urgent ? 'text-red-700' : 'text-slate-500'}`} strokeWidth={2.5} />
          <div>
            <div className="font-heading text-xl text-[#0F172A]">तुरंत ज़रूरी</div>
            <div className="text-sm text-slate-600">आग, मेडिकल, सुरक्षा खतरा</div>
          </div>
        </div>
        <Switch data-testid="urgent-toggle" checked={urgent} onCheckedChange={setUrgent} className="scale-150" />
      </div>

      <div className="flex flex-col items-center py-6">
        <div className="relative inline-block">
          {recording && <span className="mic-pulse absolute inset-0 rounded-full" />}
          <button
            data-testid="record-voice-button"
            onClick={recording ? stopRec : startRec}
            className={`relative z-10 w-40 h-40 rounded-full ${recording ? 'bg-red-600 btn-tactile-red' : 'bg-[#D97706] btn-tactile-amber'} text-white flex items-center justify-center`}
          >
            {recording ? <MicOff className="w-20 h-20" strokeWidth={2.5} /> : <Mic className="w-20 h-20" strokeWidth={2.5} />}
          </button>
        </div>
        <div className="mt-4 font-heading text-xl text-[#0F172A]">
          {recording ? 'रोकने के लिए दबाएँ' : 'बोलकर बताएँ (हिंदी में)'}
        </div>
        {audio && (
          <div className="mt-4 w-full max-w-md p-3 bg-white rounded-xl border-2 border-emerald-400 flex items-center justify-between" data-testid="audio-preview">
            <audio src={audio.dataUrl} controls className="flex-1" />
            <button onClick={() => setAudio(null)} className="ml-2 p-2 text-red-600" data-testid="audio-remove">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <label data-testid="photo-btn" className="h-20 rounded-2xl bg-white border-2 border-[#0F172A] flex items-center justify-center gap-3 font-bold text-lg cursor-pointer">
          <Camera className="w-7 h-7" strokeWidth={2.5} /> फोटो खींचें
          <input type="file" accept="image/*" capture="environment" className="hidden" onChange={onPhoto} data-testid="photo-input" />
        </label>
        <button
          data-testid="text-toggle"
          onClick={() => document.getElementById('sd-text').focus()}
          className="h-20 rounded-2xl bg-white border-2 border-[#0F172A] flex items-center justify-center gap-3 font-bold text-lg"
        >
          ⌨ लिखकर बताएँ
        </button>
      </div>
      {photo && (
        <div className="relative mb-4" data-testid="photo-preview">
          <img src={photo} alt="preview" className="w-full max-h-64 object-cover rounded-2xl border-2 border-[#0F172A]" />
          <button onClick={() => setPhoto(null)} className="absolute top-2 right-2 bg-white/90 rounded-full p-2" data-testid="photo-remove">
            <Trash2 className="w-5 h-5 text-red-600" />
          </button>
        </div>
      )}
      <Textarea
        id="sd-text" data-testid="text-input"
        value={text} onChange={(e) => setText(e.target.value)}
        placeholder="ऐच्छिक: संक्षेप में लिखें"
        className="min-h-24 text-lg p-4 border-2 border-[#0F172A]/40 rounded-2xl bg-white"
      />
    </StepShell>
  );
}
