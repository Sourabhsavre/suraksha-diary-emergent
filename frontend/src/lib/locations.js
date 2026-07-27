export const LOCATION_ZONES = [
  { id: 'gate_3', name_en: 'Gate 3', name_hi: 'गेट 3' },
  { id: 'phase_2', name_en: 'Phase 2', name_hi: 'फेस 2' },
  { id: 'pandal', name_en: 'Pandal', name_hi: 'पंडल' },
  { id: 'langar', name_en: 'Langar', name_hi: 'लंगर' },
  { id: 'canteen', name_en: 'Canteen', name_hi: 'कैंटीन' },
  { id: 'kothi', name_en: 'Kothi', name_hi: 'कोठी' },
  { id: 'gate_9', name_en: 'Gate 9', name_hi: 'गेट 9' },
  { id: 'gate_1', name_en: 'Gate 1', name_hi: 'गेट 1' },
  { id: 'admin_block', name_en: 'Admin Block', name_hi: 'एडमिन ब्लॉक' },
  { id: 'fire', name_en: 'Fire', name_hi: 'फायर' },
  { id: 'sanitation', name_en: 'Sanitation', name_hi: 'सफाई' },
  { id: 'electric', name_en: 'Electric', name_hi: 'इलेक्ट्रिक' },
  { id: 'medicine', name_en: 'Medicine', name_hi: 'दवाखाना' },
  { id: 'plumbing', name_en: 'Plumbing', name_hi: 'प्लंबिंग' },
  { id: 'seva_samiti', name_en: 'Seva Samiti', name_hi: 'सेवा समिति' },
  { id: 'saman_ghar', name_en: 'Saman Ghar', name_hi: 'सामान घर' },
  { id: 'others', name_en: 'Others', name_hi: 'अन्य' },
];
export function getLocationLabel(zoneId, lang = 'en') {
  const zone = LOCATION_ZONES.find((item) => item.id === zoneId);
  if (!zone) return zoneId || '';
  return lang === 'en' ? zone.name_en : zone.name_hi;
}
