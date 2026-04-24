'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, ArrowLeft, Camera, MapPin, Clock, ChevronRight,
         CheckCircle, AlertCircle, XCircle, Home, ScanLine,
         History, Share2, RotateCcw, Wifi, Battery, MessageCircle, Send } from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────── */
type Screen = 'home' | 'upload' | 'scanning' | 'result' | 'clinics' | 'history' | 'chat';
type ScanType = 'oral' | 'skin';
type Lang = 'en' | 'hi' | 'ta' | 'te';
type RiskLevel = 'HIGH_RISK' | 'LOW_RISK' | 'INVALID';

interface AnalysisResult {
  risk_level: RiskLevel;
  confidence: number;
  explanation: { en: string; hi?: string; ta?: string; te?: string };
  disclaimer?: string;
}

interface ChatMsg { role: 'user' | 'assistant'; content: string; }

/* ─── Translations ────────────────────────────────────────────────── */
const DEMO_T = {
  en: {
    greeting: 'Good morning 👋',
    tagline: 'Check your health\nin seconds',
    scans_done: 'Scans done',
    accuracy: 'Accuracy',
    start_scan: 'START A SCAN',
    oral_title: 'Oral Cancer',
    oral_desc: 'Photo of mouth / tongue',
    skin_title: 'Skin Lesion',
    skin_desc: 'Photo of skin patch / mole',
    health_tip: 'Health Tip',
    tip_body: 'Regular self-examination every 3–6 months helps detect oral cancer up to 5 years earlier. Early detection increases survival rates by over 80%.',
    upload_oral: '🦷 Oral Scan',
    upload_skin: '🔬 Skin Scan',
    tap_upload: 'Tap to upload photo',
    file_hint: 'JPG, PNG up to 10MB',
    result_lang: 'RESULT LANGUAGE',
    analyze_btn: 'Analyze with AI',
    tips_oral: 'Open mouth wide, use good lighting, focus on the area of concern.',
    tips_skin: 'Ensure good lighting, capture the full lesion with 2–5cm margin.',
    tips_oral_title: 'Photo tips for oral scan',
    tips_skin_title: 'Photo tips for skin scan',
    analyzing: 'Analyzing your scan',
    wait: 'Please wait a moment...',
    step_prep: 'Preparing',
    step_ai: 'On-device AI',
    step_gemini: 'Gemini Vision',
    step_done: 'Done',
    oral_screen: 'Oral Cancer Screening',
    skin_screen: 'Skin Lesion Analysis',
    ai_conf: 'AI Confidence',
    analysis: 'Analysis',
    high_risk: 'HIGH RISK',
    low_risk: 'LOW RISK',
    invalid: 'INVALID',
    find_clinics: 'Find Nearby Clinics',
    new_scan: 'New Scan',
    share: 'Share',
    disclaimer: 'AI-assisted screening only. Consult a doctor for diagnosis.',
    failed_title: 'Analysis failed',
    failed_body: 'Backend not reachable. Make sure the server is running at localhost:8000.',
    retry: 'Try Again',
    nearby_title: 'Nearby Clinics',
    nearby_sub: 'Cancer screening centres near you',
    map_unavail: 'Map unavailable (no API key)',
    history_title: 'Scan History',
    history_scans: (n: number) => `${n} scans recorded`,
    history_end: '— End of history —',
    chat_title: 'Health Assistant',
    chat_sub: 'Ask about cancer, symptoms, results',
    chat_placeholder: 'Ask about symptoms or results…',
    chat_send: 'Send',
    chat_typing: 'AI is typing…',
    chat_welcome: 'Hello! I\'m JanArogya\'s health assistant. Ask me anything about cancer screening, symptoms, or what your result means. 🌿',
    chat_error: 'Sorry, I couldn\'t respond. Please try again.',
    nav_home: 'Home',
    nav_scan: 'Scan',
    nav_clinics: 'Clinics',
    nav_history: 'History',
    nav_chat: 'Chat',
  },
  hi: {
    greeting: 'सुप्रभात 👋',
    tagline: 'सेकंड में अपना\nस्वास्थ्य जांचें',
    scans_done: 'जांचें हुई',
    accuracy: 'सटीकता',
    start_scan: 'जांच शुरू करें',
    oral_title: 'मुँह का कैंसर',
    oral_desc: 'मुँह / जीभ की फ़ोटो',
    skin_title: 'त्वचा का घाव',
    skin_desc: 'त्वचा पैच / तिल की फ़ोटो',
    health_tip: 'स्वास्थ्य सुझाव',
    tip_body: 'हर 3-6 महीने में स्व-परीक्षण मुँह के कैंसर को 5 साल पहले पकड़ने में मदद करता है। जल्दी पता लगाने से जीवित रहने की दर 80% बढ़ जाती है।',
    upload_oral: '🦷 मुँह की जांच',
    upload_skin: '🔬 त्वचा की जांच',
    tap_upload: 'फ़ोटो अपलोड करें',
    file_hint: 'JPG, PNG 10MB तक',
    result_lang: 'परिणाम भाषा',
    analyze_btn: 'AI से विश्लेषण करें',
    tips_oral: 'मुँह चौड़ा खोलें, अच्छी रोशनी रखें, संबंधित क्षेत्र पर ध्यान दें।',
    tips_skin: 'अच्छी रोशनी सुनिश्चित करें, पूरे घाव को 2-5 सेमी मार्जिन के साथ कैप्चर करें।',
    tips_oral_title: 'मुँह की जांच के लिए फ़ोटो सुझाव',
    tips_skin_title: 'त्वचा की जांच के लिए फ़ोटो सुझाव',
    analyzing: 'आपकी जांच का विश्लेषण हो रहा है',
    wait: 'कृपया एक पल प्रतीक्षा करें...',
    step_prep: 'तैयार हो रहा है',
    step_ai: 'डिवाइस AI',
    step_gemini: 'Gemini दृष्टि',
    step_done: 'पूर्ण',
    oral_screen: 'मुँह के कैंसर की जांच',
    skin_screen: 'त्वचा के घाव का विश्लेषण',
    ai_conf: 'AI विश्वास',
    analysis: 'विश्लेषण',
    high_risk: 'उच्च जोखिम',
    low_risk: 'कम जोखिम',
    invalid: 'अमान्य',
    find_clinics: 'नजदीकी क्लीनिक खोजें',
    new_scan: 'नई जांच',
    share: 'शेयर',
    disclaimer: 'केवल AI-सहायता जांच। निदान के लिए डॉक्टर से मिलें।',
    failed_title: 'विश्लेषण विफल',
    failed_body: 'बैकएंड नहीं मिला। सुनिश्चित करें कि सर्वर localhost:8000 पर चल रहा है।',
    retry: 'पुनः प्रयास करें',
    nearby_title: 'नजदीकी क्लीनिक',
    nearby_sub: 'आपके पास कैंसर जांच केंद्र',
    map_unavail: 'मानचित्र उपलब्ध नहीं (API कुंजी नहीं)',
    history_title: 'जांच इतिहास',
    history_scans: (n: number) => `${n} जांचें दर्ज`,
    history_end: '— इतिहास का अंत —',
    chat_title: 'स्वास्थ्य सहायक',
    chat_sub: 'कैंसर, लक्षण, परिणाम पूछें',
    chat_placeholder: 'लक्षणों या परिणामों के बारे में पूछें…',
    chat_send: 'भेजें',
    chat_typing: 'AI टाइप कर रहा है…',
    chat_welcome: 'नमस्ते! मैं JanArogya का स्वास्थ्य सहायक हूँ। कैंसर जांच, लक्षण या परिणाम के बारे में कुछ भी पूछें। 🌿',
    chat_error: 'माफ़ करें, उत्तर नहीं दे सका। पुनः प्रयास करें।',
    nav_home: 'होम',
    nav_scan: 'जांच',
    nav_clinics: 'क्लीनिक',
    nav_history: 'इतिहास',
    nav_chat: 'चैट',
  },
  ta: {
    greeting: 'காலை வணக்கம் 👋',
    tagline: 'நொடியில் உங்கள்\nஆரோக்கியத்தை சோதிக்கவும்',
    scans_done: 'சோதனைகள் முடிந்தது',
    accuracy: 'துல்லியம்',
    start_scan: 'சோதனை தொடங்கு',
    oral_title: 'வாய் புற்றுநோய்',
    oral_desc: 'வாய் / நாக்கின் புகைப்படம்',
    skin_title: 'தோல் புண்',
    skin_desc: 'தோல் திட்டு / மச்சையின் புகைப்படம்',
    health_tip: 'ஆரோக்கிய குறிப்பு',
    tip_body: 'ஒவ்வொரு 3-6 மாதங்களுக்கும் சுய-பரிசோதனை வாய் புற்றுநோயை 5 ஆண்டுகள் முன்னதாக கண்டறிய உதவுகிறது.',
    upload_oral: '🦷 வாய் சோதனை',
    upload_skin: '🔬 தோல் சோதனை',
    tap_upload: 'புகைப்படம் பதிவேற்றவும்',
    file_hint: 'JPG, PNG 10MB வரை',
    result_lang: 'முடிவு மொழி',
    analyze_btn: 'AI உடன் பகுப்பாய்வு',
    tips_oral: 'வாயை பரந்து திறக்கவும், நல்ல வெளிச்சம் பயன்படுத்தவும்.',
    tips_skin: 'நல்ல வெளிச்சம் உறுதிசெய்யவும், முழு புண்ணையும் படம் எடுக்கவும்.',
    tips_oral_title: 'வாய் சோதனைக்கான புகைப்பட குறிப்புகள்',
    tips_skin_title: 'தோல் சோதனைக்கான புகைப்பட குறிப்புகள்',
    analyzing: 'உங்கள் சோதனை பகுப்பாய்வு செய்யப்படுகிறது',
    wait: 'சற்று காத்திருக்கவும்...',
    step_prep: 'தயார் செய்கிறது',
    step_ai: 'சாதன AI',
    step_gemini: 'Gemini தரிசனம்',
    step_done: 'முடிந்தது',
    oral_screen: 'வாய் புற்றுநோய் பரிசோதனை',
    skin_screen: 'தோல் புண் பகுப்பாய்வு',
    ai_conf: 'AI நம்பிக்கை',
    analysis: 'பகுப்பாய்வு',
    high_risk: 'அதிக ஆபத்து',
    low_risk: 'குறைந்த ஆபத்து',
    invalid: 'செல்லாது',
    find_clinics: 'அருகில் உள்ள கிளினிக்குகள்',
    new_scan: 'புதிய சோதனை',
    share: 'பகிர்',
    disclaimer: 'AI-உதவி பரிசோதனை மட்டுமே. மருத்துவரை அணுகவும்.',
    failed_title: 'பகுப்பாய்வு தோல்வி',
    failed_body: 'பின்புறம் கிடைக்கவில்லை. சேவையகம் localhost:8000 இல் இயங்குகிறதா என்று சரிபாருங்கள்.',
    retry: 'மீண்டும் முயற்சிக்கவும்',
    nearby_title: 'அருகிலுள்ள கிளினிக்குகள்',
    nearby_sub: 'உங்களுக்கு அருகில் புற்றுநோய் பரிசோதனை மையங்கள்',
    map_unavail: 'வரைபடம் கிடைக்கவில்லை (API விசை இல்லை)',
    history_title: 'சோதனை வரலாறு',
    history_scans: (n: number) => `${n} சோதனைகள் பதிவு செய்யப்பட்டன`,
    history_end: '— வரலாறு முடிந்தது —',
    chat_title: 'சுகாதார உதவியாளர்',
    chat_sub: 'புற்றுநோய், அறிகுறிகள் கேளுங்கள்',
    chat_placeholder: 'அறிகுறிகள் அல்லது முடிவுகளைப் பற்றி கேளுங்கள்…',
    chat_send: 'அனுப்பு',
    chat_typing: 'AI தட்டச்சு செய்கிறது…',
    chat_welcome: 'வணக்கம்! நான் JanArogya-வின் சுகாதார உதவியாளர். புற்றுநோய் பரிசோதனை, அறிகுறிகள் பற்றி எதுவும் கேளுங்கள். 🌿',
    chat_error: 'மன்னிக்கவும், பதிலளிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    nav_home: 'முகப்பு',
    nav_scan: 'சோதனை',
    nav_clinics: 'கிளினிக்',
    nav_history: 'வரலாறு',
    nav_chat: 'அரட்டை',
  },
  te: {
    greeting: 'శుభోదయం 👋',
    tagline: 'సెకన్లలో మీ\nఆరోగ్యాన్ని తనిఖీ చేయండి',
    scans_done: 'స్కాన్‌లు పూర్తయ్యాయి',
    accuracy: 'ఖచ్చితత్వం',
    start_scan: 'స్కాన్ ప్రారంభించు',
    oral_title: 'నోరు క్యాన్సర్',
    oral_desc: 'నోరు / నాలుక ఫోటో',
    skin_title: 'చర్మ గాయం',
    skin_desc: 'చర్మ మచ్చ / పుట్టుమచ్చ ఫోటో',
    health_tip: 'ఆరోగ్య చిట్కా',
    tip_body: 'ప్రతి 3-6 నెలలకు స్వీయ-పరీక్ష నోటి క్యాన్సర్‌ను 5 సంవత్సరాల ముందే గుర్తించడంలో సహాయపడుతుంది.',
    upload_oral: '🦷 నోటి స్కాన్',
    upload_skin: '🔬 చర్మ స్కాన్',
    tap_upload: 'ఫోటో అప్‌లోడ్ చేయండి',
    file_hint: 'JPG, PNG 10MB వరకు',
    result_lang: 'ఫలిత భాష',
    analyze_btn: 'AI తో విశ్లేషించండి',
    tips_oral: 'నోరు పెద్దగా తెరవండి, మంచి వెలుతురు ఉపయోగించండి.',
    tips_skin: 'మంచి వెలుతురు నిర్ధారించుకోండి, పూర్తి గాయాన్ని చిత్రీకరించండి.',
    tips_oral_title: 'నోటి స్కాన్ కోసం ఫోటో చిట్కాలు',
    tips_skin_title: 'చర్మ స్కాన్ కోసం ఫోటో చిట్కాలు',
    analyzing: 'మీ స్కాన్ విశ్లేషించబడుతోంది',
    wait: 'దయచేసి కొంచెం వేచి ఉండండి...',
    step_prep: 'సిద్ధమవుతోంది',
    step_ai: 'పరికర AI',
    step_gemini: 'Gemini దృష్టి',
    step_done: 'పూర్తయింది',
    oral_screen: 'నోటి క్యాన్సర్ స్క్రీనింగ్',
    skin_screen: 'చర్మ గాయం విశ్లేషణ',
    ai_conf: 'AI విశ్వాసం',
    analysis: 'విశ్లేషణ',
    high_risk: 'అధిక ప్రమాదం',
    low_risk: 'తక్కువ ప్రమాదం',
    invalid: 'చెల్లదు',
    find_clinics: 'దగ్గరలోని క్లినిక్‌లు',
    new_scan: 'కొత్త స్కాన్',
    share: 'షేర్',
    disclaimer: 'AI-సహాయక స్క్రీనింగ్ మాత్రమే. వైద్యుడిని సంప్రదించండి.',
    failed_title: 'విశ్లేషణ విఫలమైంది',
    failed_body: 'బ్యాకెండ్ అందుబాటులో లేదు. సేవ localhost:8000 లో నడుస్తుందో చూడండి.',
    retry: 'మళ్లీ ప్రయత్నించండి',
    nearby_title: 'దగ్గరలోని క్లినిక్‌లు',
    nearby_sub: 'మీ దగ్గర క్యాన్సర్ స్క్రీనింగ్ కేంద్రాలు',
    map_unavail: 'మ్యాప్ అందుబాటులో లేదు (API కీ లేదు)',
    history_title: 'స్కాన్ చరిత్ర',
    history_scans: (n: number) => `${n} స్కాన్‌లు నమోదు అయ్యాయి`,
    history_end: '— చరిత్ర ముగింపు —',
    chat_title: 'ఆరోగ్య సహాయకుడు',
    chat_sub: 'క్యాన్సర్, లక్షణాలు అడగండి',
    chat_placeholder: 'లక్షణాలు లేదా ఫలితాల గురించి అడగండి…',
    chat_send: 'పంపు',
    chat_typing: 'AI టైప్ చేస్తోంది…',
    chat_welcome: 'నమస్కారం! నేను JanArogya యొక్క ఆరోగ్య సహాయకుడిని. క్యాన్సర్ స్క్రీనింగ్, లక్షణాల గురించి ఏదైనా అడగండి. 🌿',
    chat_error: 'క్షమించండి, సమాధానం ఇవ్వలేకపోయాను. మళ్లీ ప్రయత్నించండి.',
    nav_home: 'హోమ్',
    nav_scan: 'స్కాన్',
    nav_clinics: 'క్లినిక్',
    nav_history: 'చరిత్ర',
    nav_chat: 'చాట్',
  },
} as const;

