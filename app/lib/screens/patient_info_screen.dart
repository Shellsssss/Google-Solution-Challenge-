import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../models/patient_info.dart';
import '../models/scan_result.dart';
import '../providers/app_provider.dart';
import '../services/api_service.dart';
import '../services/tts_service.dart';
import '../theme/app_theme.dart';
import 'symptoms_screen.dart';

class PatientInfoScreen extends StatefulWidget {
  final Uint8List imageBytes;
  final ScanType  scanType;

  const PatientInfoScreen({
    super.key,
    required this.imageBytes,
    required this.scanType,
  });

  @override
  State<PatientInfoScreen> createState() => _PatientInfoScreenState();
}

class _PatientInfoScreenState extends State<PatientInfoScreen> {
  // Selection: null = not chosen yet, true = myself, false = someone else
  bool? _isSelf;
  bool  _editing   = false;   // true when editing saved profile in "myself" mode
  bool  _loading   = false;

  // Form controllers
  final _nameCtrl   = TextEditingController();
  final _ageCtrl    = TextEditingController();
  final _phoneCtrl  = TextEditingController();
  String _gender    = '';
  bool   _saveInfo  = true;   // checkbox in "myself" new-profile form

  final _formKey = GlobalKey<FormState>();

  @override
  void dispose() {
    _nameCtrl.dispose();
    _ageCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _selectMyself() {
    final provider = context.read<AppProvider>();
    setState(() {
      _isSelf  = true;
      _editing = false;
      if (provider.hasProfile) {
        // Pre-fill from saved profile (in case user wants to edit)
        _nameCtrl.text  = provider.profileName;
        _ageCtrl.text   = provider.profileAge;
        _phoneCtrl.text = provider.profilePhone;
        _gender         = provider.profileGender;
      } else {
        // No saved profile — show empty form
        _nameCtrl.clear();
        _ageCtrl.clear();
        _phoneCtrl.clear();
        _gender = '';
      }
    });
  }

  void _selectSomeoneElse() {
    setState(() {
      _isSelf  = false;
      _editing = false;
      _nameCtrl.clear();
      _ageCtrl.clear();
      _phoneCtrl.clear();
      _gender = '';
    });
  }

  Future<void> _proceed() async {
    final provider = context.read<AppProvider>();
    final lang     = provider.langCode;
    final s        = AppStrings(lang);

    // Determine the PatientInfo to use
    PatientInfo patient;

    if (_isSelf == true && provider.hasProfile && !_editing) {
      // Use saved profile as-is
      patient = PatientInfo(
        name:   provider.profileName,
        age:    provider.profileAge,
        gender: provider.profileGender,
        phone:  provider.profilePhone,
        isSelf: true,
      );
    } else {
      // Validate form
      if (!_formKey.currentState!.validate()) return;
      if (_gender.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('${s.patientGender} is required')),
        );
        return;
      }

      patient = PatientInfo(
        name:   _nameCtrl.text.trim(),
        age:    _ageCtrl.text.trim(),
        gender: _gender,
        phone:  _phoneCtrl.text.trim(),
        isSelf: _isSelf == true,
      );

      // Save profile if user asked to (only for "myself" flow)
      if (_isSelf == true && _saveInfo) {
        await provider.saveProfile(
          name:   patient.name,
          age:    patient.age,
          gender: patient.gender,
          phone:  patient.phone,
        );
      }
    }

