import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import 'scan_entry_screen.dart';
import 'clinics_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: _buildAppBar(context, lang),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _HeroSection(lang: lang),
            _DualCtaSection(lang: lang),
            _ReassureStrip(lang: lang),
            _HowItWorksSection(lang: lang),
            _QuoteBand(),
            _FaqSection(lang: lang),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context, String lang) {
    return AppBar(
      backgroundColor: JaColors.surface,
      elevation: 0,
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: JaColors.line),
      ),
      title: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color: JaColors.brand, borderRadius: BorderRadius.circular(9),
          ),
          child: const Icon(Icons.favorite, color: Colors.white, size: 18),
        ),
        const SizedBox(width: 10),
        Text.rich(TextSpan(children: [
          TextSpan(text: 'Jan', style: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w800, color: JaColors.ink)),
          TextSpan(text: 'Arogya', style: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w800, color: JaColors.brand)),
        ])),
      ]),
      actions: [
        _LangToggle(lang: lang),
        const SizedBox(width: 8),
      ],
    );
  }
}

// ── Hero ──────────────────────────────────────────────────────────────────────
class _HeroSection extends StatelessWidget {
  final String lang;
  const _HeroSection({required this.lang});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 40, 24, 40),
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(-0.8, -0.8),
          radius: 1.2,
          colors: [JaColors.brandSoft, JaColors.bg],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
            decoration: BoxDecoration(
              color: JaColors.brandSoft,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.favorite, color: JaColors.brand, size: 14),
              const SizedBox(width: 6),
              Text('Free · No internet needed',
                  style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.brandDark)),
            ]),
          ),
          const SizedBox(height: 20),
          Text.rich(TextSpan(children: [
            TextSpan(text: _t(lang, 'heroLine1'), style: GoogleFonts.nunito(fontSize: 38, fontWeight: FontWeight.w800, color: JaColors.ink, height: 1.05)),
            TextSpan(text: '\n'),
            TextSpan(text: _t(lang, 'heroLine2'), style: GoogleFonts.nunito(fontSize: 38, fontWeight: FontWeight.w800, color: JaColors.brand, height: 1.05)),
          ])),
          const SizedBox(height: 16),
          Text(_t(lang, 'heroSub'),
              style: GoogleFonts.notoSans(fontSize: 17, color: JaColors.inkSoft, height: 1.55)),
          const SizedBox(height: 28),
          // Stats row
          Row(children: [
            _StatTile(value: '1,418', label: 'Checks today', bg: JaColors.brandSoft),
            const SizedBox(width: 12),
            _StatTile(value: '20s', label: 'Mouth check', bg: JaColors.accentSoft),
            const SizedBox(width: 12),
            _StatTile(value: '30s', label: 'Skin check', bg: JaColors.warnSoft),
          ]),
        ],
      ),
    );
  }

  String _t(String lang, String key) {
    const strings = {
      'en': {'heroLine1': 'Find it early.', 'heroLine2': 'Stay healthy.', 'heroSub': 'Take a photo of your mouth or a mark on your skin. Our app checks it for you. Free. Takes less than a minute.'},
      'hi': {'heroLine1': 'जल्दी पता लगाएं।', 'heroLine2': 'स्वस्थ रहें।', 'heroSub': 'अपने मुँह या त्वचा की तस्वीर लें। हमारा ऐप जांच करेगा।'},
      'ta': {'heroLine1': 'உடன் கண்டறி।', 'heroLine2': 'ஆரோக்கியமாக இரு।', 'heroSub': 'வாய் அல்லது தோல் படம் எடுக்கவும். ஆப் சோதனை செய்யும்.'},
      'te': {'heroLine1': 'ముందుగా కనుగొనండి.', 'heroLine2': 'ఆరోగ్యంగా ఉండండి.', 'heroSub': 'నోటి లేదా చర్మం ఫోటో తీయండి. యాప్ తనిఖీ చేస్తుంది.'},
    };
    return (strings[lang] ?? strings['en']!)[key] ?? '';
  }
}

class _StatTile extends StatelessWidget {
  final String value, label;
  final Color bg;
  const _StatTile({required this.value, required this.label, required this.bg});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
          const SizedBox(height: 2),
          Text(label, style: GoogleFonts.notoSans(fontSize: 11, fontWeight: FontWeight.w600, color: JaColors.inkSoft, letterSpacing: 0.3)),
        ]),
      ),
    );
  }
}