type DemoT = {
  [K in keyof typeof DEMO_T.en]: typeof DEMO_T.en[K] extends (...args: infer A) => infer R
    ? (...args: A) => R
    : string;
};

/* ─── Mock history data ───────────────────────────────────────────── */
const HISTORY = [
  { id: 1, type: 'oral',  risk: 'LOW_RISK'  as RiskLevel, conf: 0.91, date: 'Apr 17, 2025' },
  { id: 2, type: 'skin',  risk: 'HIGH_RISK' as RiskLevel, conf: 0.84, date: 'Apr 14, 2025' },
  { id: 3, type: 'oral',  risk: 'LOW_RISK'  as RiskLevel, conf: 0.95, date: 'Apr 10, 2025' },
  { id: 4, type: 'skin',  risk: 'LOW_RISK'  as RiskLevel, conf: 0.88, date: 'Apr 05, 2025' },
];

const LANG_LABELS: Record<Lang, string> = { en: 'EN', hi: 'हि', ta: 'தா', te: 'తె' };
const MAPS_KEY = process.env.NEXT_PUBLIC_MAPS_KEY ?? '';

function fmtPct(n: number) { return `${Math.round(n * 100)}%`; }

function getExpl(r: AnalysisResult, lang: Lang) {
  if (lang === 'hi' && r.explanation.hi) return r.explanation.hi;
  if (lang === 'ta' && r.explanation.ta) return r.explanation.ta;
  if (lang === 'te' && r.explanation.te) return r.explanation.te;
  return r.explanation.en;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res((r.result as string).split(',')[1]);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const BACKEND = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000') + '/api/v1';

async function callBackend(base64: string, scanType: ScanType, lang: Lang): Promise<AnalysisResult> {
  const resp = await fetch(`${BACKEND}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: base64, scan_type: scanType, language: lang }),
  });
  if (!resp.ok) throw new Error(`Backend error ${resp.status}`);
  const d = await resp.json();
  return { risk_level: d.risk_level, confidence: d.confidence, explanation: d.explanation, disclaimer: d.disclaimer };
}

/* ─── Status Bar ──────────────────────────────────────────────────── */
function StatusBar() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const fmt = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    fmt();
    const id = setInterval(fmt, 30000);
    return () => clearInterval(id);
  }, []);
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px 4px', fontSize:13, fontWeight:700, color:'#2a241d' }}>
      <span>{time || '09:41'}</span>
      <div style={{ display:'flex', alignItems:'center', gap:5 }}>
        <Wifi size={13} />
        <Battery size={15} />
      </div>
    </div>
  );
}

function DynamicIsland() {
  return (
    <div style={{ display:'flex', justifyContent:'center', paddingBottom:6 }}>
      <div style={{ width:120, height:34, borderRadius:20, background:'#1a1a1a', margin:'0 auto' }} />
    </div>
  );
}

/* ─── Bottom Nav ──────────────────────────────────────────────────── */
function BottomNav({ active, onNav, T }: { active: Screen; onNav: (s: Screen) => void; T: DemoT }) {
  const tabs = [
    { id: 'home' as Screen, icon: Home, label: T.nav_home },
    { id: 'upload' as Screen, icon: ScanLine, label: T.nav_scan },
    { id: 'clinics' as Screen, icon: MapPin, label: T.nav_clinics },
    { id: 'history' as Screen, icon: History, label: T.nav_history },
    { id: 'chat' as Screen, icon: MessageCircle, label: T.nav_chat },
  ];
  return (
    <div style={{ borderTop:'1px solid #e8d9c4', background:'#ffffff', display:'flex', padding:'6px 0 10px' }}>
      {tabs.map(t => {
        const on = active === t.id;
        return (
          <button key={t.id} onClick={() => onNav(t.id)}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, border:'none', background:'transparent', cursor:'pointer', color: on ? '#1f7a5a' : '#9b8e83', padding:'4px 0' }}>
            <t.icon size={18} strokeWidth={on ? 2.5 : 1.8} />
            <span style={{ fontSize:9, fontWeight: on ? 700 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Home Screen ─────────────────────────────────────────────────── */
function HomeScreen({ onScan, T }: { onScan: (t: ScanType) => void; T: DemoT }) {
  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fff9f1', padding:'16px 20px', display:'flex', flexDirection:'column', gap:16 }}>
      <div>
        <p style={{ fontSize:13, color:'#6b5f52', fontWeight:600 }}>{T.greeting}</p>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#2a241d', fontFamily:'Nunito,sans-serif', lineHeight:1.2, margin:'2px 0 0', whiteSpace:'pre-line' }}>{T.tagline}</h2>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
        {[
          { label: T.scans_done, value:'2.4L+', bg:'#e1f1e8', color:'#155c43' },
          { label: T.accuracy,   value:'94.2%', bg:'#fde7d5', color:'#b85e22' },
        ].map(s => (
          <div key={s.label} style={{ background:s.bg, borderRadius:16, padding:'14px 16px' }}>
            <p style={{ fontSize:22, fontWeight:800, color:s.color, fontFamily:'Nunito,sans-serif' }}>{s.value}</p>
            <p style={{ fontSize:11, color:'#6b5f52', fontWeight:600, marginTop:2 }}>{s.label}</p>
          </div>
        ))}
      </div>
      <p style={{ fontSize:12, fontWeight:700, color:'#6b5f52', textTransform:'uppercase', letterSpacing:'0.08em' }}>{T.start_scan}</p>
      {([
        { type:'oral' as ScanType, emoji:'🦷', title:T.oral_title, desc:T.oral_desc, bg:'#e1f1e8', border:'#a8d9bc', btn:'#1f7a5a' },
        { type:'skin' as ScanType, emoji:'🔬', title:T.skin_title, desc:T.skin_desc, bg:'#fff2d0', border:'#f5d57a', btn:'#c89000' },
      ]).map(c => (
        <button key={c.type} onClick={() => onScan(c.type)}
          style={{ background:c.bg, border:`2px solid ${c.border}`, borderRadius:20, padding:'18px', textAlign:'left', cursor:'pointer', width:'100%', display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ fontSize:32 }}>{c.emoji}</div>
          <div style={{ flex:1 }}>
            <p style={{ fontWeight:800, fontSize:16, color:'#2a241d', fontFamily:'Nunito,sans-serif' }}>{c.title}</p>
            <p style={{ fontSize:12, color:'#6b5f52', marginTop:2 }}>{c.desc}</p>
          </div>
          <div style={{ width:32, height:32, borderRadius:10, background:c.btn, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChevronRight size={16} color="#fff" />
          </div>
        </button>
      ))}
      <div style={{ background:'#ffffff', border:'1px solid #e8d9c4', borderRadius:16, padding:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:'#e1f1e8', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>💡</div>
          <p style={{ fontWeight:700, fontSize:13, color:'#2a241d' }}>{T.health_tip}</p>
        </div>
        <p style={{ fontSize:12, color:'#6b5f52', lineHeight:1.55 }}>{T.tip_body}</p>
      </div>
    </div>
  );
}

/* ─── Upload Screen ───────────────────────────────────────────────── */
function UploadScreen({ scanType, onBack, onAnalyze, T }: { scanType: ScanType; onBack: () => void; onAnalyze: (file: File, lang: Lang) => void; T: DemoT }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lang, setLang] = useState<Lang>('en');
  const inputRef = useRef<HTMLInputElement>(null);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const title = scanType === 'oral' ? T.upload_oral : T.upload_skin;
  const tipTitle = scanType === 'oral' ? T.tips_oral_title : T.tips_skin_title;
  const tipBody = scanType === 'oral' ? T.tips_oral : T.tips_skin;

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fff9f1', display:'flex', flexDirection:'column' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#ffffff', borderBottom:'1px solid #e8d9c4' }}>
        <button onClick={onBack} style={{ border:'none', background:'#e1f1e8', borderRadius:10, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ArrowLeft size={16} color="#1f7a5a" />
        </button>
        <p style={{ fontWeight:800, fontSize:17, color:'#2a241d', fontFamily:'Nunito,sans-serif' }}>{title}</p>
      </div>
      <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>
        <div onClick={() => inputRef.current?.click()}
          style={{ border:`2px dashed ${file ? '#1f7a5a' : '#c8b99e'}`, borderRadius:20, overflow:'hidden', cursor:'pointer', background: file ? '#e1f1e8' : '#ffffff', minHeight:160, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <input ref={inputRef} type="file" accept="image/*" onChange={pick} style={{ display:'none' }} />
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="preview" style={{ width:'100%', maxHeight:220, objectFit:'cover', display:'block' }} />
          ) : (
            <div style={{ textAlign:'center', padding:24 }}>
              <div style={{ width:56, height:56, borderRadius:16, background:'#e1f1e8', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
                <Camera size={24} color="#1f7a5a" />
              </div>
              <p style={{ fontWeight:700, fontSize:14, color:'#2a241d' }}>{T.tap_upload}</p>
              <p style={{ fontSize:11, color:'#9b8e83', marginTop:4 }}>{T.file_hint}</p>
            </div>
          )}
        </div>
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:'#6b5f52', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>{T.result_lang}</p>
          <div style={{ display:'flex', gap:6 }}>
            {(Object.keys(LANG_LABELS) as Lang[]).map(l => (
              <button key={l} onClick={() => setLang(l)}
                style={{ flex:1, padding:'8px 0', borderRadius:10, border:'none', fontSize:12, fontWeight:700, cursor:'pointer', background: lang === l ? '#1f7a5a' : '#e8d9c4', color: lang === l ? '#fff' : '#6b5f52' }}>
                {LANG_LABELS[l]}
              </button>
            ))}
          </div>
        </div>
        {!file && (
          <div style={{ background:'#fff2d0', borderRadius:14, padding:'12px 14px', display:'flex', gap:10, alignItems:'flex-start' }}>
            <span style={{ fontSize:18 }}>💡</span>
            <div>
              <p style={{ fontSize:12, fontWeight:700, color:'#2a241d', marginBottom:2 }}>{tipTitle}</p>
              <p style={{ fontSize:11, color:'#6b5f52', lineHeight:1.5 }}>{tipBody}</p>
            </div>
          </div>
        )}
        <button onClick={() => file && onAnalyze(file, lang)} disabled={!file}
          style={{ background: file ? '#1f7a5a' : '#c8b99e', color:'#fff', border:'none', borderRadius:16, padding:'16px', fontWeight:800, fontSize:16, fontFamily:'Nunito,sans-serif', cursor: file ? 'pointer' : 'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
          <ScanLine size={20} />
          {T.analyze_btn}
        </button>
      </div>
    </div>
  );
}

/* ─── Scanning Screen ─────────────────────────────────────────────── */
function ScanningScreen({ preview, step, T }: { preview: string | null; step: number; T: DemoT }) {
  const steps = [T.step_prep, T.step_ai, T.step_gemini, T.step_done];
  return (
    <div style={{ flex:1, background:'#fff9f1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:24 }}>
      {preview && (
        <div style={{ width:120, height:120, borderRadius:24, overflow:'hidden', border:'3px solid #1f7a5a', boxShadow:'0 0 0 6px #e1f1e8' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="scan" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        </div>
      )}
      <div style={{ position:'relative', width:80, height:80 }}>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'3px solid #e8d9c4', borderTopColor:'#1f7a5a', animation:'spin 1s linear infinite' }} />
        <div style={{ position:'absolute', inset:8, borderRadius:'50%', border:'2px solid #e8d9c4', borderTopColor:'#e0803a', animation:'spin 1.5s linear infinite reverse' }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontWeight:800, fontSize:17, color:'#2a241d', fontFamily:'Nunito,sans-serif' }}>{T.analyzing}</p>
        <p style={{ fontSize:12, color:'#6b5f52', marginTop:4 }}>{T.wait}</p>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {steps.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background: i < step ? '#1f7a5a' : i === step ? '#e0803a' : '#e8d9c4', transition:'all 0.3s' }} />
              <span style={{ fontSize:9, color: i <= step ? '#1f7a5a' : '#9b8e83', fontWeight: i <= step ? 700 : 400, whiteSpace:'nowrap' }}>{s}</span>
            </div>
            {i < steps.length - 1 && <div style={{ width:18, height:2, borderRadius:1, marginBottom:14, background: i < step ? '#1f7a5a' : '#e8d9c4', transition:'all 0.3s' }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Result Screen ───────────────────────────────────────────────── */
function ResultScreen({ result, scanType, lang, onReset, onClinics, T }: { result: AnalysisResult; scanType: ScanType; lang: Lang; onReset: () => void; onClinics: () => void; T: DemoT }) {
  const isHigh = result.risk_level === 'HIGH_RISK';
  const isLow  = result.risk_level === 'LOW_RISK';
  const riskBg    = isHigh ? '#fbe0db' : isLow ? '#e1f1e8' : '#fff2d0';
  const riskColor = isHigh ? '#c13a2b' : isLow ? '#1f7a5a' : '#9a6e00';
  const riskLabel = isHigh ? T.high_risk : isLow ? T.low_risk : T.invalid;
  const RiskIcon  = isHigh ? AlertCircle : isLow ? CheckCircle : XCircle;

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fff9f1' }}>
      <div style={{ background: riskBg, padding:'24px 20px 20px', textAlign:'center', borderBottom:'1px solid #e8d9c4' }}>
        <RiskIcon size={40} color={riskColor} strokeWidth={2} style={{ marginBottom:8 }} />
        <div style={{ display:'inline-flex', alignItems:'center', gap:6, background: riskColor, borderRadius:999, padding:'4px 14px', marginBottom:10 }}>
          <span style={{ color:'#fff', fontWeight:800, fontSize:13, letterSpacing:'0.06em' }}>{riskLabel}</span>
        </div>
        <p style={{ fontSize:12, color:'#6b5f52', fontWeight:600 }}>
          {scanType === 'oral' ? T.oral_screen : T.skin_screen}
        </p>
      </div>
      <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ background:'#ffffff', borderRadius:16, padding:16, border:'1px solid #e8d9c4' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#6b5f52' }}>{T.ai_conf}</p>
            <p style={{ fontSize:15, fontWeight:800, color:riskColor }}>{fmtPct(result.confidence)}</p>
          </div>
          <div style={{ height:8, background:'#e8d9c4', borderRadius:4, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${result.confidence * 100}%`, background: riskColor, borderRadius:4 }} />
          </div>
        </div>
        <div style={{ background:'#ffffff', borderRadius:16, padding:16, border:'1px solid #e8d9c4' }}>
          <p style={{ fontSize:12, fontWeight:700, color:'#6b5f52', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{T.analysis}</p>
          <p style={{ fontSize:13, color:'#2a241d', lineHeight:1.65 }}>{getExpl(result, lang)}</p>
        </div>
        {isHigh && (
          <button onClick={onClinics}
            style={{ background:'#1f7a5a', color:'#fff', border:'none', borderRadius:16, padding:'14px', fontWeight:800, fontSize:15, fontFamily:'Nunito,sans-serif', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            <MapPin size={18} />{T.find_clinics}
          </button>
        )}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onReset} style={{ flex:1, background:'#e1f1e8', color:'#1f7a5a', border:'none', borderRadius:14, padding:'12px', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <RotateCcw size={15} />{T.new_scan}
          </button>
          <button style={{ flex:1, background:'#fde7d5', color:'#b85e22', border:'none', borderRadius:14, padding:'12px', fontWeight:700, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            <Share2 size={15} />{T.share}
          </button>
        </div>
        <p style={{ fontSize:11, color:'#9b8e83', textAlign:'center', lineHeight:1.5, padding:'0 8px' }}>
          {result.disclaimer ?? T.disclaimer}
        </p>
      </div>
    </div>
  );
}

/* ─── Error Screen ────────────────────────────────────────────────── */
function ErrorScreen({ error, onRetry, T }: { error: string; onRetry: () => void; T: DemoT }) {
  return (
    <div style={{ flex:1, background:'#fff9f1', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:24, gap:16, textAlign:'center' }}>
      <div style={{ width:64, height:64, borderRadius:20, background:'#fbe0db', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <XCircle size={32} color="#c13a2b" />
      </div>
      <div>
        <p style={{ fontWeight:800, fontSize:17, color:'#2a241d', fontFamily:'Nunito,sans-serif' }}>{T.failed_title}</p>
        <p style={{ fontSize:12, color:'#6b5f52', marginTop:6, lineHeight:1.5 }}>
          {error.includes('fetch') || error.includes('Failed') ? T.failed_body : error}
        </p>
      </div>
      <button onClick={onRetry} style={{ background:'#1f7a5a', color:'#fff', border:'none', borderRadius:14, padding:'12px 24px', fontWeight:700, fontSize:14, cursor:'pointer' }}>
        {T.retry}
      </button>
    </div>
  );
}

/* ─── Clinics Screen ──────────────────────────────────────────────── */
function ClinicsScreen({ onBack, T }: { onBack: () => void; T: DemoT }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff9f1' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#ffffff', borderBottom:'1px solid #e8d9c4' }}>
        <button onClick={onBack} style={{ border:'none', background:'#e1f1e8', borderRadius:10, width:32, height:32, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <ArrowLeft size={16} color="#1f7a5a" />
        </button>
        <div>
          <p style={{ fontWeight:800, fontSize:16, color:'#2a241d', fontFamily:'Nunito,sans-serif' }}>{T.nearby_title}</p>
          <p style={{ fontSize:11, color:'#6b5f52' }}>{T.nearby_sub}</p>
        </div>
      </div>
      <div style={{ flex:1, position:'relative', minHeight:0 }}>
        {MAPS_KEY ? (
          <iframe title="Nearby clinics" width="100%" height="100%" style={{ border:'none', display:'block' }}
            src={`https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=cancer+screening+hospital+India&zoom=12`} allowFullScreen />
        ) : (
          <div style={{ flex:1, background:'#e1f1e8', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10, minHeight:240 }}>
            <MapPin size={32} color="#1f7a5a" />
            <p style={{ fontSize:13, color:'#6b5f52', fontWeight:600 }}>{T.map_unavail}</p>
          </div>
        )}
      </div>
      <div style={{ maxHeight:200, overflowY:'auto', borderTop:'1px solid #e8d9c4' }}>
        {[
          { name:'AIIMS Cancer Centre',       dist:'2.3 km', rating:'4.8', tag:'Government' },
          { name:'Tata Memorial Outreach',    dist:'4.1 km', rating:'4.9', tag:'Specialist' },
          { name:'District Cancer Hospital',  dist:'6.5 km', rating:'4.5', tag:'Government' },
          { name:'Apollo Cancer Screening',   dist:'8.2 km', rating:'4.7', tag:'Private' },
        ].map(c => (
          <div key={c.name} style={{ padding:'12px 16px', borderBottom:'1px solid #e8d9c4', display:'flex', alignItems:'center', gap:12, background:'#ffffff' }}>
            <div style={{ width:36, height:36, borderRadius:12, background:'#e1f1e8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <MapPin size={16} color="#1f7a5a" />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#2a241d', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{c.name}</p>
              <div style={{ display:'flex', gap:8, marginTop:2, alignItems:'center' }}>
                <span style={{ fontSize:11, color:'#6b5f52' }}>{c.dist}</span>
                <span style={{ width:3, height:3, borderRadius:'50%', background:'#c8b99e' }} />
                <span style={{ fontSize:11, color:'#e0803a', fontWeight:700 }}>★ {c.rating}</span>
                <span style={{ fontSize:10, background:'#e1f1e8', color:'#1f7a5a', padding:'1px 6px', borderRadius:6, fontWeight:600 }}>{c.tag}</span>
              </div>
            </div>
            <ChevronRight size={14} color="#9b8e83" />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── History Screen ──────────────────────────────────────────────── */
function HistoryScreen({ T }: { T: DemoT }) {
  const riskStyle = (r: RiskLevel) =>
    r === 'HIGH_RISK' ? { bg:'#fbe0db', color:'#c13a2b', label: T.high_risk }
    : r === 'LOW_RISK'  ? { bg:'#e1f1e8', color:'#1f7a5a', label: T.low_risk }
    :                     { bg:'#fff2d0', color:'#9a6e00', label: T.invalid };
  return (
    <div style={{ flex:1, overflowY:'auto', background:'#fff9f1' }}>
      <div style={{ padding:'16px 16px 8px' }}>
        <h2 style={{ fontWeight:800, fontSize:20, color:'#2a241d', fontFamily:'Nunito,sans-serif' }}>{T.history_title}</h2>
        <p style={{ fontSize:12, color:'#6b5f52', marginTop:2 }}>{T.history_scans(HISTORY.length)}</p>
      </div>
      {HISTORY.map(h => {
        const s = riskStyle(h.risk);
        return (
          <div key={h.id} style={{ margin:'0 16px 10px', background:'#ffffff', borderRadius:18, border:'1px solid #e8d9c4', padding:'14px 16px', display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:14, background: h.type === 'oral' ? '#e1f1e8' : '#fff2d0', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
              {h.type === 'oral' ? '🦷' : '🔬'}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:14, color:'#2a241d', textTransform:'capitalize' }}>{h.type} Scan</p>
              <div style={{ display:'flex', gap:8, marginTop:3, alignItems:'center' }}>
                <Clock size={10} color="#9b8e83" />
                <span style={{ fontSize:11, color:'#6b5f52' }}>{h.date}</span>
              </div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ background:s.bg, color:s.color, borderRadius:8, padding:'3px 10px', fontSize:11, fontWeight:800, marginBottom:4 }}>{s.label}</div>
              <span style={{ fontSize:11, color:'#9b8e83' }}>{fmtPct(h.conf)}</span>
            </div>
          </div>
        );
      })}
      <div style={{ textAlign:'center', padding:'12px 0 20px' }}>
        <p style={{ fontSize:12, color:'#c8b99e' }}>{T.history_end}</p>
      </div>
    </div>
  );
}

/* ─── Chat Screen ─────────────────────────────────────────────────── */
function ChatScreen({ lang, T }: { lang: Lang; T: DemoT }) {
  const [messages, setMessages] = useState<ChatMsg[]>([{ role: 'assistant', content: T.chat_welcome }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    const userMsg: ChatMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: messages, language: lang }),
      });
      const data = await res.json() as { response?: string };
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response ?? T.chat_error }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: T.chat_error }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); send(); }
  };

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff9f1' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', background:'#1f7a5a', display:'flex', alignItems:'center', gap:10 }}>
        <div style={{ width:36, height:36, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🌿</div>
        <div>
          <p style={{ fontWeight:800, fontSize:14, color:'#fff', fontFamily:'Nunito,sans-serif' }}>{T.chat_title}</p>
          <p style={{ fontSize:11, color:'rgba(255,255,255,0.75)' }}>{T.chat_sub}</p>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 12px', display:'flex', flexDirection:'column', gap:8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'80%', borderRadius: m.role === 'user' ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
              padding:'9px 12px', fontSize:12, lineHeight:1.5,
              background: m.role === 'user' ? '#1f7a5a' : '#ffffff',
              color: m.role === 'user' ? '#fff' : '#2a241d',
              border: m.role === 'assistant' ? '1px solid #e8d9c4' : 'none',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ background:'#ffffff', border:'1px solid #e8d9c4', borderRadius:'14px 14px 14px 3px', padding:'10px 14px' }}>
              <span style={{ display:'inline-flex', gap:3 }}>
                {[0,1,2].map(d => (
                  <span key={d} style={{ display:'inline-block', width:5, height:5, borderRadius:'50%', background:'#1f7a5a', animation:`bounce2 1s ${d*0.2}s infinite` }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:'8px 10px', borderTop:'1px solid #e8d9c4', display:'flex', gap:6, background:'#ffffff' }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          placeholder={T.chat_placeholder}
          disabled={loading}
          style={{ flex:1, border:'1.5px solid #e8d9c4', borderRadius:12, padding:'8px 11px', fontSize:12, fontFamily:'inherit', background:'#fff9f1', color:'#2a241d', outline:'none' }}
        />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ background: input.trim() && !loading ? '#1f7a5a' : '#c8b99e', color:'#fff', border:'none', borderRadius:10, width:34, height:34, cursor: input.trim() ? 'pointer' : 'default', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <Send size={14} />
        </button>
      </div>
      <style>{`@keyframes bounce2{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-4px)}}`}</style>
    </div>
  );
}

/* ─── Phone Frame ─────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PhoneFrame({ onClose }: { onClose: () => void }) {
  const [screen, setScreen]     = useState<Screen>('home');
  const [scanType, setScanType] = useState<ScanType>('oral');
  const [preview, setPreview]   = useState<string | null>(null);
  const [result, setResult]     = useState<AnalysisResult | null>(null);
  const [error, setError]       = useState<string | null>(null);
  const [step, setStep]         = useState(0);
  const [lang, setLang]         = useState<Lang>('en');

  const T: DemoT = DEMO_T[lang];

  const startScan = (t: ScanType) => { setScanType(t); setScreen('upload'); };

  const analyze = useCallback(async (file: File, l: Lang) => {
    setLang(l);
    setPreview(URL.createObjectURL(file));
    setScreen('scanning');
    setStep(0);
    setError(null);
    try {
      const b64 = await fileToBase64(file);
      setStep(1);
      await new Promise(r => setTimeout(r, 600));
      setStep(2);
      const res = await callBackend(b64, scanType, l);
      setStep(3);
      await new Promise(r => setTimeout(r, 400));
      setResult(res);
      setScreen('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
      setScreen('result');
    }
  }, [scanType]);

  const reset = () => { setResult(null); setError(null); setPreview(null); setStep(0); setScreen('home'); };

  const navTo = (s: Screen) => {
    if (s === 'upload') { setScreen('home'); return; }
    setScreen(s);
  };

  return (
    <div style={{ width:375, height:780, background:'#1a1a1a', borderRadius:52, boxShadow:'0 0 0 2px #333, 0 30px 80px rgba(0,0,0,0.6), inset 0 0 0 1px #444', display:'flex', flexDirection:'column', overflow:'hidden', position:'relative', flexShrink:0 }}>
      {/* Side buttons */}
      <div style={{ position:'absolute', left:-4, top:120, width:4, height:32, background:'#2a2a2a', borderRadius:'2px 0 0 2px' }} />
      <div style={{ position:'absolute', left:-4, top:164, width:4, height:56, background:'#2a2a2a', borderRadius:'2px 0 0 2px' }} />
      <div style={{ position:'absolute', left:-4, top:232, width:4, height:56, background:'#2a2a2a', borderRadius:'2px 0 0 2px' }} />
      <div style={{ position:'absolute', right:-4, top:160, width:4, height:80, background:'#2a2a2a', borderRadius:'0 2px 2px 0' }} />

      {/* Screen bezel */}
      <div style={{ flex:1, background:'#fff9f1', margin:'8px 6px', borderRadius:46, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
        <StatusBar />
        <DynamicIsland />

        {screen === 'home'     && <HomeScreen onScan={startScan} T={T} />}
        {screen === 'upload'   && <UploadScreen scanType={scanType} onBack={() => setScreen('home')} onAnalyze={analyze} T={T} />}
        {screen === 'scanning' && <ScanningScreen preview={preview} step={step} T={T} />}
        {screen === 'result'   && error && <ErrorScreen error={error} onRetry={() => setScreen('upload')} T={T} />}
        {screen === 'result'   && result && !error && (
          <ResultScreen result={result} scanType={scanType} lang={lang} onReset={reset} onClinics={() => setScreen('clinics')} T={T} />
        )}
        {screen === 'clinics'  && <ClinicsScreen onBack={() => setScreen(result ? 'result' : 'home')} T={T} />}
        {screen === 'history'  && <HistoryScreen T={T} />}
        {screen === 'chat'     && <ChatScreen lang={lang} T={T} />}

        {!['scanning'].includes(screen) && <BottomNav active={screen} onNav={navTo} T={T} />}

        <div style={{ display:'flex', justifyContent:'center', padding:'6px 0 10px' }}>
          <div style={{ width:120, height:4, background:'#2a241d', borderRadius:2, opacity:0.15 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── Modal ───────────────────────────────────────────────────────── */
export default function PhoneDemoModal({ onClose }: { onClose: () => void }) {
  const handleBackdrop = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div onClick={handleBackdrop}
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'20px', gap:32 }}>
      {/* Left hints */}
      <div style={{ color:'rgba(255,255,255,0.7)', maxWidth:200, display:'flex', flexDirection:'column', gap:16, flexShrink:0 }} className="phone-hint">
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {[
            { icon:'🦷', text:'Scan your oral cavity for cancer signs' },
            { icon:'🔬', text:'Check skin lesions for risk assessment' },
            { icon:'🗺️', text:'Find nearby clinics if high risk detected' },
            { icon:'💬', text:'Chat with AI health assistant in your language' },
          ].map(h => (
            <div key={h.text} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ fontSize:18 }}>{h.icon}</span>
              <p style={{ fontSize:13, lineHeight:1.5, margin:0 }}>{h.text}</p>
            </div>
          ))}
        </div>
      </div>

      <PhoneFrame onClose={onClose} />

      <button onClick={onClose}
        style={{ position:'absolute', top:20, right:20, width:40, height:40, borderRadius:'50%', border:'none', background:'rgba(255,255,255,0.15)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(4px)' }}>
        <X size={20} />
      </button>
    </div>
  );
}
