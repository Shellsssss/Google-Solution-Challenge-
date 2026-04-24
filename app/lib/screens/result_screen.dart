import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:open_file/open_file.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../l10n/app_strings.dart';
import '../models/patient_info.dart';
import '../models/scan_result.dart';
import '../providers/app_provider.dart';
import '../services/api_service.dart';
import '../services/database_service.dart';
import '../services/tts_service.dart';
import '../theme/app_theme.dart';

class ResultScreen extends StatefulWidget {
  final Uint8List    imageBytes;
  final ScanResult   result;
  final PatientInfo? patientInfo;

  const ResultScreen({
    super.key,
    required this.imageBytes,
    required this.result,
    this.patientInfo,
  });

  @override
  State<ResultScreen> createState() => _ResultScreenState();
}

class _ResultScreenState extends State<ResultScreen> {
  bool _speaking     = false;
  bool _loadingPdf   = false;
  bool _loadingShare = false;

  @override
  void initState() {
    super.initState();
    _saveLocally();
    TtsService().onStart = () { if (mounted) setState(() => _speaking = true);  };
    TtsService().onStop  = () { if (mounted) setState(() => _speaking = false); };
  }

  @override
  void dispose() {
    TtsService().stop();
    TtsService().onStart = null;
    TtsService().onStop  = null;
    super.dispose();
  }

  Future<void> _saveLocally() async {
    try { await DatabaseService().saveScan(widget.result); } catch (_) {}
  }

  Future<void> _toggleTts() async {
    final lang = context.read<AppProvider>().langCode;
    if (_speaking) {
      await TtsService().stop();
    } else {
      await TtsService().speak(widget.result.explanationFor(lang), langCode: lang);
    }
  }

  Future<void> _openMaps() async {
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=cancer+screening+hospital+near+me',
    );
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  Map<String, dynamic> _buildPayload(String lang) {
    final result  = widget.result;
    final patient = widget.patientInfo;
    return {
      'scan_type':          result.scanType.name,
      'risk_level':         result.riskKey,
      'confidence':         result.confidence,
      'explanation_en':     result.explanationEn,
      'explanation_local':  result.explanationFor(lang),
      'local_language':     lang,
      'concern':            _concernText(result.riskLevel, lang),
      'image_base64':       base64Encode(widget.imageBytes),
      if (patient != null) ...{
        'user_name':    patient.name,
        'phone_masked': patient.phoneMasked,
      },
      if (result.symptoms != null && result.symptoms!.isNotEmpty)
        'questions_and_answers': result.symptoms!.entries
            .map((e) => {'question': e.key, 'answer': e.value})
            .toList(),
    };
  }

  Future<File?> _generateAndDownloadPdf(String lang) async {
    final s    = AppStrings(lang);
    final resp = await ApiService().generateReport(_buildPayload(lang));
    if (resp == null || resp['success'] != true) {
      _showSnack(s.errorPdfFailed);
      return null;
    }
    final reportId = resp['report_id'] as String;
    final bytes    = await ApiService().downloadReport(reportId);
    if (bytes == null) { _showSnack(s.errorPdfFailed); return null; }

    final dir      = await getTemporaryDirectory();
    final filename = resp['filename'] as String? ?? 'JanArogya_Report.pdf';
    final file     = File('${dir.path}/$filename');
    await file.writeAsBytes(bytes);
    return file;
  }

  Future<void> _downloadReport() async {
    setState(() => _loadingPdf = true);
    try {
      final lang = context.read<AppProvider>().langCode;
      final file = await _generateAndDownloadPdf(lang);
      if (file != null) await OpenFile.open(file.path);
    } catch (_) {
      if (mounted) {
        _showSnack(AppStrings(context.read<AppProvider>().langCode).errorPdfFailed);
      }
    } finally {
      if (mounted) setState(() => _loadingPdf = false);
    }
  }

