import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../theme/app_theme.dart';
import 'main_shell.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _loading = false;
  String _error = '';
  bool _isSignUp = false;

  void _go() => Navigator.pushReplacement(
      context, MaterialPageRoute(builder: (_) => const MainShell()));

  Future<void> _emailAuth() async {
    final email = _emailCtrl.text.trim();
    final pass  = _passCtrl.text.trim();
    if (email.isEmpty || pass.isEmpty) {
      setState(() => _error = 'Enter email and password.');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    try {
      if (_isSignUp) {
        await FirebaseAuth.instance.createUserWithEmailAndPassword(email: email, password: pass);
      } else {
        await FirebaseAuth.instance.signInWithEmailAndPassword(email: email, password: pass);
      }
      if (mounted) _go();
    } on FirebaseAuthException catch (e) {
      setState(() => _error = e.message ?? 'Authentication failed.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _googleSignIn() async {
    setState(() { _loading = true; _error = ''; });
    try {
      final googleUser = await GoogleSignIn().signIn();
      if (googleUser == null) { setState(() => _loading = false); return; }
      final auth = await googleUser.authentication;
      final credential = GoogleAuthProvider.credential(
        accessToken: auth.accessToken, idToken: auth.idToken);
      await FirebaseAuth.instance.signInWithCredential(credential);
      if (mounted) _go();
    } catch (e) {
      setState(() => _error = 'Google sign-in failed. Try another method.');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _continueAnon() async {
    setState(() { _loading = true; _error = ''; });
    try {
      await FirebaseAuth.instance.signInAnonymously();
    } catch (_) {
      // Firebase not configured — continue anyway
    } finally {
      if (mounted) { setState(() => _loading = false); _go(); }
    }
  }

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: JaColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(28),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const SizedBox(height: 24),

            // Logo
            Row(children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(color: JaColors.brand, borderRadius: BorderRadius.circular(14)),
                child: const Icon(Icons.water_drop, color: Colors.white, size: 26),
              ),
              const SizedBox(width: 12),
              Text.rich(TextSpan(children: [
                TextSpan(text: 'Jan', style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.ink)),
                TextSpan(text: 'Arogya', style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: JaColors.brand)),
              ])),
            ]),

            const SizedBox(height: 40),
            Text(_isSignUp ? 'Create account' : 'Welcome back',
                style: GoogleFonts.nunito(fontSize: 30, fontWeight: FontWeight.w800, color: JaColors.ink)),
            Text(_isSignUp ? 'Sign up to save your scan history' : 'Sign in to your account',
                style: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft)),

            const SizedBox(height: 32),

            // Email
            _FieldLabel('Email address'),
            const SizedBox(height: 6),
            TextField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: _inputDec('you@example.com'),
              style: GoogleFonts.notoSans(fontSize: 15),
            ),
            const SizedBox(height: 16),

            // Password
            _FieldLabel('Password'),
            const SizedBox(height: 6),
            TextField(
              controller: _passCtrl,
              obscureText: true,
              decoration: _inputDec('••••••••'),
              style: GoogleFonts.notoSans(fontSize: 15),
            ),

            if (_error.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(_error, style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.danger)),
            ],

            const SizedBox(height: 24),

            // Primary button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _loading ? null : _emailAuth,
                style: ElevatedButton.styleFrom(
                  backgroundColor: JaColors.brand, foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: _loading
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(_isSignUp ? 'Create account' : 'Sign in',
                        style: GoogleFonts.nunito(fontSize: 17, fontWeight: FontWeight.w700)),
              ),
            ),

            const SizedBox(height: 12),

            // Toggle sign up / sign in
            Center(
              child: TextButton(
                onPressed: () => setState(() { _isSignUp = !_isSignUp; _error = ''; }),
                child: Text(_isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up",
                    style: GoogleFonts.notoSans(color: JaColors.brand, fontSize: 14, fontWeight: FontWeight.w600)),
              ),
            ),

            const SizedBox(height: 24),
            Row(children: [
              const Expanded(child: Divider()),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Text('or', style: GoogleFonts.notoSans(color: JaColors.inkSoft, fontSize: 13)),
              ),
              const Expanded(child: Divider()),
            ]),
            const SizedBox(height: 24),

            // Google sign-in
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: _loading ? null : _googleSignIn,
                icon: const Text('G', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Color(0xFF4285F4))),
                label: Text('Continue with Google',
                    style: GoogleFonts.notoSans(fontSize: 15, fontWeight: FontWeight.w600, color: JaColors.ink)),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: JaColors.line, width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Anonymous / skip
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: _loading ? null : _continueAnon,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  foregroundColor: JaColors.inkSoft,
                ),
                child: Text('Continue without account',
                    style: GoogleFonts.notoSans(fontSize: 14, fontWeight: FontWeight.w600)),
              ),
            ),

            const SizedBox(height: 24),
            Center(
              child: Text('No data is stored on our servers without your consent.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft)),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _FieldLabel(String text) =>
      Text(text, style: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.6));

  InputDecoration _inputDec(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: GoogleFonts.notoSans(color: JaColors.inkSoft.withAlpha(140), fontSize: 14),
    filled: true, fillColor: JaColors.surface,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.line)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.line)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.brand, width: 2)),
  );
}
