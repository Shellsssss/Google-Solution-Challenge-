import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../models/scan_result.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import 'patient_info_screen.dart';

const _oralSymptoms = [
  'White patches', 'Red patches', 'Non-healing mouth sore', 'Lump or thickening',
  'Difficulty swallowing', 'Jaw or tongue pain', 'Bleeding gums', 'Ear pain',
  'Loose teeth', 'Voice changes', 'Numbness', 'Persistent bad breath',
];

const _skinSymptoms = [
  'New mole', 'Changing mole', 'Irregular border', 'Multiple colours',
  'Bleeding spot', 'Itching or burning', 'Larger than 6mm', 'Non-healing sore',
  'Shiny bump', 'Scaly patch', 'Dark streak under nail', 'Raised red patch',
];

const _oralRisks = [
  'Tobacco use', 'Alcohol', 'Betel nut', 'Poor dental hygiene', 'HPV', 'Family history',
];

const _skinRisks = [
  'Sun exposure', 'History of sunburns', 'Fair skin', 'Family history',
  'Previous skin cancer', 'Immunosuppression',
];

const _durations = ['< 1 week', '1–4 weeks', '1–3 months', '> 3 months'];

class ScanEntryScreen extends StatefulWidget {
  final String? initialType;
  const ScanEntryScreen({super.key, this.initialType});

  @override
  State<ScanEntryScreen> createState() => _ScanEntryScreenState();
}

class _ScanEntryScreenState extends State<ScanEntryScreen> {
  int _step = 0; // 0=type, 1=upload, 2=symptoms, 3=risk factors
  late ScanType _scanType = widget.initialType == 'skin' ? ScanType.skin : ScanType.oral;
  bool _typePicked = false;
  Uint8List? _imageBytes;
  String? _fileName;
  bool _picking = false;

  final Set<String> _selectedSymptoms = {};
  final Set<String> _riskFactors = {};
  String _duration = '';

  @override
  void initState() {
    super.initState();
    if (widget.initialType != null) {
      _typePicked = true;
      _step = 1;
    }
  }

