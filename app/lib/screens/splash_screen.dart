import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import 'auth_gate.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double>   _fade;
  late Animation<double>   _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    _fade  = CurvedAnimation(parent: _ctrl, curve: Curves.easeIn);
    _scale = Tween<double>(begin: 0.85, end: 1.0)
        .animate(CurvedAnimation(parent: _ctrl, curve: Curves.easeOutBack));
    _ctrl.forward();

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          PageRouteBuilder(
            pageBuilder: (_, __, ___) => const AuthGate(),
            transitionsBuilder: (_, a, __, child) =>
                FadeTransition(opacity: a, child: child),
            transitionDuration: const Duration(milliseconds: 400),
          ),
        );
      }
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    final s    = AppStrings(lang);

    return Scaffold(
      backgroundColor: context.primaryBg,
      body: Center(
        child: FadeTransition(
          opacity: _fade,
          child: ScaleTransition(
            scale: _scale,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Logo circle
                Container(
                  width: 88,
                  height: 88,
                  decoration: BoxDecoration(
                    color: context.accent,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.health_and_safety,
                      color: Colors.white, size: 48),
                ),
                const SizedBox(height: 24),

                // App name
                Text(
                  s.appName,
                  style: TextStyle(
                    color: context.textPrimary,
                    fontSize: 36,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 6),

                // Local script name
                Text(
                  s.appNameLocal,
                  style: TextStyle(
                    color: context.textSec,
                    fontSize: 18,
                    fontWeight: FontWeight.w400,
                  ),
                ),
                const SizedBox(height: 16),

                // Tagline
                Text(
                  s.splashTagline,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: context.textSec,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 40),

                SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    color: context.accent,
                    strokeWidth: 2,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
