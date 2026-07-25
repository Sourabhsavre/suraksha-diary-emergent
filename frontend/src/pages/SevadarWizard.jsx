import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { api, getOrCreateSevadarDeviceId, getSevadarName, setSevadarName } from '@/lib/api';
import { queueReport } from '@/lib/offlineQueue';
import Step1Identity from '@/pages/wizard/Step1Identity';
import Step2Location from '@/pages/wizard/Step2Location';
import Step3Capture from '@/pages/wizard/Step3Capture';
import Step4Review from '@/pages/wizard/Step4Review';
import Step5Success from '@/pages/wizard/Step5Success';
import useOfflineQueue from '@/pages/wizard/useOfflineQueue';
import { useI18n } from '@/lib/i18n';
import { getLocationLabel } from '@/lib/locations';

function buildPayload({ name, zone, gps, text, urgent, photo, audio, lang }) {
  return {
    reporter_name: name.trim(),
    device_id: getOrCreateSevadarDeviceId(),
    location_label: zone ? getLocationLabel(zone, lang) : (gps ? 'GPS' : null),
    gps_lat: gps?.lat,
    gps_lng: gps?.lng,
    text: text || null,
    is_urgent: urgent,
    photo_base64: photo || null,
    audio_base64: audio?.dataUrl || null,
    audio_mime: audio?.mime || null,
  };
}

function playChime() {
  try {
    const a = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQBvT18=');
    a.play().catch(() => { /* autoplay may be blocked */ });
  } catch (err) {
    console.error('Chime failed:', err);
  }
}

export default function SevadarWizard() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [step, setStep] = useState(1);
  const [name, setName] = useState(getSevadarName());
  const [zone, setZone] = useState('');
  const [gps, setGps] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [urgent, setUrgent] = useState(false);
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [audio, setAudio] = useState(null);
  const [sending, setSending] = useState(false);

  const handleFlush = useCallback(({ sent }) => {
    if (sent > 0) toast.success(`${sent} ${t('x_sent')}`);
  }, [t]);
  const { online, queued, setQueued, refreshQueued } = useOfflineQueue(handleFlush);

  const next = () => setStep((s) => Math.min(5, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  const resetWizard = () => {
    setZone('');
    setGps(null);
    setGpsLoading(false);
    setUrgent(false);
    setText('');
    setPhoto(null);
    setAudio(null);
    setSending(false);
  };
  const resetMedia = () => { setPhoto(null); setAudio(null); setText(''); setUrgent(false); };

  const submit = async () => {
    if (!name.trim()) { setStep(1); toast.error(t('please_write_name')); return; }
    setSending(true);
    setSevadarName(name.trim());
    const payload = buildPayload({ name, zone, gps, text, urgent, photo, audio, lang });
    try {
      if (!navigator.onLine) throw new Error('offline');
      await api.post('/incidents', payload);
      setStep(5);
      playChime();
      resetMedia();
    } catch (err) {
      console.error('Send failed, queuing offline:', err);
      await queueReport(payload);
      setQueued((q) => q + 1);
      refreshQueued();
      setStep(5);
      toast.info(t('network_missing'));
    } finally {
      setSending(false);
    }
  };

  if (step === 5) {
    return <Step5Success queued={queued} onNew={() => { resetWizard(); setStep(1); }} onMyReports={() => navigate('/my-reports')} />;
  }
  if (step === 1) {
    return <Step1Identity name={name} setName={setName} onNext={next} onAdmin={() => navigate('/admin/login')} />;
  }
  if (step === 2) {
    return (
      <Step2Location
        zone={zone} setZone={setZone}
        gps={gps} setGps={setGps}
        gpsLoading={gpsLoading} setGpsLoading={setGpsLoading}
        onBack={back} onNext={next}
      />
    );
  }
  if (step === 3) {
    return (
      <Step3Capture
        urgent={urgent} setUrgent={setUrgent}
        text={text} setText={setText}
        photo={photo} setPhoto={setPhoto}
        audio={audio} setAudio={setAudio}
        onBack={back} onNext={next}
      />
    );
  }
  return (
    <Step4Review
      name={name} zone={zone} gps={gps}
      urgent={urgent} audio={audio} photo={photo} text={text}
      online={online} sending={sending}
      onBack={back} onSubmit={submit}
    />
  );
}
