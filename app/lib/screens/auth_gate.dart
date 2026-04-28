import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'login_screen.dart';
import 'main_shell.dart';

/// Routes between LoginScreen and MainShell based on Firebase auth state.
/// Lives between SplashScreen and the rest of the app.
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: AuthService.instance.authStateChanges,
      builder: (context, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            backgroundColor: JaColors.bg,
            body: Center(child: CircularProgressIndicator(color: JaColors.brand)),
          );
        }
        return snap.data == null ? const LoginScreen() : const MainShell();
      },
    );
  }
}