// ── Dual CTA ──────────────────────────────────────────────────────────────────
class _DualCtaSection extends StatelessWidget {
  final String lang;
  const _DualCtaSection({required this.lang});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 32, 20, 8),
      child: Column(children: [
        _CtaCard(
          icon: Icons.sentiment_satisfied_alt_outlined,
          iconBg: JaColors.brandSoft,
          iconColor: JaColors.brand,
          title: _t(lang, 'mouth'),
          subtitle: 'Lips, tongue, or inside your cheek. For people who chew tobacco or have a sore.',
          arrowColor: JaColors.brand,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScanEntryScreen(initialType: 'mouth'))),
        ),
        const SizedBox(height: 16),
        _CtaCard(
          icon: Icons.wb_sunny_outlined,
          iconBg: JaColors.accentSoft,
          iconColor: JaColors.accent,
          title: _t(lang, 'skin'),
          subtitle: 'A mole, mark, or patch that has changed size, colour, or shape.',
          arrowColor: JaColors.accent,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScanEntryScreen(initialType: 'skin'))),
        ),
      ]),
    );
  }

  String _t(String lang, String key) {
    const s = {
      'en': {'mouth': 'Check my mouth', 'skin': 'Check my skin'},
      'hi': {'mouth': 'मुँह की जांच', 'skin': 'त्वचा की जांच'},
      'ta': {'mouth': 'வாய் சோதனை', 'skin': 'தோல் சோதனை'},
      'te': {'mouth': 'నోటి చెక్', 'skin': 'చర్మం చెక్'},
    };
    return (s[lang] ?? s['en']!)[key] ?? '';
  }
}

class _CtaCard extends StatelessWidget {
  final IconData icon;
  final Color iconBg, iconColor, arrowColor;
  final String title, subtitle;
  final VoidCallback onTap;
  const _CtaCard({required this.icon, required this.iconBg, required this.iconColor, required this.arrowColor, required this.title, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: JaColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: JaColors.line, width: 1.5),
          boxShadow: JaColors.cardShadow,
        ),
        child: Row(children: [
          Container(
            width: 72, height: 72,
            decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(18)),
            child: Icon(icon, color: iconColor, size: 36),
          ),
          const SizedBox(width: 18),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(title, style: GoogleFonts.nunito(fontSize: 22, fontWeight: FontWeight.w800, color: JaColors.ink)),
            const SizedBox(height: 4),
            Text(subtitle, style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.inkSoft, height: 1.4)),
            const SizedBox(height: 10),
            Row(children: [
              Text('Start', style: GoogleFonts.notoSans(fontSize: 14, fontWeight: FontWeight.w700, color: arrowColor)),
              const SizedBox(width: 4),
              Icon(Icons.arrow_forward, size: 16, color: arrowColor),
            ]),
          ])),
        ]),
      ),
    );
  }
}

// ── Reassure strip ────────────────────────────────────────────────────────────
class _ReassureStrip extends StatelessWidget {
  final String lang;
  const _ReassureStrip({required this.lang});

  @override
  Widget build(BuildContext context) {
    final items = [
      (Icons.currency_rupee, 'Always free'),
      (Icons.wifi_off, 'Works offline'),
      (Icons.language, 'Your language'),
      (Icons.lock_outline, 'Stays private'),
    ];
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(20, 24, 20, 0),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: JaColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: JaColors.line),
      ),
      child: Wrap(
        spacing: 12, runSpacing: 12,
        children: items.map((item) => _ReassureChip(icon: item.$1, label: item.$2)).toList(),
      ),
    );
  }
}

class _ReassureChip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _ReassureChip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(color: JaColors.brandSoft, borderRadius: BorderRadius.circular(999)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: JaColors.brand, size: 16),
        const SizedBox(width: 6),
        Text(label, style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w600, color: JaColors.brandDark)),
      ]),
    );
  }
}

// ── How it works ──────────────────────────────────────────────────────────────
class _HowItWorksSection extends StatelessWidget {
  final String lang;
  const _HowItWorksSection({required this.lang});

  @override
  Widget build(BuildContext context) {
    final steps = [
      (Icons.camera_alt_outlined, 'Take a photo', 'Use any phone camera. Good light, close to the spot.', JaColors.brandSoft, JaColors.brand),
      (Icons.search, 'We check it', 'The app looks at the photo for signs that a doctor should see.', JaColors.accentSoft, JaColors.accent),
      (Icons.check_circle_outline, 'You get an answer', '"Looks fine" or "Please see a doctor". In your language.', JaColors.warnSoft, JaColors.warn),
    ];
    return Container(
      color: JaColors.surface,
      padding: const EdgeInsets.fromLTRB(20, 48, 20, 48),
      margin: const EdgeInsets.only(top: 28),
      child: Column(children: [
        Text('How it works', style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.brand, letterSpacing: 1.0)),
        const SizedBox(height: 8),
        Text('Three small steps', style: GoogleFonts.nunito(fontSize: 30, fontWeight: FontWeight.w800, color: JaColors.ink)),
        const SizedBox(height: 6),
        Text("You don't need to read a lot. Just a phone and a photo.",
            textAlign: TextAlign.center,
            style: GoogleFonts.notoSans(fontSize: 16, color: JaColors.inkSoft)),
        const SizedBox(height: 32),
        ...steps.asMap().entries.map((e) => Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _StepRow(num: e.key + 1, icon: e.value.$1, title: e.value.$2, desc: e.value.$3, bg: e.value.$4, color: e.value.$5),
        )),
      ]),
    );
  }
}

