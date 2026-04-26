import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'scan_entry_screen.dart';
import 'clinics_screen.dart';
import 'community_screen.dart';
import 'history_screen.dart';
import 'settings_screen.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _idx = 0;

  final _screens = const [
    HomeScreen(),
    ScanEntryScreen(),
    ClinicsScreen(),
    CommunityScreen(),
    HistoryScreen(),
    SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    final s    = AppStrings(lang);

    return Scaffold(
      body: IndexedStack(index: _idx, children: _screens),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: JaColors.line, width: 1)),
        ),
        child: BottomNavigationBar(
          currentIndex: _idx,
          onTap: (i) => setState(() => _idx = i),
          backgroundColor: JaColors.surface,
          selectedItemColor: JaColors.brand,
          unselectedItemColor: JaColors.inkSoft,
          type: BottomNavigationBarType.fixed,
          elevation: 0,
          selectedLabelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
          unselectedLabelStyle: const TextStyle(fontSize: 12),
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_outlined),
              activeIcon: const Icon(Icons.home),
              label: s.navHome,
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.camera_alt_outlined),
              activeIcon: const Icon(Icons.camera_alt),
              label: s.navScan,
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.local_hospital_outlined),
              activeIcon: Icon(Icons.local_hospital),
              label: 'Clinics',
            ),
            const BottomNavigationBarItem(
              icon: Icon(Icons.map_outlined),
              activeIcon: Icon(Icons.map),
              label: 'Community',
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.history_outlined),
              activeIcon: const Icon(Icons.history),
              label: s.navHistory,
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.settings_outlined),
              activeIcon: const Icon(Icons.settings),
              label: s.navSettings,
            ),
          ],
        ),
      ),
    );
  }
}
