import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../models/patient_info.dart';
import '../models/scan_result.dart';
import '../providers/app_provider.dart';
import '../services/api_service.dart';
import '../services/ml_service.dart';
import '../theme/app_theme.dart';
import 'result_screen.dart';

class ScanScreen extends StatefulWidget {
  final Uint8List           imageBytes;
  final ScanType            scanType;
  final Map<String, String> symptoms;
  final String              scanTypeName;
  final PatientInfo?        patientInfo;

  const ScanScreen({
    super.key,
    required this.imageBytes,
    required this.scanType,
    this.symptoms    = const {},
    this.scanTypeName = 'oral',
    this.patientInfo,
  });

  @override
  State<ScanScreen> createState() => _ScanScreenState();
}

class _ScanScreenState extends State<ScanScreen> {
  String _status       = '';
  int    _step         = 0;  // 0=loading, 1=on-device, 2=backend, 3=done
  bool   _offlineMode  = false; // true if backend was unreachable

  @override
  void initState() {
    super.initState();
    _run();
  }

  Future<void> _run() async {
    final lang = context.read<AppProvider>().langCode;
    final s    = AppStrings(lang);

    try {
      // Step 1: On-device inference
      setState(() { _status = s.loadingAnalyzing; _step = 1; });
      await MLService().loadModel(widget.scanType);
      final local = await MLService().analyze(widget.imageBytes, widget.scanType);

      // Step 2: Backend analysis
      setState(() { _step = 2; });
      final backend = await ApiService().analyze(
        imageBytes: widget.imageBytes,
        scanType: widget.scanTypeName,
        symptoms: widget.symptoms,
      );

      if (!mounted) return;

      ScanResult result;
      if (backend != null) {
        final rawRisk = backend['risk_level'] as String? ?? 'INVALID';
        final expl    = backend['explanation'] as Map<String, dynamic>? ?? {};
        result = ScanResult(
          scanType:       widget.scanType,
          riskLevel:      _parseRisk(rawRisk) ?? local.riskLevel,
          confidence:     (backend['confidence'] as num?)?.toDouble() ?? local.confidence,
          explanationEn:  expl['en'] as String? ?? local.explanationEn,
          explanationHi:  expl['hi'] as String? ?? local.explanationHi,
          explanationTa:  expl['ta'] as String? ?? local.explanationTa,
          explanationTe:  expl['te'] as String? ?? local.explanationTe,
          timestamp:      DateTime.now(),
          symptoms:       widget.symptoms.isEmpty ? null : widget.symptoms,
        );
      } else {
        result = local.copyWith(
          symptoms: widget.symptoms.isEmpty ? null : widget.symptoms,
        );
        setState(() => _offlineMode = true);
      }

      setState(() => _step = 3);

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => ResultScreen(
            imageBytes:  widget.imageBytes,
            result:      result,
            patientInfo: widget.patientInfo,
          ),
        ),
      );
    } catch (e) {
      if (mounted) setState(() => _status = 'Error: $e');
    }
  }

  RiskLevel? _parseRisk(String s) {
    if (s == 'HIGH_RISK') return RiskLevel.high;
    if (s == 'LOW_RISK')  return RiskLevel.low;
    if (s == 'INVALID')   return RiskLevel.invalid;
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    final s    = AppStrings(lang);

    return Scaffold(
      backgroundColor: context.primaryBg,
      body: SafeArea(
        child: Column(
          children: [
            // Image preview — top half
            Expanded(
              flex: 3,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.only(
                      bottomLeft: Radius.circular(16),
                      bottomRight: Radius.circular(16),
                    ),
                    child: Image.memory(widget.imageBytes, fit: BoxFit.cover),
                  ),
                  Positioned(
                    bottom: 16, left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: Colors.black54,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        widget.scanType == ScanType.oral
                            ? AppStrings(lang).scanOral
                            : AppStrings(lang).scanSkin,
                        style: const TextStyle(
                            color: Colors.white, fontSize: 13),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Analysis status — bottom half
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(32),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                        color: context.accent, strokeWidth: 3),
                    const SizedBox(height: 20),
                    Text(
                      _step < 3 ? s.loadingAnalyzing : s.scanAnalyze,
                      style: TextStyle(
                          color: context.textPrimary,
                          fontSize: 16, fontWeight: FontWeight.w500),
                    ),
                    const SizedBox(height: 16),
                    _StepRow(step: _step, lang: lang),
                    if (_offlineMode) ...[
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: context.warning.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: context.warning.withValues(alpha: 0.4)),
                        ),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(Icons.cloud_off_outlined, size: 16, color: context.warning),
                          const SizedBox(width: 6),
                          Text('Cloud AI unavailable — using on-device result',
                              style: TextStyle(fontSize: 12, color: context.warning)),
                        ]),
                      ),
                    ],
                    if (_status.startsWith('Error')) ...[
                      const SizedBox(height: 16),
                      Text(_status,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              color: context.danger, fontSize: 12)),
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StepRow extends StatelessWidget {
  final int    step;
  final String lang;
  const _StepRow({required this.step, required this.lang});

  @override
  Widget build(BuildContext context) {
    final labels = [
      AppStrings(lang).navHome,   // reuse short label as placeholder
      'On-device AI',
      'Backend AI',
      'Done',
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(labels.length * 2 - 1, (i) {
        if (i.isOdd) {
          // Connector line
          return Container(
            width: 24, height: 2,
            color: i ~/ 2 < step
                ? context.accent
                : context.border,
          );
        }
        final idx    = i ~/ 2;
        final active = step > idx;
        return Container(
          width: 10, height: 10,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: active ? context.accent : context.border,
          ),
        );
      }),
    );
  }
}