  Future<void> _shareReport() async {
    setState(() => _loadingShare = true);
    try {
      final lang = context.read<AppProvider>().langCode;
      final file = await _generateAndDownloadPdf(lang);
      if (file != null) {
        await Share.shareXFiles(
          [XFile(file.path)],
          subject: 'JanArogya Screening Report',
          text: 'Screening result from JanArogya — shared for medical reference.',
        );
      }
    } catch (_) {
      if (mounted) {
        _showSnack(AppStrings(context.read<AppProvider>().langCode).errorPdfFailed);
      }
    } finally {
      if (mounted) setState(() => _loadingShare = false);
    }
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  String _concernText(RiskLevel risk, String lang) {
    final texts = {
      RiskLevel.low: {
        'en': 'No immediate action required. Continue regular health checkups.',
        'hi': 'तत्काल कार्रवाई आवश्यक नहीं है। नियमित स्वास्थ्य जांच जारी रखें।',
        'ta': 'உடனடி நடவடிக்கை தேவையில்லை. வழக்கமான சுகாதார பரிசோதனைகளை தொடரவும்.',
        'te': 'తక్షణ చర్య అవసరం లేదు. సాధారణ ఆరోగ్య తనిఖీలు కొనసాగించండి.',
      },
      RiskLevel.high: {
        'en': 'Please consult a doctor as soon as possible. Early consultation is important.',
        'hi': 'कृपया जल्द से जल्द डॉक्टर से मिलें। जल्दी परामर्श जरूरी है।',
        'ta': 'விரைவில் மருத்துவரை அணுகவும். ஆரம்ப ஆலோசனை முக்கியம்.',
        'te': 'వీలైనంత త్వరగా వైద్యుడిని సంప్రదించండి. ముందస్తు సంప్రదింపు ముఖ్యమైనది.',
      },
      RiskLevel.invalid: {
        'en': 'The image quality was insufficient. Please retake the photo in good lighting.',
        'hi': 'तस्वीर की गुणवत्ता अपर्याप्त थी। कृपया अच्छी रोशनी में फिर से लें।',
        'ta': 'படத்தின் தரம் போதுமானதாக இல்லை. நல்ல வெளிச்சத்தில் மீண்டும் எடுக்கவும்.',
        'te': 'చిత్రం నాణ్యత సరిపోలేదు. మంచి వెలుతురులో తిరిగి తీయండి.',
      },
    };
    return texts[risk]?[lang] ?? texts[risk]?['en'] ?? '';
  }

  @override
  Widget build(BuildContext context) {
    final lang   = context.watch<AppProvider>().langCode;
    final s      = AppStrings(lang);
    final result = widget.result;

    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: AppBar(
        title: Text('Your result',
            style: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w800, color: JaColors.ink)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.popUntil(context, (r) => r.isFirst),
        ),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: JaColors.line),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 600),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // ── Result hero card ───────────────────────────────────────
              _ResultHero(result: result),
              const SizedBox(height: 20),

              // ── Confidence bar ─────────────────────────────────────────
              if (result.riskLevel != RiskLevel.invalid) ...[
                _ConfidenceBar(confidence: result.confidence),
                const SizedBox(height: 20),
              ],

              // ── Explanation ────────────────────────────────────────────
              _ExplanationCard(
                text: result.explanationFor(lang),
                speaking: _speaking,
                onTts: _toggleTts,
              ),
              const SizedBox(height: 16),

              // ── Next steps (high risk only) ────────────────────────────
              if (result.riskLevel == RiskLevel.high) ...[
                _NextStepsCard(onFindClinic: _openMaps),
                const SizedBox(height: 16),
              ],

              // ── Symptoms summary ───────────────────────────────────────
              if (result.symptoms != null && result.symptoms!.isNotEmpty) ...[
                _SymptomsCard(symptoms: result.symptoms!),
                const SizedBox(height: 16),
              ],

              // ── Disclaimer ─────────────────────────────────────────────
              _DisclaimerBox(text: s.disclaimer),
              const SizedBox(height: 24),

              // ── Action buttons ─────────────────────────────────────────
              if (result.riskLevel == RiskLevel.high)
                _ActionBtn(
                  icon: Icons.location_on_outlined,
                  label: s.resultFindClinic,
                  filled: true,
                  onTap: _openMaps,
                ),
              if (result.riskLevel == RiskLevel.high) const SizedBox(height: 10),