    // Now load Gemini questions (with loading indicator)
    setState(() => _loading = true);
    final nav = Navigator.of(context);
    try {
      await TtsService().speak(s.questionsLoading, langCode: lang);
      final scanName = widget.scanType == ScanType.oral ? 'oral' : 'skin';
      final questions = await ApiService().getImageQuestions(
        imageBytes: widget.imageBytes,
        scanType:   scanName,
      );
      if (!mounted) return;
      await TtsService().stop();

      nav.push(
        MaterialPageRoute(
          builder: (_) => SymptomsScreen(
            imageBytes:  widget.imageBytes,
            scanType:    widget.scanType,
            questions:   questions,
            patientInfo: patient,
          ),
        ),
      );
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppStrings(lang).errorGeneric)),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang     = context.watch<AppProvider>().langCode;
    final s        = AppStrings(lang);
    final provider = context.watch<AppProvider>();

    return Scaffold(
      backgroundColor: context.primaryBg,
      appBar: AppBar(title: Text(s.patientTitle)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Selection cards ─────────────────────────────────────────────
            _SelectionCard(
              icon:     Icons.person_outline,
              title:    s.patientMyself,
              subtitle: provider.hasProfile
                  ? '${provider.profileName}, ${provider.profileAge} yrs'
                  : s.patientMyselfSub,
              selected: _isSelf == true,
              onTap:    _selectMyself,
            ),
            const SizedBox(height: 12),
            _SelectionCard(
              icon:     Icons.group_outlined,
              title:    s.patientSomeoneElse,
              subtitle: s.patientSomeoneElseSub,
              selected: _isSelf == false,
              onTap:    _selectSomeoneElse,
            ),

            // ── Content area ─────────────────────────────────────────────────
            if (_isSelf == true && provider.hasProfile && !_editing) ...[
              const SizedBox(height: 20),
              _SavedProfileCard(
                provider: provider,
                s:        s,
                onEdit:   () => setState(() => _editing = true),
              ),
            ] else if (_isSelf != null) ...[
              const SizedBox(height: 20),
              _PatientForm(
                formKey:    _formKey,
                nameCtrl:   _nameCtrl,
                ageCtrl:    _ageCtrl,
                phoneCtrl:  _phoneCtrl,
                gender:     _gender,
                onGender:   (g) => setState(() => _gender = g),
                showSave:   _isSelf == true,
                saveInfo:   _saveInfo,
                onSave:     (v) => setState(() => _saveInfo = v),
                s:          s,
              ),
            ],

            // ── Continue button ───────────────────────────────────────────────
            if (_isSelf != null) ...[
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _loading ? null : _proceed,
                child: _loading
                    ? Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(
                            width: 18, height: 18,
                            child: CircularProgressIndicator(
                                color: Colors.white, strokeWidth: 2),
                          ),
                          const SizedBox(width: 12),
                          Text(s.questionsLoading,
                              style: const TextStyle(fontSize: 13)),
                        ],
                      )
                    : Text(s.patientContinue),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Saved profile card ──────────────────────────────────────────────────────

class _SavedProfileCard extends StatelessWidget {
  final AppProvider provider;
  final AppStrings  s;
  final VoidCallback onEdit;

  const _SavedProfileCard({
    required this.provider,
    required this.s,
    required this.onEdit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: context.accent.withValues(alpha: 0.06),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.accent.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.check_circle, color: context.accent, size: 18),
              const SizedBox(width: 8),
              Text(s.patientUsingSaved,
                  style: TextStyle(
                      color: context.accent,
                      fontSize: 13, fontWeight: FontWeight.w600)),
              const Spacer(),
              TextButton(
                onPressed: onEdit,
                style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: Size.zero,
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap),
                child: Text(s.patientEditSaved,
                    style: TextStyle(color: context.accent, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          _Row(label: s.patientName,   value: provider.profileName),
          _Row(label: s.patientAge,    value: '${provider.profileAge} yrs'),
          _Row(label: s.patientGender, value: provider.profileGender),
          if (provider.profilePhone.isNotEmpty)
            _Row(label: s.patientPhone, value: provider.profilePhone),
        ],
      ),
    );
  }
}

class _Row extends StatelessWidget {
  final String label;
  final String value;
  const _Row({required this.label, required this.value});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(children: [
          SizedBox(
            width: 80,
            child: Text(label,
                style: TextStyle(color: context.textSec, fontSize: 12)),
          ),
          Text(value,
              style: TextStyle(
                  color: context.textPrimary,
                  fontSize: 13, fontWeight: FontWeight.w500)),
        ]),
      );
}

// ── Selection card ───────────────────────────────────────────────────────────