  Future<void> _pickImage(ImageSource source) async {
    setState(() => _picking = true);
    try {
      final file = await ImagePicker().pickImage(
        source: source, maxWidth: 1024, maxHeight: 1024, imageQuality: 85,
      );
      if (file == null) return;
      final bytes = await file.readAsBytes();
      setState(() { _imageBytes = bytes; _fileName = file.name; });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
      }
    } finally {
      if (mounted) setState(() => _picking = false);
    }
  }

  void _proceed() {
    if (_imageBytes == null) {
      final lang = context.read<AppProvider>().langCode;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(AppStrings(lang).errorNoImage)),
      );
      return;
    }
    setState(() => _step = 2);
  }

  void _finish() {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => PatientInfoScreen(
        imageBytes: _imageBytes!,
        scanType: _scanType,
        selectedSymptoms: _selectedSymptoms.toList(),
        riskFactors: _riskFactors.toList(),
        duration: _duration,
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: AppBar(
        title: Text('Check', style: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w800, color: JaColors.ink)),
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
            child: Column(children: [
              _StepBar(step: _step),
              const SizedBox(height: 28),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: switch (_step) {
                  0 => _StepPickType(
                      key: const ValueKey(0),
                      selected: _typePicked ? _scanType : null,
                      onSelect: (t) => setState(() {
                        _scanType = t;
                        _typePicked = true;
                        _selectedSymptoms.clear();
                        _riskFactors.clear();
                      }),
                      onNext: () => setState(() => _step = 1),
                    ),
                  1 => _StepUpload(
                      key: const ValueKey(1),
                      scanType: _scanType,
                      imageBytes: _imageBytes,
                      fileName: _fileName,
                      picking: _picking,
                      onCamera: () => _pickImage(ImageSource.camera),
                      onGallery: () => _pickImage(ImageSource.gallery),
                      onClear: () => setState(() { _imageBytes = null; _fileName = null; }),
                      onBack: () => setState(() => _step = 0),
                      onProceed: _proceed,
                    ),
                  2 => _StepSymptoms(
                      key: const ValueKey(2),
                      scanType: _scanType,
                      selected: _selectedSymptoms,
                      onToggle: (s) => setState(() {
                        _selectedSymptoms.contains(s) ? _selectedSymptoms.remove(s) : _selectedSymptoms.add(s);
                      }),
                      onBack: () => setState(() => _step = 1),
                      onNext: () => setState(() => _step = 3),
                    ),
                  _ => _StepRiskFactors(
                      key: const ValueKey(3),
                      scanType: _scanType,
                      selectedRisks: _riskFactors,
                      duration: _duration,
                      onToggleRisk: (r) => setState(() {
                        _riskFactors.contains(r) ? _riskFactors.remove(r) : _riskFactors.add(r);
                      }),
                      onSelectDuration: (d) => setState(() => _duration = d),
                      onBack: () => setState(() => _step = 2),
                      onFinish: _finish,
                    ),
                },
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

// ── Step bar ──────────────────────────────────────────────────────────────────
class _StepBar extends StatelessWidget {
  final int step;
  const _StepBar({required this.step});

  @override
  Widget build(BuildContext context) {
    return Row(children: List.generate(4, (i) => Expanded(
      child: Container(
        margin: EdgeInsets.only(left: i == 0 ? 0 : 6),
        height: 6,
        decoration: BoxDecoration(
          color: i <= step ? JaColors.brand : JaColors.line,
          borderRadius: BorderRadius.circular(3),
        ),
      ),
    )));
  }
}

// ── Step 1: Pick type ─────────────────────────────────────────────────────────
class _StepPickType extends StatelessWidget {
  final ScanType? selected;
  final ValueChanged<ScanType> onSelect;
  final VoidCallback onNext;
  const _StepPickType({super.key, required this.selected, required this.onSelect, required this.onNext});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Step 1 of 4', style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      Text('What do you want to check?', style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
      const SizedBox(height: 6),
      Text('Pick one. You can check the other one later.', style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
      const SizedBox(height: 24),
      Row(children: [
        Expanded(child: _PickCard(
          icon: Icons.sentiment_satisfied_alt_outlined,
          title: 'My mouth',
          subtitle: 'Lips, tongue, inside cheek',
          selected: selected == ScanType.oral,
          onTap: () => onSelect(ScanType.oral),
        )),
        const SizedBox(width: 14),
        Expanded(child: _PickCard(
          icon: Icons.wb_sunny_outlined,
          title: 'My skin',
          subtitle: 'A mark, mole or patch',
          selected: selected == ScanType.skin,
          onTap: () => onSelect(ScanType.skin),
        )),
      ]),
      const SizedBox(height: 28),
      SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: selected != null ? onNext : null,
          style: ElevatedButton.styleFrom(
            backgroundColor: JaColors.brand,
            disabledBackgroundColor: JaColors.line,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 18),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            textStyle: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text('Next'),
            SizedBox(width: 8),
            Icon(Icons.arrow_forward, size: 20),
          ]),
        ),
      ),
    ]);
  }
}

class _PickCard extends StatelessWidget {
  final IconData icon;
  final String title, subtitle;
  final bool selected;
  final VoidCallback onTap;
  const _PickCard({required this.icon, required this.title, required this.subtitle, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: selected ? JaColors.brandSoft : JaColors.surface,
          borderRadius: BorderRadius.circular(18),
          border: Border.all(color: selected ? JaColors.brand : JaColors.line, width: selected ? 2 : 1.5),
        ),
        child: Column(children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: selected ? JaColors.brand : JaColors.brandSoft,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, color: selected ? Colors.white : JaColors.brand, size: 32),
          ),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700, color: JaColors.ink)),
          const SizedBox(height: 4),
          Text(subtitle, textAlign: TextAlign.center, style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.inkSoft)),
        ]),
      ),
    );
  }
}

// ── Step 2: Upload photo ──────────────────────────────────────────────────────
class _StepUpload extends StatelessWidget {
  final ScanType scanType;
  final Uint8List? imageBytes;
  final String? fileName;
  final bool picking;
  final VoidCallback onCamera, onGallery, onClear, onBack, onProceed;
  const _StepUpload({super.key, required this.scanType, required this.imageBytes, required this.fileName, required this.picking, required this.onCamera, required this.onGallery, required this.onClear, required this.onBack, required this.onProceed});