              _ActionBtn(
                icon: Icons.download_outlined,
                label: _loadingPdf ? AppStrings(lang).loadingReport : s.resultDownload,
                loading: _loadingPdf,
                onTap: _loadingPdf ? null : _downloadReport,
              ),
              const SizedBox(height: 10),

              _ActionBtn(
                icon: Icons.share_outlined,
                label: s.resultShareReport,
                loading: _loadingShare,
                onTap: _loadingShare ? null : _shareReport,
              ),
              const SizedBox(height: 10),

              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.popUntil(context, (r) => r.isFirst),
                  child: Text(s.resultScanAgain,
                      style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
                ),
              ),
              const SizedBox(height: 8),
            ]),
          ),
        ),
      ),
    );
  }
}

// ── Result hero ───────────────────────────────────────────────────────────────
class _ResultHero extends StatelessWidget {
  final ScanResult result;
  const _ResultHero({required this.result});

  @override
  Widget build(BuildContext context) {
    final (bg, iconColor, icon, headline, subline) = switch (result.riskLevel) {
      RiskLevel.low => (
        JaColors.brandSoft,
        JaColors.brand,
        Icons.check_circle_outline,
        'Looks fine',
        'No signs of concern were found.',
      ),
      RiskLevel.high => (
        JaColors.dangerSoft,
        JaColors.danger,
        Icons.warning_amber_outlined,
        'Please see a doctor',
        'Something needs a closer look.',
      ),
      RiskLevel.invalid => (
        JaColors.warnSoft,
        JaColors.warn,
        Icons.camera_alt_outlined,
        'Photo unclear',
        'Retake in good light and try again.',
      ),
    };

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 32, horizontal: 24),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: iconColor.withValues(alpha: 0.25),
          width: 1.5,
        ),
      ),
      child: Column(children: [
        Container(
          width: 96, height: 96,
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: iconColor, size: 52),
        ),
        const SizedBox(height: 16),
        Text(headline,
            style: GoogleFonts.nunito(
                fontSize: 32, fontWeight: FontWeight.w800, color: iconColor, height: 1.1)),
        const SizedBox(height: 6),
        Text(subline,
            textAlign: TextAlign.center,
            style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: JaColors.surface,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: JaColors.line),
          ),
          child: Text(
            result.scanType == ScanType.oral ? 'Oral screening' : 'Skin screening',
            style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft),
          ),
        ),
      ]),
    );
  }
}

// ── Confidence bar ────────────────────────────────────────────────────────────
class _ConfidenceBar extends StatelessWidget {
  final double confidence;
  const _ConfidenceBar({required this.confidence});

  @override
  Widget build(BuildContext context) {
    final pct = (confidence * 100).round();
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: JaColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: JaColors.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Model confidence',
              style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft)),
          Text('$pct%',
              style: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w800, color: JaColors.brand)),
        ]),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: confidence,
            minHeight: 8,
            backgroundColor: JaColors.line,
            valueColor: const AlwaysStoppedAnimation<Color>(JaColors.brand),
          ),
        ),
      ]),
    );
  }
}

// ── Explanation card ──────────────────────────────────────────────────────────
class _ExplanationCard extends StatelessWidget {
  final String text;
  final bool speaking;
  final VoidCallback onTts;
  const _ExplanationCard({required this.text, required this.speaking, required this.onTts});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: JaColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: JaColors.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('What this means',
              style: GoogleFonts.nunito(fontSize: 17, fontWeight: FontWeight.w700, color: JaColors.ink)),
          GestureDetector(
            onTap: onTts,
            child: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: speaking ? JaColors.brandSoft : JaColors.bg,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: speaking ? JaColors.brand : JaColors.line),
              ),
              child: Icon(
                speaking ? Icons.stop_rounded : Icons.volume_up_outlined,
                color: speaking ? JaColors.brand : JaColors.inkSoft,
                size: 20,
              ),
            ),
          ),
        ]),
        const SizedBox(height: 10),
        Text(text,
            style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft, height: 1.6)),
      ]),
    );
  }
}