class _StepRow extends StatelessWidget {
  final int num;
  final IconData icon;
  final String title, desc;
  final Color bg, color;
  const _StepRow({required this.num, required this.icon, required this.title, required this.desc, required this.bg, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(color: JaColors.bg, borderRadius: BorderRadius.circular(16), border: Border.all(color: JaColors.line)),
      child: Row(children: [
        Container(
          width: 64, height: 64,
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(18)),
          child: Icon(icon, color: color, size: 30),
        ),
        const SizedBox(width: 16),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 24, height: 24,
              decoration: BoxDecoration(color: JaColors.brand, shape: BoxShape.circle),
              child: Center(child: Text('$num', style: GoogleFonts.nunito(fontSize: 13, fontWeight: FontWeight.w800, color: Colors.white))),
            ),
            const SizedBox(width: 8),
            Text(title, style: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700, color: JaColors.ink)),
          ]),
          const SizedBox(height: 4),
          Text(desc, style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.inkSoft, height: 1.4)),
        ])),
      ]),
    );
  }
}

// ── Quote band ────────────────────────────────────────────────────────────────
class _QuoteBand extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: JaColors.brand,
      padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 48),
      child: Column(children: [
        Text(
          '"I saw my uncle use this in the village fair. The app told him to visit the hospital. The doctor said he caught it early."',
          textAlign: TextAlign.center,
          style: GoogleFonts.nunito(fontSize: 22, fontWeight: FontWeight.w700, color: Colors.white, height: 1.4),
        ),
        const SizedBox(height: 14),
        Text('— A volunteer health worker, Satara district',
            style: GoogleFonts.notoSans(fontSize: 14, color: Colors.white70, fontWeight: FontWeight.w500)),
      ]),
    );
  }
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
class _FaqSection extends StatelessWidget {
  final String lang;
  const _FaqSection({required this.lang});

  @override
  Widget build(BuildContext context) {
    final faqs = [
      ('Is it really free?', 'Yes. No charges, no ads, no subscription. Ever. JanArogya is supported by the government and volunteer doctors.'),
      ('Will the doctor see my photo?', 'Only if the app thinks something looks serious, and only with your permission. You are in control.'),
      ('What if I don\'t have internet?', 'The check works on the phone itself, without internet. Your result is ready straight away.'),
      ('Is this a replacement for a doctor?', 'No. This is an early warning. If the result says "please see a doctor", please go to your nearest clinic.'),
    ];
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 40, 20, 20),
      child: Column(children: [
        Text('Things people ask', style: GoogleFonts.nunito(fontSize: 28, fontWeight: FontWeight.w800, color: JaColors.ink)),
        const SizedBox(height: 24),
        ...faqs.map((faq) => _FaqItem(q: faq.$1, a: faq.$2)),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ScanEntryScreen())),
            icon: const Icon(Icons.camera_alt),
            label: const Text('Start a free check'),
            style: ElevatedButton.styleFrom(
              backgroundColor: JaColors.brand,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 18),
              textStyle: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w700),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
      ]),
    );
  }
}

class _FaqItem extends StatefulWidget {
  final String q, a;
  const _FaqItem({required this.q, required this.a});
  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _open = false;
  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => setState(() => _open = !_open),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: JaColors.surface, borderRadius: BorderRadius.circular(14),
          border: Border.all(color: _open ? JaColors.brand : JaColors.line),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(widget.q, style: GoogleFonts.notoSans(fontSize: 17, fontWeight: FontWeight.w700, color: _open ? JaColors.brand : JaColors.ink))),
            Icon(_open ? Icons.remove : Icons.add, color: JaColors.brand, size: 22),
          ]),
          if (_open) ...[
            const SizedBox(height: 10),
            Text(widget.a, style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft, height: 1.5)),
          ],
        ]),
      ),
    );
  }
}

// ── Language toggle ───────────────────────────────────────────────────────────
class _LangToggle extends StatelessWidget {
  final String lang;
  const _LangToggle({required this.lang});

  @override
  Widget build(BuildContext context) {
    final langs = ['en', 'hi', 'ta', 'te'];
    final labels = {'en': 'EN', 'hi': 'HI', 'ta': 'TA', 'te': 'TE'};
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: JaColors.bg, borderRadius: BorderRadius.circular(999), border: Border.all(color: JaColors.line)),
      child: Row(mainAxisSize: MainAxisSize.min, children: langs.map((l) {
        final on = lang == l;
        return GestureDetector(
          onTap: () => context.read<AppProvider>().setLanguage(l),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: on ? JaColors.brand : Colors.transparent, borderRadius: BorderRadius.circular(999)),
            child: Text(labels[l]!, style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: on ? Colors.white : JaColors.inkSoft)),
          ),
        );
      }).toList()),
    );
  }
}
