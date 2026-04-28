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

class ScanEntryScreen extends StatefulWidget {
  final String? initialType;
  const ScanEntryScreen({super.key, this.initialType});

  @override
  State<ScanEntryScreen> createState() => _ScanEntryScreenState();
}

class _ScanEntryScreenState extends State<ScanEntryScreen> {
  int _step = 0; // 0 = pick type, 1 = upload
  late ScanType _scanType = widget.initialType == 'skin' ? ScanType.skin : ScanType.oral;
  bool _typePicked = false;
  Uint8List? _imageBytes;
  String? _fileName;
  bool _picking = false;

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
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => PatientInfoScreen(imageBytes: _imageBytes!, scanType: _scanType),
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
              // Progress dots
              _StepBar(step: _step),
              const SizedBox(height: 28),
              // Step content
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 250),
                child: _step == 0
                    ? _StepPickType(
                        key: const ValueKey(0),
                        selected: _typePicked ? _scanType : null,
                        onSelect: (t) => setState(() { _scanType = t; _typePicked = true; }),
                        onNext: () => setState(() => _step = 1),
                        s: AppStrings(context.watch<AppProvider>().langCode),
                      )
                    : _StepUpload(
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
                        s: AppStrings(context.watch<AppProvider>().langCode),
                      ),
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
    return Row(children: List.generate(3, (i) => Expanded(
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
  final AppStrings s;
  const _StepPickType({super.key, required this.selected, required this.onSelect, required this.onNext, required this.s});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(s.scanStep1Of3, style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      Text(s.scanWhatToCheck, style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
      const SizedBox(height: 6),
      Text(s.scanPickOne, style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
      const SizedBox(height: 24),
      Row(children: [
        Expanded(child: _PickCard(
          icon: Icons.sentiment_satisfied_alt_outlined,
          title: s.scanPickMouth,
          subtitle: s.scanPickMouthSub,
          selected: selected == ScanType.oral,
          onTap: () => onSelect(ScanType.oral),
        )),
        const SizedBox(width: 14),
        Expanded(child: _PickCard(
          icon: Icons.wb_sunny_outlined,
          title: s.scanPickSkin,
          subtitle: s.scanPickSkinSub,
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
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(s.scanNext),
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward, size: 20),
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
  final AppStrings s;
  const _StepUpload({super.key, required this.scanType, required this.imageBytes, required this.fileName, required this.picking, required this.onCamera, required this.onGallery, required this.onClear, required this.onBack, required this.onProceed, required this.s});

  @override
  Widget build(BuildContext context) {
    final hasImage = imageBytes != null;
    final partLabel = scanType == ScanType.oral ? s.scanPickMouth : s.scanPickSkin;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('${s.scanStep2Of3} — $partLabel',
          style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5)),
      const SizedBox(height: 8),
      Text(s.scanTakePhotoTitle, style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
      const SizedBox(height: 6),
      Text(s.scanTakePhotoSub,
          style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),
      const SizedBox(height: 20),

      // Upload area
      GestureDetector(
        onTap: picking ? null : onCamera,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: double.infinity,
          height: 200,
          decoration: BoxDecoration(
            color: hasImage ? JaColors.brandSoft : JaColors.bg,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(
              color: hasImage ? JaColors.brand : JaColors.line,
              width: hasImage ? 2 : 2,
              style: hasImage ? BorderStyle.solid : BorderStyle.solid,
            ),
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
                        Text(s.scanPhotoAdded, style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.white)),
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
                  Text(s.scanTapToTake, style: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700, color: JaColors.ink)),
                  const SizedBox(height: 4),
                  Text(s.scanOrUpload, style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.inkSoft)),
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
            label: Text(s.scanChooseGallery),
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

      // Tips box
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: JaColors.warnSoft,
          borderRadius: BorderRadius.circular(10),
          border: const Border(left: BorderSide(color: JaColors.warn, width: 4)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(s.scanTipsTitle, style: GoogleFonts.notoSans(fontSize: 14, fontWeight: FontWeight.w700, color: JaColors.ink)),
          const SizedBox(height: 6),
          for (final tip in [s.scanTip1, s.scanTip2, s.scanTip3])
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
            child: Text(s.scanBack),
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
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              Text(s.scanCheckMyPhoto),
              const SizedBox(width: 8),
              const Icon(Icons.arrow_forward, size: 20),
            ]),
          ),
        ),
      ]),
    ]);
  }
}