// ── Next steps (high risk) ────────────────────────────────────────────────────
class _NextStepsCard extends StatelessWidget {
  final VoidCallback onFindClinic;
  const _NextStepsCard({required this.onFindClinic});

  @override
  Widget build(BuildContext context) {
    final steps = [
      (Icons.local_hospital_outlined, 'Visit a doctor', 'Show them this result screen or download the PDF report.'),
      (Icons.location_on_outlined,    'Find a free clinic', 'Government centres offer free cancer checks near you.'),
      (Icons.download_outlined,       'Download your report', 'Save a PDF to share with any doctor or health worker.'),
    ];
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: JaColors.dangerSoft,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: JaColors.danger.withValues(alpha: 0.2)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('What to do next',
            style: GoogleFonts.nunito(fontSize: 17, fontWeight: FontWeight.w700, color: JaColors.ink)),
        const SizedBox(height: 14),
        for (final (icon, title, desc) in steps) ...[
          Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: JaColors.surface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: JaColors.line),
              ),
              child: Icon(icon, color: JaColors.danger, size: 20),
            ),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(title,
                  style: GoogleFonts.nunito(fontSize: 15, fontWeight: FontWeight.w700, color: JaColors.ink)),
              Text(desc,
                  style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.inkSoft, height: 1.4)),
            ])),
          ]),
          if (steps.indexOf((icon, title, desc)) < steps.length - 1)
            const SizedBox(height: 12),
        ],
      ]),
    );
  }
}

// ── Symptoms card ─────────────────────────────────────────────────────────────
class _SymptomsCard extends StatelessWidget {
  final Map<String, String> symptoms;
  const _SymptomsCard({required this.symptoms});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: JaColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: JaColors.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Reported symptoms',
            style: GoogleFonts.nunito(fontSize: 17, fontWeight: FontWeight.w700, color: JaColors.ink)),
        const SizedBox(height: 10),
        for (final e in symptoms.entries)
          Padding(
            padding: const EdgeInsets.only(bottom: 6),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Icon(Icons.circle, size: 6, color: JaColors.inkSoft),
              ),
              const SizedBox(width: 8),
              Expanded(child: Text('${e.key}: ${e.value}',
                  style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.inkSoft))),
            ]),
          ),
      ]),
    );
  }
}

// ── Disclaimer ────────────────────────────────────────────────────────────────
class _DisclaimerBox extends StatelessWidget {
  final String text;
  const _DisclaimerBox({required this.text});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: JaColors.warnSoft,
        borderRadius: BorderRadius.circular(10),
        border: const Border(left: BorderSide(color: JaColors.warn, width: 4)),
      ),
      child: Text(text,
          style: GoogleFonts.notoSans(
              fontSize: 13, color: JaColors.ink, fontStyle: FontStyle.italic, height: 1.5)),
    );
  }
}

// ── Generic action button ─────────────────────────────────────────────────────
class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool filled;
  final bool loading;
  final VoidCallback? onTap;
  const _ActionBtn({
    required this.icon,
    required this.label,
    this.filled = false,
    this.loading = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: filled
          ? ElevatedButton.icon(
              onPressed: onTap,
              icon: loading
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : Icon(icon),
              label: Text(label),
              style: ElevatedButton.styleFrom(
                backgroundColor: JaColors.brand,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                textStyle: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700),
              ),
            )
          : OutlinedButton.icon(
              onPressed: onTap,
              icon: loading
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(strokeWidth: 2, color: JaColors.brand))
                  : Icon(icon),
              label: Text(label),
              style: OutlinedButton.styleFrom(
                foregroundColor: JaColors.brand,
                side: const BorderSide(color: JaColors.brand, width: 1.5),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                textStyle: GoogleFonts.nunito(fontSize: 17, fontWeight: FontWeight.w700),
              ),
            ),
    );
  }
}