  @override
  Widget build(BuildContext context) {
    final hasImage = imageBytes != null;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Step 2 of 4 — ${scanType == ScanType.oral ? "Mouth" : "Skin"}',
          style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      Text('Take a photo', style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
      const SizedBox(height: 6),
      Text('Bring the spot close. Use good light. You can also upload a photo.',
          style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
      const SizedBox(height: 20),

      GestureDetector(
        onTap: picking ? null : onCamera,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          height: 200,
          decoration: BoxDecoration(
            color: hasImage ? JaColors.brandSoft : JaColors.bg,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: hasImage ? JaColors.brand : JaColors.line, width: 2),
          ),
          clipBehavior: Clip.antiAlias,
          child: hasImage
              ? Stack(fit: StackFit.expand, children: [
                  Image.memory(imageBytes!, fit: BoxFit.cover),
                  Positioned(top: 10, right: 10,
                    child: GestureDetector(
                      onTap: onClear,
                      child: Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                        child: const Icon(Icons.close, color: Colors.white, size: 18),
                      ),
                    )),
                  Positioned(bottom: 10, left: 10,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: JaColors.brand.withValues(alpha: 0.9), borderRadius: BorderRadius.circular(8)),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        const Icon(Icons.check, color: Colors.white, size: 16),
                        const SizedBox(width: 6),
                        Text('Photo added', style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
                      ]),
                    )),
                ])
              : Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    width: 72, height: 72,
                    decoration: BoxDecoration(color: JaColors.surface, borderRadius: BorderRadius.circular(20),
                      boxShadow: JaColors.cardShadow),
                    child: const Icon(Icons.camera_alt_outlined, color: JaColors.brand, size: 36),
                  ),
                  const SizedBox(height: 14),
                  Text('Tap to take a photo', style: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700, color: JaColors.ink)),
                  const SizedBox(height: 4),
                  Text('or choose a photo from your phone', style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.inkSoft)),
                ]),
        ),
      ),

      if (!hasImage) ...[
        const SizedBox(height: 10),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: picking ? null : onGallery,
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('Choose from gallery'),
            style: OutlinedButton.styleFrom(
              foregroundColor: JaColors.brand,
              side: const BorderSide(color: JaColors.brand, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: GoogleFonts.notoSans(fontSize: 16, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ],

      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: JaColors.warnSoft,
          borderRadius: BorderRadius.circular(10),
          border: const Border(left: BorderSide(color: JaColors.warn, width: 4)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Tips for a clear photo', style: GoogleFonts.notoSans(fontSize: 14, fontWeight: FontWeight.w700, color: JaColors.ink)),
          const SizedBox(height: 6),
          for (final tip in ['Good daylight or a bright lamp', 'Hold the phone 15–20 cm away', 'Don\'t use filters or flash'])
            Padding(
              padding: const EdgeInsets.only(top: 3),
              child: Text('• $tip', style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.ink)),
            ),
        ]),
      ),

      const SizedBox(height: 24),
      Row(children: [
        Expanded(
          flex: 1,
          child: OutlinedButton(
            onPressed: onBack,
            style: OutlinedButton.styleFrom(
              foregroundColor: JaColors.inkSoft,
              side: const BorderSide(color: JaColors.line, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: GoogleFonts.notoSans(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            child: const Text('Back'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: ElevatedButton(
            onPressed: onProceed,
            style: ElevatedButton.styleFrom(
              backgroundColor: JaColors.brand,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('Next: Symptoms'),
              SizedBox(width: 8),
              Icon(Icons.arrow_forward, size: 20),
            ]),
          ),
        ),
      ]),
    ]);
  }
}

// ── Step 3: Symptom chips ─────────────────────────────────────────────────────
class _StepSymptoms extends StatelessWidget {
  final ScanType scanType;
  final Set<String> selected;
  final void Function(String) onToggle;
  final VoidCallback onBack, onNext;
  const _StepSymptoms({super.key, required this.scanType, required this.selected, required this.onToggle, required this.onBack, required this.onNext});