class _SelectionCard extends StatelessWidget {
  final IconData icon;
  final String   title;
  final String   subtitle;
  final bool     selected;
  final VoidCallback onTap;

  const _SelectionCard({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected
              ? context.accent.withValues(alpha: 0.08)
              : context.cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? context.accent : context.border,
            width: selected ? 2 : 1,
          ),
        ),
        child: Row(children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: (selected ? context.accent : context.textSec)
                  .withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon,
                color: selected ? context.accent : context.textSec,
                size: 24),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        color: selected
                            ? context.accent
                            : context.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(subtitle,
                    style: TextStyle(
                        color: context.textSec, fontSize: 12)),
              ],
            ),
          ),
          if (selected)
            Icon(Icons.check_circle, color: context.accent, size: 22)
          else
            Icon(Icons.radio_button_unchecked,
                color: context.border, size: 22),
        ]),
      ),
    );
  }
}

// ── Patient info form ─────────────────────────────────────────────────────────

class _PatientForm extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController nameCtrl;
  final TextEditingController ageCtrl;
  final TextEditingController phoneCtrl;
  final String                gender;
  final void Function(String) onGender;
  final bool                  showSave;
  final bool                  saveInfo;
  final void Function(bool)   onSave;
  final AppStrings            s;

  const _PatientForm({
    required this.formKey,
    required this.nameCtrl,
    required this.ageCtrl,
    required this.phoneCtrl,
    required this.gender,
    required this.onGender,
    required this.showSave,
    required this.saveInfo,
    required this.onSave,
    required this.s,
  });

  @override
  Widget build(BuildContext context) {
    final genderOptions = [s.patientMale, s.patientFemale, s.patientOther];

    return Form(
      key: formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Name
          TextFormField(
            controller: nameCtrl,
            textCapitalization: TextCapitalization.words,
            style: TextStyle(color: context.textPrimary),
            decoration: _inputDec(context, s.patientName, Icons.person_outline),
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? s.patientNameRequired : null,
          ),
          const SizedBox(height: 12),

          // Age
          TextFormField(
            controller: ageCtrl,
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            style: TextStyle(color: context.textPrimary),
            decoration: _inputDec(context, s.patientAge, Icons.cake_outlined),
            validator: (v) =>
                (v == null || v.trim().isEmpty) ? s.patientAgeRequired : null,
          ),
          const SizedBox(height: 12),

          // Gender chips
          Text(s.patientGender,
              style: TextStyle(
                  color: context.textSec,
                  fontSize: 13, fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: genderOptions.map((g) {
              final active = gender == g;
              return GestureDetector(
                onTap: () => onGender(g),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: active ? context.accent : context.cardBg,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                        color: active ? context.accent : context.border),
                  ),
                  child: Text(g,
                      style: TextStyle(
                          color: active ? Colors.white : context.textPrimary,
                          fontSize: 13,
                          fontWeight: FontWeight.w500)),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 12),

          // Phone (optional)
          TextFormField(
            controller: phoneCtrl,
            keyboardType: TextInputType.phone,
            style: TextStyle(color: context.textPrimary),
            decoration: _inputDec(context, s.patientPhone, Icons.phone_outlined),
          ),

          // Save checkbox (only for "myself" when creating new profile)
          if (showSave) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: () => onSave(!saveInfo),
              child: Row(children: [
                Checkbox(
                  value:    saveInfo,
                  onChanged: (v) => onSave(v ?? false),
                  activeColor: context.accent,
                ),
                Expanded(
                  child: Text(s.patientSaveInfo,
                      style: TextStyle(
                          color: context.textSec, fontSize: 13)),
                ),
              ]),
            ),
          ],
        ],
      ),
    );
  }

  InputDecoration _inputDec(BuildContext context, String label, IconData icon) =>
      InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: context.textSec),
        prefixIcon: Icon(icon, color: context.textSec, size: 20),
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: context.border)),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: context.border)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: context.accent, width: 1.5)),
        filled: true,
        fillColor: context.cardBg,
        contentPadding: const EdgeInsets.symmetric(
            horizontal: 14, vertical: 12),
      );
}
