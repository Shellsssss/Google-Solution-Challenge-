import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'providers/app_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_shell.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';

class JanArogyaApp extends StatelessWidget {
  const JanArogyaApp({super.key});

  @override
  Widget build(BuildContext context) {
    context.watch<AppProvider>(); // rebuild on lang change

    return MaterialApp(
      title: 'JanArogya',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.get(),
      home: const _AuthGate(),
    );
  }
}

class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    if (context.watch<AppProvider>().isGuest) return const MainShell();

    return StreamBuilder<User?>(
      stream: _authStream(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: Center(child: CircularProgressIndicator(color: JaColors.brand)));
        }
        // If signed in (including anonymous), go to app
        if (snapshot.hasData && snapshot.data != null) {
          return const SplashScreen();
        }
        return const LoginScreen();
      },
    );
  }

  Stream<User?> _authStream() {
    try {
      return FirebaseAuth.instance.authStateChanges();
    } catch (_) {
      // Firebase not configured — skip auth
      return Stream.value(null);
    }
  }
}
