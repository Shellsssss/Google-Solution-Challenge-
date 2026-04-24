import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/app_provider.dart';
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
      home: const SplashScreen(),
    );
  }
}
