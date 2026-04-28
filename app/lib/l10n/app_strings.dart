/// All UI strings in all 4 supported languages.
/// Never hard-code strings in widgets — always use AppStrings.of(context).
class AppStrings {
  final String langCode;

  const AppStrings(this.langCode);

  static AppStrings of(String langCode) => AppStrings(langCode);

  String _t(String en, String hi, String ta, String te) {
    switch (langCode) {
      case 'hi': return hi;
      case 'ta': return ta;
      case 'te': return te;
      default:   return en;
    }
  }

  // ── App ────────────────────────────────────────────────────────────────────
  String get appName         => 'JanArogya';
  String get appNameLocal    => _t('JanArogya', 'जनआरोग्य', 'ஜனஆரோக்யா', 'జనారోగ్య');
  String get appTagline      => _t(
    'AI-Powered Cancer Screening',
    'AI कैंसर जांच',
    'AI புற்றுநோய் திரையிடல்',
    'AI క్యాన్సర్ స్క్రీనింగ్',
  );

  // ── Navigation ─────────────────────────────────────────────────────────────
  String get navHome         => _t('Home',     'होम',      'முகப்பு',   'హోమ్');
  String get navScan         => _t('Scan',     'जांच',     'ஸ்கேன்',    'స్కాన్');
  String get navClinics      => _t('Clinics',  'क्लिनिक',  'கிளினிக்',  'క్లినిక్‌లు');
  String get navCommunity    => _t('Community','समुदाय',   'சமூகம்',     'సంఘం');
  String get navHistory      => _t('History',  'इतिहास',   'வரலாறு',    'చరిత్ర');
  String get navSettings     => _t('Settings', 'सेटिंग्स', 'அமைப்புகள்', 'సెట్టింగ్స్');

  // ── Home Screen ────────────────────────────────────────────────────────────
  String get homeGreeting    => _t(
    'Welcome to JanArogya',
    'JanArogya में आपका स्वागत है',
    'JanArogyaவிற்கு வரவேற்கிறோம்',
    'JanArogyaకి స్వాగతం',
  );
  String get homeScanNow     => _t('Scan Now',       'जांच करें',      'இப்போது ஸ்கேன் செய்',  'ఇప్పుడే స్కాన్ చేయి');
  String get homeViewHistory => _t('View History',   'इतिहास देखें',   'வரலாறு பார்க்க',       'చరిత్ర చూడు');
  String get homeCameraHint  => _t(
    'Take or upload a photo to screen for early signs',
    'जांच के लिए फोटो लें या अपलोड करें',
    'ஆரம்ப அறிகுறிகளை திரையிட புகைப்படம் எடுக்கவும்',
    'ముందస్తు సంకేతాల కోసం ఫోటో తీయండి',
  );
  String get homeHistoryHint => _t(
    'View your past scans and results',
    'अपनी पुरानी जांच और परिणाम देखें',
    'உங்கள் கடந்த கால ஸ்கேன்களை பார்க்கவும்',
    'మీ గత స్కాన్‌లు మరియు ఫలితాలను చూడండి',
  );
  String get helplineLabel   => _t(
    'Cancer Helpline',
    'कैंसर हेल्पलाइन',
    'புற்றுநோய் உதவி எண்',
    'క్యాన్సర్ హెల్ప్‌లైన్',
  );
  String get helplineNumber  => '1800-11-2345';

  // ── Scan Screen ────────────────────────────────────────────────────────────
  String get scanTitle       => _t('New Scan',            'नई जांच',           'புதிய ஸ்கேன்',        'కొత్త స్కాన్');
  String get scanTypeLabel   => _t('Scan Type',           'जांच का प्रकार',    'ஸ்கேன் வகை',          'స్కాన్ రకం');
  String get scanOral        => _t('Oral Cavity',         'मुंह की जांच',      'வாய் குழிவு',         'నోటి కుహరం');
  String get scanSkin        => _t('Skin Lesion',         'त्वचा की जांच',     'தோல் புண்',           'చర్మ గాయం');
  String get scanOther       => _t('Other',               'अन्य',              'மற்றவை',              'ఇతరాలు');
  String get scanAnalyze     => _t('Analyze',             'जांच करें',         'பகுப்பாய்வு செய்',    'విశ్లేషించు');
  String get scanInstruction => _t(
    'Take a clear, well-lit photo of the affected area. Hold steady.',
    'प्रभावित क्षेत्र की स्पष्ट, अच्छी रोशनी वाली तस्वीर लें।',
    'பாதிக்கப்பட்ட பகுதியின் தெளிவான புகைப்படம் எடுக்கவும்.',
    'ప్రభావిత ప్రాంతం యొక్క స్పష్టమైన ఫోటో తీయండి.',
  );
  String get scanAnalyzing   => _t('Analyzing...', 'जांच हो रही है...', 'பகுப்பாய்வு செய்கிறது...', 'విశ్లేషిస్తోంది...');
  String get scanRetake      => _t('Retake Photo',        'फोटो फिर लें',      'மீண்டும் புகைப்படம் எடு', 'ఫోటో తిరిగి తీయండి');
  String get scanPickImage   => _t('Choose from Gallery', 'गैलरी से चुनें',    'தொகுப்பிலிருந்து தேர்ந்தெடு', 'గ్యాలరీ నుండి ఎంచుకోండి');

  // ── Result Screen ──────────────────────────────────────────────────────────
  String get resultTitle       => _t('Screening Result',    'जांच परिणाम',     'திரையிடல் முடிவு',    'స్క్రీనింగ్ ఫలితం');
  String get resultLowRisk     => _t('LOW RISK',            'कम जोखिम',        'குறைந்த ஆபத்து',      'తక్కువ ప్రమాదం');
  String get resultHighRisk    => _t('HIGH RISK',           'अधिक जोखिम',      'அதிக ஆபத்து',        'అధిక ప్రమాదం');
  String get resultInvalid     => _t('INVALID',             'अमान्य',          'செல்லாத',             'చెల్లదు');
  String get resultConfidence  => _t('Confidence',          'विश्वसनीयता',     'நம்பகத்தன்மை',        'విశ్వాసం');
  String get resultExplanation => _t('AI Explanation',      'AI विश्लेषण',     'AI விளக்கம்',         'AI వివరణ');
  String get resultFindClinic  => _t('Find Nearest Clinic', 'नजदीकी क्लिनिक', 'அருகிலுள்ள கிளினிக்', 'దగ్గరి క్లినిక్ కనుగొనండి');
  String get resultDownload    => _t('Download Report',     'रिपोर्ट डाउनलोड', 'அறிக்கை பதிவிறக்கம்', 'నివేదిక డౌన్‌లోడ్');
  String get resultScanAgain   => _t('Scan Again',          'फिर जांचें',      'மீண்டும் ஸ்கேன் செய்', 'మళ్ళీ స்కాన్ చేయి');
  String get resultShareReport => _t('Share Report',        'रिपोर्ट शेयर करें', 'அறிக்கை பகிர்',    'నివేదిక పంచుకోండి');

