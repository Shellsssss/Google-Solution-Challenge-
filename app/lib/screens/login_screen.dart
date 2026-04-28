import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../providers/app_provider.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _busy = false;

  Future<void> _signIn() async {
    setState(() => _busy = true);
    try {
      await AuthService.instance.signInWithGoogle();
      // AuthGate listens to authStateChanges and will swap to MainShell
      // automatically on success. No navigation needed here.
    } catch (e) {
      if (!mounted) return;
      final s = AppStrings(context.read<AppProvider>().langCode);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(s.loginFailed)),
      );
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    final s    = AppStrings(lang);

    return Scaffold(
      backgroundColor: JaColors.bg,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              // ── Brand mark ──────────────────────────────────────────
              Center(
                child: Container(
                  width: 96, height: 96,
                  decoration: BoxDecoration(
                    color: JaColors.brand,
                    borderRadius: BorderRadius.circular(28),
                    boxShadow: JaColors.cardShadow,
                  ),
                  child: const Icon(Icons.favorite, color: Colors.white, size: 48),
                ),
              ),
              const SizedBox(height: 28),

              // ── App name ────────────────────────────────────────────
              Text.rich(
                TextSpan(children: [
                  TextSpan(text: 'Jan',
                      style: GoogleFonts.nunito(fontSize: 36, fontWeight: FontWeight.w800, color: JaColors.ink)),
                  TextSpan(text: 'Arogya',
                      style: GoogleFonts.nunito(fontSize: 36, fontWeight: FontWeight.w800, color: JaColors.brand)),
                ]),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              // ── Local script name ───────────────────────────────────
              Text(
                s.appNameLocal,
                textAlign: TextAlign.center,
                style: GoogleFonts.notoSans(
                  fontSize: 18, fontWeight: FontWeight.w600, color: JaColors.inkSoft,
                ),
              ),
              const SizedBox(height: 32),

              // ── Welcome card ────────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: JaColors.surface,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: JaColors.line),
                  boxShadow: JaColors.cardShadow,
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(s.loginWelcome,
                      style: GoogleFonts.nunito(fontSize: 24, fontWeight: FontWeight.w800, color: JaColors.ink)),
                  const SizedBox(height: 8),
                  Text(s.loginSubtitle,
                      style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft, height: 1.45)),
                ]),
              ),

              const SizedBox(height: 24),

              // ── Continue with Google ────────────────────────────────
              _GoogleButton(
                label: _busy ? s.loginSigningIn : s.loginContinueGoogle,
                busy: _busy,
                onTap: _busy ? null : _signIn,
              ),

              const SizedBox(height: 16),

              // ── Privacy note ────────────────────────────────────────
              Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Icon(Icons.lock_outline, size: 14, color: JaColors.inkSoft),
                const SizedBox(width: 6),
                Expanded(child: Text(
                  s.loginPrivacy,
                  style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft, height: 1.4),
                )),
              ]),

              const Spacer(),

              // ── Language toggle (matches home_screen) ───────────────
              Center(child: _LangChips(lang: lang)),

              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Google button ────────────────────────────────────────────────────────────
class _GoogleButton extends StatelessWidget {
  final String label;
  final bool busy;
  final VoidCallback? onTap;
  const _GoogleButton({required this.label, required this.busy, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: JaColors.surface,
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 18),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: JaColors.line, width: 1.5),
          ),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            if (busy)
              const SizedBox(
                width: 22, height: 22,
                child: CircularProgressIndicator(strokeWidth: 2.5, color: JaColors.brand),
              )
            else
              const _GoogleGlyph(),
            const SizedBox(width: 12),
            Text(label,
                style: GoogleFonts.nunito(
                  fontSize: 16, fontWeight: FontWeight.w700, color: JaColors.ink,
                )),
          ]),
        ),
      ),
    );
  }
}

/// Simple multi-colour "G" glyph drawn with text fragments — avoids needing an
/// asset for the official Google logo while still being recognisable.
class _GoogleGlyph extends StatelessWidget {
  const _GoogleGlyph();

  @override
  Widget build(BuildContext context) {
    final base = GoogleFonts.nunito(fontSize: 22, fontWeight: FontWeight.w900);
    return Text.rich(TextSpan(children: [
      TextSpan(text: 'G', style: base.copyWith(color: const Color(0xFF4285F4))),
      TextSpan(text: 'o', style: base.copyWith(color: const Color(0xFFEA4335))),
      TextSpan(text: 'o', style: base.copyWith(color: const Color(0xFFFBBC05))),
      TextSpan(text: 'g', style: base.copyWith(color: const Color(0xFF4285F4))),
      TextSpan(text: 'l', style: base.copyWith(color: const Color(0xFF34A853))),
      TextSpan(text: 'e', style: base.copyWith(color: const Color(0xFFEA4335))),
    ]));
  }
}

// ── Language chips ───────────────────────────────────────────────────────────
class _LangChips extends StatelessWidget {
  final String lang;
  const _LangChips({required this.lang});

  @override
  Widget build(BuildContext context) {
    final langs  = ['en', 'hi', 'ta', 'te'];
    final labels = {'en': 'EN', 'hi': 'HI', 'ta': 'TA', 'te': 'TE'};
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: JaColors.surface,
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: JaColors.line),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: langs.map((l) {
        final on = lang == l;
        return GestureDetector(
          onTap: () => context.read<AppProvider>().setLanguage(l),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: on ? JaColors.brand : Colors.transparent,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text(labels[l]!,
                style: GoogleFonts.notoSans(
                  fontSize: 13,
                  fontWeight: FontWeight.w700,
                  color: on ? Colors.white : JaColors.inkSoft,
                )),
          ),
        );
      }).toList()),
    );
  }
}