  @override
  Widget build(BuildContext context) {
    final chips = scanType == ScanType.oral ? _oralSymptoms : _skinSymptoms;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Step 3 of 4', style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      Text('Any symptoms?', style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
      const SizedBox(height: 6),
      Text('Select all that apply. Skip if none match.', style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
      const SizedBox(height: 20),
      Wrap(
        spacing: 8,
        runSpacing: 8,
        children: chips.map((chip) {
          final on = selected.contains(chip);
          return GestureDetector(
            onTap: () => onToggle(chip),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: on ? JaColors.brand : JaColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: on ? JaColors.brand : JaColors.line),
              ),
              child: Text(chip, style: GoogleFonts.notoSans(
                fontSize: 13, fontWeight: FontWeight.w600,
                color: on ? Colors.white : JaColors.inkSoft,
              )),
            ),
          );
        }).toList(),
      ),
      const SizedBox(height: 28),
      Row(children: [
        Expanded(
          flex: 1,
          child: OutlinedButton(
            onPressed: onBack,
            style: OutlinedButton.styleFrom(
              foregroundColor: JaColors.inkSoft,
              side: const BorderSide(color: JaColors.line, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: GoogleFonts.notoSans(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            child: const Text('Back'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: ElevatedButton(
            onPressed: onNext,
            style: ElevatedButton.styleFrom(
              backgroundColor: JaColors.brand,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(selected.isEmpty ? 'Skip' : 'Next'),
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward, size: 20),
            ]),
          ),
        ),
      ]),
    ]);
  }
}

// ── Step 4: Risk factors + duration ──────────────────────────────────────────
class _StepRiskFactors extends StatelessWidget {
  final ScanType scanType;
  final Set<String> selectedRisks;
  final String duration;
  final void Function(String) onToggleRisk;
  final void Function(String) onSelectDuration;
  final VoidCallback onBack, onFinish;
  const _StepRiskFactors({super.key, required this.scanType, required this.selectedRisks, required this.duration, required this.onToggleRisk, required this.onSelectDuration, required this.onBack, required this.onFinish});

  @override
  Widget build(BuildContext context) {
    final risks = scanType == ScanType.oral ? _oralRisks : _skinRisks;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Step 4 of 4', style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      Text('A bit more context', style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
      const SizedBox(height: 6),
      Text('This helps the AI give you a more accurate result.', style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
      const SizedBox(height: 24),

      Text('How long have you noticed this?',
          style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8, runSpacing: 8,
        children: _durations.map((d) {
          final on = duration == d;
          return GestureDetector(
            onTap: () => onSelectDuration(d),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
              decoration: BoxDecoration(
                color: on ? JaColors.accent : JaColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: on ? JaColors.accent : JaColors.line),
              ),
              child: Text(d, style: GoogleFonts.notoSans(
                fontSize: 13, fontWeight: FontWeight.w600,
                color: on ? Colors.white : JaColors.inkSoft,
              )),
            ),
          );
        }).toList(),
      ),

      const SizedBox(height: 24),
      Text('Risk factors (select any that apply)',
          style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 10),
      Wrap(
        spacing: 8, runSpacing: 8,
        children: risks.map((r) {
          final on = selectedRisks.contains(r);
          return GestureDetector(
            onTap: () => onToggleRisk(r),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 150),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
              decoration: BoxDecoration(
                color: on ? JaColors.warn : JaColors.surface,
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: on ? JaColors.warn : JaColors.line),
              ),
              child: Text(r, style: GoogleFonts.notoSans(
                fontSize: 13, fontWeight: FontWeight.w600,
                color: on ? Colors.white : JaColors.inkSoft,
              )),
            ),
          );
        }).toList(),
      ),

      const SizedBox(height: 28),
      Row(children: [
        Expanded(
          flex: 1,
          child: OutlinedButton(
            onPressed: onBack,
            style: OutlinedButton.styleFrom(
              foregroundColor: JaColors.inkSoft,
              side: const BorderSide(color: JaColors.line, width: 1.5),
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: GoogleFonts.notoSans(fontSize: 16, fontWeight: FontWeight.w600),
            ),
            child: const Text('Back'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          flex: 2,
          child: ElevatedButton(
            onPressed: onFinish,
            style: ElevatedButton.styleFrom(
              backgroundColor: JaColors.brand,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              textStyle: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700),
            ),
            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text('Check my photo'),
              SizedBox(width: 8),
              Icon(Icons.arrow_forward, size: 20),
            ]),
          ),
        ),
      ]),
    ]);
  }
}