  // ── History Screen ─────────────────────────────────────────────────────────
  String get historyTitle      => _t('Past checks',    'पुरानी जांच',       'கடந்த பரிசோதனைகள்', 'గత పరీక్షలు');
  String get historyConfidence => _t('confidence',     'विश्वास स्तर',      'நம்பிக்கை',          'విశ్వాస స్థాయి');
  String get historyEmpty      => _t('No scans yet',    'अभी कोई जांच नहीं', 'இதுவரை ஸ்கேன் இல்லை', 'ఇంకా స్కాన్‌లు లేవు');
  String get historyEmptyHint  => _t(
    'Your past scans will appear here',
    'आपकी पुरानी जांच यहाँ दिखेगी',
    'உங்கள் கடந்த கால ஸ்கேன்கள் இங்கே தோன்றும்',
    'మీ గత స్కాన్‌లు ఇక్కడ కనిపిస్తాయి',
  );
  String get historyFilterAll  => _t('All',       'सभी',      'அனைத்தும்',  'అన్నీ');
  String get historyFilterLow  => _t('Low Risk',  'कम जोखिम', 'குறைந்த',    'తక్కువ');
  String get historyFilterHigh => _t('High Risk', 'अधिक जोखिम', 'அதிக',    'అధిక');
  String get historyFilterInv  => _t('Invalid',   'अमान्य',   'செல்லாத',   'చెల్లదు');

  // ── Settings Screen ────────────────────────────────────────────────────────
  String get settingsTitle       => _t('Settings',       'सेटिंग्स',      'அமைப்புகள்',      'సెట్టింగ్స్');
  String get settingsLanguage    => _t('Language',        'भाषा',           'மொழி',            'భాష');
  String get settingsTheme       => _t('Theme',           'थीम',            'தீம்',            'థీమ్');
  String get settingsThemeSystem => _t('System',          'सिस्टम',         'கணினி',           'సిస్టమ్');
  String get settingsThemeLight  => _t('Light',           'हल्का',          'ஒளி',             'లైట్');
  String get settingsThemeDark   => _t('Dark',            'गहरा',           'இருண்ட',          'డార్క్');
  String get settingsVersion     => _t('Version',         'संस्करण',        'பதிப்பு',         'వెర్షన్');
  String get settingsClearHistory => _t('Clear History',  'इतिहास साफ करें', 'வரலாற்றை அழி',  'చరిత్ర తొలగించు');
  String get settingsClearConfirm => _t(
    'This will permanently delete all scan history. Continue?',
    'यह सभी जांच इतिहास को हमेशा के लिए हटा देगा। जारी रखें?',
    'இது அனைத்து ஸ்கேன் வரலாற்றையும் நிரந்தரமாக நீக்கும். தொடர?',
    'ఇది అన్ని స్కాన్ చరిత్రను శాశ్వతంగా తొలగిస్తుంది. కొనసాగించాలా?',
  );
  String get settingsDisclaimer  => _t(
    'This app is for screening purposes only. Not a substitute for medical advice.',
    'यह ऐप केवल जांच के लिए है। चिकित्सा सलाह का विकल्प नहीं।',
    'இந்த ஆப்ப் திரையிடல் நோக்கங்களுக்காக மட்டுமே. மருத்துவ ஆலோசனைக்கு மாற்றாக இல்லை.',
    'ఈ యాప్ స్క్రీనింగ్ అవసరాలకు మాత్రమే. వైద్య సలహాకు ప్రత్యామ్నాయం కాదు.',
  );

  // ── Disclaimer ─────────────────────────────────────────────────────────────
  String get disclaimer => _t(
    'This is an AI screening tool, not a medical diagnosis. Please consult a qualified doctor.',
    'यह एक AI स्क्रीनिंग टूल है, कोई डॉक्टरी निदान नहीं। कृपया किसी योग्य डॉक्टर से मिलें।',
    'இது ஒரு AI திரையிடல் கருவி, மருத்துவ நோயறிதல் அல்ல. தயவுசெய்து ஒரு தகுதிவாய்ந்த மருத்துவரை அணுகவும்.',
    'ఇది ఒక AI స్క్రీనింగ్ సాధనం, వైద్య నిర్ధారణ కాదు. దయచేసి అర్హత గల వైద్యుడిని సంప్రదించండి.',
  );

  // ── Errors ─────────────────────────────────────────────────────────────────
  String get errorGeneric      => _t('Something went wrong. Please try again.',
    'कुछ गलत हुआ। कृपया दोबारा कोशिश करें।',
    'ஏதோ தவறானது. மீண்டும் முயற்சிக்கவும்.',
    'ఏదో తప్పు జరిగింది. దయచేసి మళ్ళీ ప్రయత్నించండి.');
  String get errorNoImage      => _t('Please take or select a photo first.',
    'कृपया पहले एक फोटो लें या चुनें।',
    'முதலில் ஒரு புகைப்படம் எடுக்கவும் அல்லது தேர்ந்தெடுக்கவும்.',
    'దయచేసి ముందుగా ఒక ఫోటో తీయండి లేదా ఎంచుకోండి.');
  String get errorBackend      => _t('Backend unavailable. Using on-device AI.',
    'बैकएंड उपलब्ध नहीं। ऑन-डिवाइस AI उपयोग।',
    'பின்தள சேவை கிடைக்கவில்லை. சாதன AI பயன்படுத்தப்படுகிறது.',
    'బ్యాకెండ్ అందుబాటులో లేదు. ఆన్-డివైస్ AI ఉపయోగిస్తున్నారు.');
  String get errorPdfFailed    => _t('Could not generate report. Please try again.',
    'रिपोर्ट तैयार नहीं हो सकी। कृपया दोबारा कोशिश करें।',
    'அறிக்கை உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    'నివేదిక రూపొందించడం సాధ్యం కాలేదు. దయచేసి మళ్ళీ ప్రయత్నించండి.');

  // ── Loading ─────────────────────────────────────────────────────────────────
  String get loadingAnalyzing  => _t('Analyzing your image...',
    'आपकी तस्वीर की जांच हो रही है...',
    'உங்கள் படம் பகுப்பாய்வு செய்யப்படுகிறது...',
    'మీ చిత్రాన్ని విశ్లేషిస్తోంది...');
  String get loadingReport     => _t('Generating report...',
    'रिपोर्ट तैयार हो रही है...',
    'அறிக்கை உருவாக்கப்படுகிறது...',
    'నివేదిక రూపొందిస్తోంది...');

  // ── Actions ─────────────────────────────────────────────────────────────────
  String get actionCancel  => _t('Cancel', 'रद्द करें', 'ரத்து செய்',    'రద్దు చేయి');
  String get actionConfirm => _t('Confirm', 'पुष्टि करें', 'உறுதிப்படுத்து', 'నిర్ధారించు');
  String get actionOk      => _t('OK',     'ठीक है',    'சரி',           'సరే');

  // ── Splash Screen ──────────────────────────────────────────────────────────
  String get splashTagline => _t(
    'Early detection saves lives',
    'जल्दी जांच से जीवन बचता है',
    'ஆரம்ப கண்டறிதல் உயிர்களை காப்பாற்றுகிறது',
    'ముందస్తు గుర్తింపు జీవితాలను కాపాడుతుంది',
  );

  // ── TTS language codes ─────────────────────────────────────────────────────
  String get ttsLangCode => switch (langCode) {
    'hi' => 'hi-IN',
    'ta' => 'ta-IN',
    'te' => 'te-IN',
    _    => 'en-US',
  };

  // ── Language display names ─────────────────────────────────────────────────
  static const Map<String, String> langNames = {
    'en': 'English',
    'hi': 'हिंदी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
  };

  static const List<String> supportedLangs = ['en', 'hi', 'ta', 'te'];

  // ── Navigation (chat) ──────────────────────────────────────────────────────
  String get navChat => _t('Health Chat', 'स्वास्थ्य चैट', 'சுகாதார அரட்டை', 'ఆరోగ్య చాట్');

  // ── Chat Screen ────────────────────────────────────────────────────────────
  String get chatTitle       => _t('Health Assistant',       'स्वास्थ्य सहायक',       'சுகாதார உதவியாளர்',       'ఆరోగ్య సహాయకుడు');
  String get chatHint        => _t('Ask a health question…', 'स्वास्थ्य प्रश्न पूछें…', 'சுகாதார கேள்வி கேளுங்கள்…', 'ఆరోగ్య ప్రశ్న అడగండి…');
  String get chatWelcome     => _t(
    'Hello! I\'m your JanArogya Health Assistant. Ask me anything about your symptoms, health concerns, or when to see a doctor.',
    'नमस्ते! मैं आपका JanArogya स्वास्थ्य सहायक हूं। लक्षण, स्वास्थ्य चिंताएं, या डॉक्टर कब मिलें — कुछ भी पूछें।',
    'வணக்கம்! நான் உங்கள் JanArogya சுகாதார உதவியாளர். அறிகுறிகள், சுகாதார கவலைகள் பற்றி எதையும் கேளுங்கள்.',
    'నమస్కారం! నేను మీ JanArogya ఆరోగ్య సహాయకుడిని. లక్షణాలు, ఆరోగ్య సమస్యలు గురించి ఏదైనా అడగండి.',
  );
  String get chatThinking    => _t('Thinking…', 'सोच रहा हूं…', 'யோசிக்கிறேன்…', 'ఆలోచిస్తున్నాను…');
  String get chatDisclaimer  => _t(
    'AI assistant for general guidance only. Not a substitute for medical advice.',
    'केवल सामान्य मार्गदर्शन के लिए AI सहायक। चिकित्सा सलाह का विकल्प नहीं।',
    'பொது வழிகாட்டுதலுக்கு மட்டுமே AI உதவியாளர். மருத்துவ ஆலோசனைக்கு மாற்றாக இல்லை.',
    'సాధారణ మార్గదర్శకత్వం కోసం మాత్రమే AI సహాయకుడు. వైద్య సలహాకు ప్రత్యామ్నాయం కాదు.',
  );
  String get chatSuggestion1 => _t('What are early warning signs?', 'शुरुआती चेतावनी के संकेत क्या हैं?', 'ஆரம்ப எச்சரிக்கை அறிகுறிகள் என்ன?', 'ముందస్తు హెచ్చరిక సంకేతాలు ఏమిటి?');
  String get chatSuggestion2 => _t('When should I see a doctor?', 'डॉक्टर से कब मिलना चाहिए?', 'எப்போது மருத்துவரை சந்திக்க வேண்டும்?', 'వైద్యుడిని ఎప్పుడు చూడాలి?');
  String get chatSuggestion3 => _t('How to do self examination?', 'स्व-परीक्षण कैसे करें?', 'சுய பரிசோதனை எப்படி செய்வது?', 'స్వ-పరీక్ష ఎలా చేయాలి?');
  String get chatClear       => _t('Clear chat', 'चैट साफ करें', 'அரட்டையை அழி', 'చాట్ తొలగించు');

  // ── Dynamic questions ──────────────────────────────────────────────────────
  String get questionsLoading => _t(
    'Analyzing your photo to generate questions…',
    'प्रश्न बनाने के लिए तस्वीर का विश्लेषण हो रहा है…',
    'கேள்விகளை உருவாக்க புகைப்படம் பகுப்பாய்வு செய்யப்படுகிறது…',
    'ప్రశ్నలు రూపొందించడానికి ఫోటో విశ్లేషించబడుతోంది…',
  );

  // ── TTS ────────────────────────────────────────────────────────────────────
  String get ttsListen => _t('Listen', 'सुनें', 'கேளுங்கள்', 'వినండి');
  String get ttsStop   => _t('Stop',   'रोकें', 'நிறுத்து',  'ఆపు');

  // ── Patient Info Screen ────────────────────────────────────────────────────
  String get patientTitle      => _t('Who is this scan for?', 'यह जांच किसके लिए है?', 'இந்த ஸ்கேன் யாருக்கானது?', 'ఈ స్కాన్ ఎవరి కోసం?');
  String get patientMyself     => _t('Myself',          'मेरे लिए',        'என்னை',          'నా కోసం');
  String get patientMyselfSub  => _t('Use my saved details', 'मेरी सहेजी जानकारी', 'என் சேமித்த விவரங்கள்', 'నా సేవ్ వివరాలు');
  String get patientSomeoneElse    => _t('Someone Else',    'किसी और के लिए', 'வேறொருவர்',     'వేరే వ్యక్తి కోసం');
  String get patientSomeoneElseSub => _t('Enter their details', 'उनकी जानकारी भरें', 'அவர்களின் விவரங்களை உள்ளிடவும்', 'వారి వివరాలు నమోదు చేయండి');
  String get patientName       => _t('Full Name',        'पूरा नाम',        'முழு பெயர்',      'పూర్తి పేరు');
  String get patientAge        => _t('Age',              'आयु',             'வயது',            'వయసు');
  String get patientGender     => _t('Gender',           'लिंग',            'பாலினம்',         'లింగం');
  String get patientPhone      => _t('Phone (optional)', 'फोन (वैकल्पिक)', 'தொலைபேசி (விரும்பினால்)', 'ఫోన్ (ఐచ్ఛికం)');
  String get patientContinue   => _t('Continue',         'जारी रखें',       'தொடரவும்',        'కొనసాగించు');
  String get patientSaveInfo   => _t('Save my details for future scans', 'भविष्य की जांच के लिए मेरी जानकारी सहेजें', 'எதிர்கால ஸ்கேன்களுக்கு என் விவரங்களை சேமிக்கவும்', 'భవిష్యత్ స్కాన్‌ల కోసం నా వివరాలు సేవ్ చేయి');
  String get patientEditSaved  => _t('Edit saved details', 'सहेजी जानकारी बदलें', 'சேமித்த விவரங்களை திருத்து', 'సేవ్ వివరాలు సవరించు');
  String get patientNameRequired => _t('Please enter a name', 'कृपया नाम भरें', 'பெயரை உள்ளிடவும்', 'దయచేసి పేరు నమోదు చేయండి');
  String get patientAgeRequired  => _t('Please enter age', 'कृपया आयु भरें', 'வயதை உள்ளிடவும்', 'దయచేసి వయసు నమోదు చేయండి');
  String get patientMale       => _t('Male',   'पुरुष', 'ஆண்', 'పురుషుడు');
  String get patientFemale     => _t('Female', 'महिला', 'பெண்', 'స్త్రీ');
  String get patientOther      => _t('Other',  'अन्य',  'மற்றவை', 'ఇతరాలు');
  String get patientUsingSaved => _t('Using saved profile', 'सहेजी जानकारी का उपयोग', 'சேமித்த சுயவிவரம் பயன்படுத்தப்படுகிறது', 'సేవ్ చేసిన ప్రొఫైల్ ఉపయోగిస్తోంది');

  // ── Home Screen (extended) ─────────────────────────────────────────────────
  String get heroBadge        => _t('Free · No internet needed', 'मुफ्त · इंटरनेट जरूरी नहीं', 'இலவசம் · இணையம் தேவையில்லை', 'ఉచితం · ఇంటర్నెట్ అవసరం లేదు');
  String get heroLine1        => _t('Find it early.', 'जल्दी पता लगाएं।', 'விரைவில் கண்டறி.', 'ముందుగా కనుగొనండి.');
  String get heroLine2        => _t('Stay healthy.', 'स्वस्थ रहें।', 'ஆரோக்கியமாக இரு.', 'ఆరోగ్యంగా ఉండండి.');
  String get heroSub          => _t('Take a photo of your mouth or a mark on your skin. Our app checks it for you. Free. Takes less than a minute.', 'अपने मुँह या त्वचा की तस्वीर लें। हमारा ऐप जांच करेगा। एक मिनट से कम।', 'வாய் அல்லது தோல் படம் எடுக்கவும். ஆப் சோதனை செய்யும். ஒரு நிமிடத்திற்குள்.', 'నోటి లేదా చర్మం ఫోటో తీయండి. యాప్ తనిఖీ చేస్తుంది. ఒక నిమిషం లోపు.');
  String get statsTodayLabel  => _t('Checks today',  'आज की जांच',     'இன்று சோதனைகள்',   'నేటి తనిఖీలు');
  String get statsMouthLabel  => _t('Mouth check',   'मुँह जांच',       'வாய் சோதனை',         'నోటి తనిఖీ');
  String get statsSkinLabel   => _t('Skin check',    'त्वचा जांच',      'தோல் சோதனை',         'చర్మ తనిఖీ');
  String get ctaMouthTitle    => _t('Check my mouth', 'मुँह की जांच करें', 'என் வாயை சோதி', 'నోటిని తనిఖీ చేయి');
  String get ctaMouthSub      => _t('Lips, tongue, or inside your cheek. For people who chew tobacco or have a sore.', 'होंठ, जीभ या गाल के अंदर। तंबाकू चबाने वाले या घाव वालों के लिए।', 'உதடுகள், நாக்கு அல்லது கன்னத்தின் உள்ளே. புகையிலை மெல்பவர்களுக்கு.', 'పెదవులు, నాలుక లేదా చెంప లోపల. పొగాకు నమిలే వారికి.');
  String get ctaSkinTitle     => _t('Check my skin', 'त्वचा की जांच करें', 'என் தோலை சோதி', 'చర్మాన్ని తనిఖీ చేయి');
  String get ctaSkinSub       => _t('A mole, mark, or patch that has changed size, colour, or shape.', 'कोई तिल, धब्बा या निशान जो बदला हो।', 'மறுவாடிய அளவு, நிறம் அல்லது வடிவம் கொண்ட புள்ளி.', 'మారిన పరిమాణం, రంగు లేదా ఆకృతి కలిగిన మచ్చ.');
  String get ctaStart         => _t('Start', 'शुरू करें', 'தொடங்கு', 'ప్రారంభించు');
  String get reassureFree     => _t('Always free',     'हमेशा मुफ्त',    'எப்போதும் இலவசம்', 'ఎల్లప్పుడూ ఉచితం');
  String get reassureOffline  => _t('Works offline',   'ऑफलाइन काम करता', 'ஆஃப்லைனில் வேலை',  'ఆఫ్‌లైన్‌లో పనిచేస్తుంది');
  String get reassureLanguage => _t('Your language',   'आपकी भाषा',       'உங்கள் மொழி',     'మీ భాష');
  String get reassurePrivate  => _t('Stays private',   'गुप्त रहता है',   'தனிப்பட்டது',      'ప్రైవేట్‌గా ఉంటుంది');
  String get howItWorksLabel  => _t('How it works',    'यह कैसे काम करता', 'எப்படி வேலை செய்கிறது', 'ఇది ఎలా పనిచేస్తుంది');
  String get howItWorksTitle  => _t('Three small steps', 'तीन छोटे कदम', 'மூன்று சிறிய படிகள்', 'మూడు చిన్న దశలు');
  String get howItWorksSub    => _t("You don't need to read a lot. Just a phone and a photo.", 'ज्यादा पढ़ने की जरूरत नहीं। बस फोन और फोटो।', 'நிறைய படிக்க வேண்டியதில்லை. ஒரு போனும் படமும் போதும்.', 'ఎక్కువ చదవాల్సిన అవసరం లేదు. ఒక ఫోన్ మరియు ఫోటో.');
  String get step1Title       => _t('Take a photo',     'फोटो लें',          'புகைப்படம் எடு',     'ఫోటో తీయండి');
  String get step1Desc        => _t('Use any phone camera. Good light, close to the spot.', 'किसी भी कैमरे से। अच्छी रोशनी, जगह के पास।', 'எந்த கேமராவையும் பயன்படுத்து. நல்ல வெளிச்சம், புள்ளிக்கு அருகில்.', 'ఏదైనా ఫోన్ కెమెరా. మంచి వెలుతురు, మచ్చకు దగ్గరగా.');
  String get step2Title       => _t('We check it',     'हम जांच करते हैं', 'நாங்கள் சோதிக்கிறோம்', 'మేము తనిఖీ చేస్తాం');
  String get step2Desc        => _t('The app looks at the photo for signs that a doctor should see.', 'ऐप तस्वीर देखकर पता लगाता है कि डॉक्टर को दिखाना चाहिए या नहीं।', 'ஆப் படத்தை பார்த்து மருத்துவரை சந்திக்க வேண்டுமா என்று கூறுகிறது.', 'యాప్ ఫోటోను చూసి వైద్యుడిని చూడాలా అని చెబుతుంది.');
  String get step3Title       => _t('You get an answer', 'आपको जवाब मिलता है', 'நீங்கள் பதில் பெறுகிறீர்கள்', 'మీకు సమాధానం వస్తుంది');
  String get step3Desc        => _t('"Looks fine" or "Please see a doctor". In your language.', '"ठीक लगता है" या "डॉक्टर से मिलें"। आपकी भाषा में।', '"நன்றாக உள்ளது" அல்லது "மருத்துவரை சந்தி". உங்கள் மொழியில்.', '"బాగుంది" లేదా "వైద్యుడిని చూడండి". మీ భాషలో.');
  String get quoteText        => _t('"I saw my uncle use this in the village fair. The app told him to visit the hospital. The doctor said he caught it early."', '"मेरे चाचा ने गाँव के मेले में इसका उपयोग किया। ऐप ने अस्पताल जाने को कहा। डॉक्टर ने कहा जल्दी पकड़ लिया।"', '"எங்கள் சித்தப்பா கிராம திருவிழாவில் இதை பயன்படுத்தினார். மருத்துவர் சீக்கிரம் பிடித்துவிட்டோம் என்றார்."', '"నా మామ గ్రామ ఉత్సవంలో ఇది ఉపయోగించాడు. యాప్ ఆసుపత్రికి వెళ్లమంది. వైద్యుడు ముందే పట్టేశామన్నాడు."');
  String get quoteAttribution => _t('— A volunteer health worker, Satara district', '— एक स्वयंसेवी स्वास्थ्य कार्यकर्ता, सतारा', '— ஒரு தன்னார்வ சுகாதார பணியாளர், சதாரா', '— ఒక వాలంటీర్ ఆరోగ్య కార్యకర్త, సతారా');
  String get faqTitle         => _t('Things people ask', 'लोग जो पूछते हैं', 'மக்கள் கேட்பவை', 'జనాలు అడిగేవి');
  String get faq1Q            => _t('Is it really free?', 'क्या यह सच में मुफ्त है?', 'இது உண்மையில் இலவசமா?', 'ఇది నిజంగా ఉచితమా?');
  String get faq1A            => _t('Yes. No charges, no ads, no subscription. Ever. JanArogya is supported by the government and volunteer doctors.', 'हाँ। कोई शुल्क नहीं, कोई विज्ञापन नहीं। JanArogya सरकार और स्वयंसेवी डॉक्टरों द्वारा समर्थित।', 'ஆம். கட்டணம் இல்லை, விளம்பரம் இல்லை. அரசு மற்றும் தன்னார்வ மருத்துவர்களால் ஆதரிக்கப்படுகிறது.', 'అవును. ఛార్జీలు లేవు, ప్రకటనలు లేవు. ప్రభుత్వం మరియు వాలంటీర్ వైద్యులు మద్దతిస్తారు.');
  String get faq2Q            => _t('Will the doctor see my photo?', 'क्या डॉक्टर मेरी फोटो देखेंगे?', 'மருத்துவர் என் படத்தை பார்ப்பாரா?', 'వైద్యుడు నా ఫోటో చూస్తారా?');
  String get faq2A            => _t('Only if the app thinks something looks serious, and only with your permission. You are in control.', 'केवल यदि ऐप गंभीर लगे और आपकी अनुमति से। नियंत्रण आपका।', 'ஆப் தீவிரமாக கருதினால் மற்றும் உங்கள் அனுமதியுடன். கட்டுப்பாடு உங்கள்.', 'యాప్ తీవ్రంగా భావిస్తే మరియు మీ అనుమతితో మాత్రమే. నియంత్రణ మీది.');
  String get faq3Q            => _t('What if I don\'t have internet?', 'अगर इंटरनेट नहीं है तो?', 'இணையம் இல்லாவிட்டால் என்ன?', 'ఇంటర్నెట్ లేకపోతే?');
  String get faq3A            => _t('The check works on the phone itself, without internet. Your result is ready straight away.', 'जांच फोन पर ही होती है, बिना इंटरनेट। परिणाम तुरंत।', 'சோதனை போனிலேயே நடக்கும், இணையம் இல்லாமல். முடிவு உடனே தயார்.', 'తనిఖీ ఫోన్‌లోనే జరుగుతుంది, ఇంటర్నెట్ లేకుండా. ఫలితం వెంటనే.');
  String get faq4Q            => _t('Is this a replacement for a doctor?', 'क्या यह डॉक्टर का विकल्प है?', 'இது மருத்துவருக்கு மாற்றா?', 'ఇది వైద్యుడికి ప్రత్యామ్నాయమా?');
  String get faq4A            => _t('No. This is an early warning. If the result says "please see a doctor", please go to your nearest clinic.', 'नहीं। यह जल्दी चेतावनी है। यदि कहे "डॉक्टर से मिलें" तो नजदीकी क्लिनिक जाएं।', 'இல்லை. இது ஆரம்ப எச்சரிக்கை. "மருத்துவரை சந்தி" என்றால் கிளினிக்கு செல்லவும்.', 'కాదు. ఇది ముందస్తు హెచ్చరిక. "వైద్యుడిని చూడండి" అని చెబితే క్లినిక్‌కు వెళ్లండి.');
  String get faqStartFreeCheck => _t('Start a free check', 'मुफ्त जांच शुरू करें', 'இலவச சோதனையை தொடங்கு', 'ఉచిత తనిఖీ ప్రారంభించండి');

  // ── Scan Entry Screen ──────────────────────────────────────────────────────
  String get scanStep1Of3     => _t('Step 1 of 3',  'चरण 1/3', 'படி 1/3', 'దశ 1/3');
  String get scanStep2Of3     => _t('Step 2 of 3',  'चरण 2/3', 'படி 2/3', 'దశ 2/3');
  String get scanStep3Of3     => _t('Step 3 of 3',  'चरण 3/3', 'படி 3/3', 'దశ 3/3');
  String get scanWhatToCheck  => _t('What do you want to check?', 'आप क्या जांचना चाहते हैं?', 'எதை சோதிக்க விரும்புகிறீர்கள்?', 'మీరు ఏమి తనిఖీ చేయాలనుకుంటున్నారు?');
  String get scanPickOne      => _t('Pick one. You can check the other one later.', 'एक चुनें। दूसरा बाद में जांच सकते हैं।', 'ஒன்றை தேர்ந்தெடு. மற்றொன்றை பின்னர் சோதிக்கலாம்.', 'ఒకటి ఎంచుకోండి. మరొకటి తర్వాత తనిఖీ చేయవచ్చు.');
  String get scanPickMouth        => _t('My mouth', 'मेरा मुँह', 'என் வாய்', 'నా నోరు');
  String get scanPickMouthSub     => _t('Lips, tongue, inside cheek', 'होंठ, जीभ, गाल के अंदर', 'உதடு, நாக்கு, கன்னம்', 'పెదవి, నాలుక, చెంప');
  String get scanPickSkin         => _t('My skin', 'मेरी त्वचा', 'என் தோல்', 'నా చర్మం');
  String get scanPickSkinSub      => _t('A mark, mole or patch', 'निशान, तिल या धब्बा', 'அடையாளம், மறு அல்லது புள்ளி', 'మచ్చ, తిల లేదా మరక');
  String get scanNext             => _t('Next', 'आगे', 'அடுத்து', 'తర్వాత');
  String get scanBack             => _t('Back', 'पीछे', 'பின்', 'వెనుకకు');
  String get scanTakePhotoTitle   => _t('Take a photo', 'फोटो लें', 'புகைப்படம் எடு', 'ఫోటో తీయండి');
  String get scanTakePhotoSub     => _t('Bring the spot close. Use good light. You can also upload a photo.', 'जगह को पास लाएं। अच्छी रोशनी। फोटो अपलोड भी कर सकते हैं।', 'புள்ளியை அருகில் கொண்டுவா. நல்ல வெளிச்சம். படத்தை பதிவேற்றலாம்.', 'మచ్చను దగ్గరగా తీసుకురండి. మంచి వెలుతురు. ఫోటో అప్‌లోడ్ చేయవచ్చు.');
  String get scanTapToTake        => _t('Tap to take a photo', 'फोटो लेने के लिए दबाएं', 'புகைப்படம் எடுக்க தட்டு', 'ఫోటో తీయడానికి నొక్కండి');
  String get scanOrUpload         => _t('or choose a photo from your phone', 'या फोन से फोटो चुनें', 'அல்லது போனிலிருந்து படம் தேர்ந்தெடு', 'లేదా ఫోన్ నుండి ఫోటో ఎంచుకోండి');
  String get scanPhotoAdded       => _t('Photo added', 'फोटो जोड़ी गई', 'படம் சேர்க்கப்பட்டது', 'ఫోటో జోడించబడింది');
  String get scanChooseGallery    => _t('Choose from gallery', 'गैलरी से चुनें', 'தொகுப்பிலிருந்து தேர்ந்தெடு', 'గ్యాలరీ నుండి ఎంచుకోండి');
  String get scanTipsTitle        => _t('Tips for a clear photo', 'साफ फोटो के लिए सुझाव', 'தெளிவான படத்திற்கு குறிப்புகள்', 'స్పష్టమైన ఫోటో కోసం చిట్కాలు');
  String get scanTip1             => _t('Good daylight or a bright lamp', 'अच्छी दिन की रोशनी या तेज लैंप', 'நல்ல பகல் வெளிச்சம் அல்லது ஒளி விளக்கு', 'మంచి పగటి వెలుతురు లేదా ప్రకాశవంతమైన దీపం');
  String get scanTip2             => _t('Hold the phone 15–20 cm away', 'फोन 15–20 सेमी दूर रखें', 'போனை 15–20 செமீ தூரத்தில் வை', 'ఫోన్‌ను 15–20 సెం.మీ. దూరంలో ఉంచండి');
  String get scanTip3             => _t("Don't use filters or flash", 'फिल्टर या फ्लैश न लगाएं', 'ஃபில்டர் அல்லது ஃப்ளாஷ் பயன்படுத்தாதே', 'ఫిల్టర్ లేదా ఫ్లాష్ ఉపయోగించవద్దు');
  String get scanCheckMyPhoto     => _t('Check my photo', 'मेरी फोटो जांचें', 'என் படத்தை சோதி', 'నా ఫోటోను తనిఖీ చేయి');

  // ── Result Screen (extended) ───────────────────────────────────────────────
  String get resultAppbarTitle    => _t('Your result', 'आपका परिणाम', 'உங்கள் முடிவு', 'మీ ఫలితం');
  String get resultModelConfidence => _t('Model confidence', 'मॉडल का विश्वास', 'மாதிரி நம்பிக்கை', 'మోడల్ విశ్వాసం');
  String get resultWhatThisMeans  => _t('What this means', 'इसका मतलब', 'இதன் அர்த்தம்', 'దీని అర్థం');
  String get resultWhatToDoNext   => _t('What to do next', 'आगे क्या करें', 'அடுத்து என்ன செய்ய', 'తర్వాత ఏం చేయాలి');
  String get resultReportedSymptoms => _t('Reported symptoms', 'बताए गए लक्षण', 'புகாரளிக்கப்பட்ட அறிகுறிகள்', 'నివేదించిన లక్షణాలు');
  String get resultLowHeadline   => _t('Looks fine', 'ठीक लगता है', 'நன்றாக உள்ளது', 'బాగుంది');
  String get resultLowSub        => _t('No signs of concern were found.', 'चिंता का कोई कारण नहीं मिला।', 'கவலைப்பட எதுவும் இல்லை.', 'ఆందోళన చెందే ఏదీ కనుగొనబడలేదు.');
  String get resultHighHeadline  => _t('Please see a doctor', 'डॉक्टर से मिलें', 'மருத்துவரை சந்திக்கவும்', 'వైద్యుడిని కలవండి');
  String get resultHighSub       => _t('Something needs a closer look.', 'किसी चीज़ की बारीकी से जांच जरूरी है।', 'ஏதோ நெருக்கமாக பார்க்க வேண்டும்.', 'ఏదో దగ్గరగా చూడాలి.');
  String get resultInvalidHeadline => _t('Photo unclear', 'तस्वीर साफ नहीं', 'படம் தெளிவாக இல்லை', 'ఫోటో స్పష్టంగా లేదు');
  String get resultInvalidSub    => _t('Retake in good light and try again.', 'अच्छी रोशनी में फिर से लें।', 'நல்ல வெளிச்சத்தில் மீண்டும் எடுக்கவும்.', 'మంచి వెలుతురులో మళ్ళీ తీయండి.');
  String get resultOralScreening => _t('Oral screening', 'मुँह की जांच', 'வாய் திரையிடல்', 'నోటి స్క్రీనింగ్');
  String get resultSkinScreening => _t('Skin screening', 'त्वचा की जांच', 'தோல் திரையிடல்', 'చర్మ స్క్రీనింగ్');
  String get nextStep1Title   => _t('Visit a doctor', 'डॉक्टर से मिलें', 'மருத்துவரை சந்தி', 'వైద్యుడిని కలవండి');
  String get nextStep1Desc    => _t('Show them this result screen or download the PDF report.', 'उन्हें यह परिणाम स्क्रीन या PDF रिपोर्ट दिखाएं।', 'இந்த முடிவு திரை அல்லது PDF அறிக்கையை காட்டுங்கள்.', 'ఈ ఫలిత స్క్రీన్ లేదా PDF నివేదికను చూపండి.');
  String get nextStep2Title   => _t('Find a free clinic', 'मुफ्त क्लिनिक खोजें', 'இலவச கிளினிக் கண்டறி', 'ఉచిత క్లినిక్ కనుగొనండి');
  String get nextStep2Desc    => _t('Government centres offer free cancer checks near you.', 'सरकारी केंद्र आपके पास मुफ्त कैंसर जांच देते हैं।', 'அரசு மையங்கள் இலவச புற்றுநோய் சோதனை வழங்குகின்றன.', 'ప్రభుత్వ కేంద్రాలు ఉచిత క్యాన్సర్ తనిఖీలు అందిస్తాయి.');
  String get nextStep3Title   => _t('Download your report', 'अपनी रिपोर्ट डाउनलोड करें', 'உங்கள் அறிக்கையை பதிவிறக்கு', 'మీ నివేదికను డౌన్‌లోడ్ చేయండి');
  String get nextStep3Desc    => _t('Save a PDF to share with any doctor or health worker.', 'किसी भी डॉक्टर के साथ साझा करने के लिए PDF सहेजें।', 'எந்த மருத்துவருடனும் பகிர PDF சேமி.', 'ఏ వైద్యుడితో అయినా పంచుకోవడానికి PDF సేవ్ చేయండి.');

  // ── Chat Screen (extended) ─────────────────────────────────────────────────
  String get chatHeaderTitle  => _t('AI Health Assistant', 'AI स्वास्थ्य सहायक', 'AI சுகாதார உதவியாளர்', 'AI ఆరోగ్య సహాయకుడు');
  String get chatTryAsking    => _t('Try asking:', 'यह पूछें:', 'இதைக் கேள்:', 'ఇది అడగండి:');

  // ── Clinics Screen ─────────────────────────────────────────────────────────
  String get clinicsTitle      => _t('Nearest clinics', 'नजदीकी क्लिनिक', 'அருகிலுள்ள கிளினிக்குகள்', 'దగ్గరి క్లినిక్‌లు');
  String get clinicsSubtitle   => _t('Free and subsidised centres near you', 'आपके पास मुफ्त और सब्सिडी केंद्र', 'அருகிலுள்ள இலவச மையங்கள்', 'మీ సమీపంలో ఉచిత కేంద్రాలు');
  String get clinicsSearchHint => _t('Search by village or district', 'गाँव या जिले से खोजें', 'கிராமம் அல்லது மாவட்டத்தால் தேடு', 'గ్రామం లేదా జిల్లా ద్వారా శోధించండి');
  String get clinicsYouLabel   => _t('You', 'आप', 'நீங்கள்', 'మీరు');
  String get clinicsDirections => _t('Directions', 'दिशा', 'வழி', 'దిశలు');
  String get clinicsCall       => _t('Call', 'कॉल', 'அழை', 'కాల్');

  // ── Community Screen ───────────────────────────────────────────────────────
  String get communityTitle    => _t('Community Insights', 'समुदाय की जानकारी', 'சமூக நுண்ணறிவுகள்', 'సంఘం అంతర్దృష్టులు');
  String get communitySubtitle => _t('Area-level screening risk data', 'क्षेत्र-स्तरीय जोखिम डेटा', 'பகுதி-நிலை ஆபத்து தரவு', 'ప్రాంత-స్థాయి ప్రమాద డేటా');
  String get kpiTotalScans     => _t('Total Scans', 'कुल जांच', 'மொத்த ஸ்கேன்கள்', 'మొత్తం స్కాన్‌లు');
  String get kpiHighRiskAreas  => _t('High-Risk Areas', 'अधिक जोखिम क्षेत्र', 'அதிக ஆபத்து பகுதிகள்', 'అధిక ప్రమాద ప్రాంతాలు');
  String get kpiCampsNeeded    => _t('Camps Needed', 'शिविर चाहिए', 'முகாம்கள் தேவை', 'శిబిరాలు అవసరం');
  String get screeningCampsRecommended => _t('Screening Camps Recommended', 'जांच शिविर की सिफारिश', 'திரையிடல் முகாம்கள் பரிந்துரைக்கப்படுகின்றன', 'స్క్రీనింగ్ శిబిరాలు సిఫార్సు చేయబడ్డాయి');
  String get riskZonesTitle    => _t('Risk Zones', 'जोखिम क्षेत्र', 'ஆபத்து மண்டலங்கள்', 'ప్రమాద జోన్‌లు');
  String get areaDetailsTitle  => _t('Area Details', 'क्षेत्र विवरण', 'பகுதி விவரங்கள்', 'ప్రాంత వివరాలు');
  String get communityNoData     => _t('No community data yet.', 'अभी कोई डेटा नहीं', 'இதுவரை சமூக தரவு இல்லை', 'ఇంకా కమ్యూనిటీ డేటా లేదు');
  String get communityNoDataHint => _t('Scan with location enabled to populate the map.', 'मैप भरने के लिए स्थान चालू करके जांचें।', 'வரைபடம் நிரப்ப இடம் இயக்கி ஸ்கேன் செய்யவும்.', 'మ్యాప్ నింపడానికి లొకేషన్ ఆన్ చేసి స్కాన్ చేయండి.');
  String get statTotalLabel    => _t('Total', 'कुल', 'மொத்தம்', 'మొత్తం');
  String get statHighRiskLabel => _t('High Risk', 'अधिक जोखिम', 'அதிக ஆபத்து', 'అధిక ప్రమాదం');

  // ── Scan Screen (cloud fallback notice) ────────────────────────────────────
  String get cloudUnavailable  => _t('Cloud AI unavailable — using on-device result', 'क्लाउड AI उपलब्ध नहीं — डिवाइस पर परिणाम', 'கிளவுட் கிடைக்கவில்லை — சாதனத்தில் முடிவு', 'క్లౌడ్ AI అందుబాటులో లేదు — డివైస్ ఫలితం');

  // ── Settings (extended) ────────────────────────────────────────────────────
  String get tollFree247       => _t('Toll-Free 24/7', 'टोल-फ्री 24/7', 'கட்டணமில்லா 24/7', 'టోల్-ఫ్రీ 24/7');
  String get historyClearedMsg => _t('History cleared', 'इतिहास साफ हुआ', 'வரலாறு அழிக்கப்பட்டது', 'చరిత్ర తొలగించబడింది');

  // ── Login Screen ───────────────────────────────────────────────────────────
  String get loginWelcome     => _t('Welcome', 'स्वागत है', 'வரவேற்கிறோம்', 'స్వాగతం');
  String get loginSubtitle    => _t(
    'Sign in to save your screening history and reports securely.',
    'अपनी जांच का इतिहास और रिपोर्ट सुरक्षित रखने के लिए साइन इन करें।',
    'உங்கள் சோதனை வரலாறு மற்றும் அறிக்கைகளை பாதுகாப்பாக சேமிக்க உள்நுழையவும்.',
    'మీ స్క్రీనింగ్ చరిత్ర మరియు నివేదికలను సురక్షితంగా సేవ్ చేయడానికి సైన్ ఇన్ చేయండి.',
  );
  String get loginContinueGoogle => _t('Continue with Google', 'Google से जारी रखें', 'Google உடன் தொடரவும்', 'Googleతో కొనసాగించండి');
  String get loginPrivacy     => _t(
    'We only use your email to identify you. Your scans stay on your phone.',
    'हम केवल पहचान के लिए आपका ईमेल उपयोग करते हैं। आपकी जांच आपके फोन पर ही रहती है।',
    'அடையாளத்திற்காக மட்டுமே உங்கள் மின்னஞ்சலை பயன்படுத்துகிறோம். ஸ்கேன்கள் உங்கள் போனிலேயே இருக்கும்.',
    'మిమ్మల్ని గుర్తించడానికి మాత్రమే మీ ఇమెయిల్‌ను ఉపయోగిస్తాం. మీ స్కాన్‌లు మీ ఫోన్‌లోనే ఉంటాయి.',
  );
  String get loginSigningIn   => _t('Signing in…', 'साइन इन हो रहा है…', 'உள்நுழைகிறது…', 'సైన్ ఇన్ అవుతోంది…');
  String get loginFailed        => _t('Sign-in failed. Please try again.', 'साइन इन विफल। दोबारा कोशिश करें।', 'உள்நுழைவு தோல்வி. மீண்டும் முயற்சிக்கவும்.', 'సైన్ ఇన్ విఫలమైంది. మళ్ళీ ప్రయత్నించండి.');
  String get loginContinueGuest => _t('Continue as Guest', 'अतिथि के रूप में जारी रखें', 'விருந்தினராக தொடரவும்', 'అతిథిగా కొనసాగించండి');
  String get signOut          => _t('Sign out', 'साइन आउट', 'வெளியேறு', 'సైన్ అవుట్');
  String get signOutConfirm   => _t('Sign out of JanArogya?', 'JanArogya से साइन आउट करें?', 'JanArogyaவிலிருந்து வெளியேறவா?', 'JanArogyaలో నుండి సైన్ అవుట్ చేయాలా?');
  String get account          => _t('Account', 'खाता', 'கணக்கு', 'ఖాతా');
}
