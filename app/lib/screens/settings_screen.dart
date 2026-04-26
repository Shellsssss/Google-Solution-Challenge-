import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../l10n/app_strings.dart';
import '../providers/app_provider.dart';
import '../services/database_service.dart';
import '../theme/app_theme.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    final s    = AppStrings(lang);

    return Scaffold(
      backgroundColor: context.primaryBg,
      appBar: AppBar(
        title: Text(s.settingsTitle),
        automaticallyImplyLeading: false,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Language section
          _SectionHeader(title: s.settingsLanguage),
          _LangTile(),
          const SizedBox(height: 16),

          // Theme section
          _SectionHeader(title: s.settingsTheme),
          _ThemeTile(),
          const SizedBox(height: 16),

          // Helpline
          _SectionHeader(title: s.helplineLabel),
          _InfoCard(
            icon: Icons.phone_outlined,
            iconColor: context.danger,
            title: s.helplineNumber,
            subtitle: 'Toll-Free 24/7',
            onTap: () async {
              final uri = Uri(scheme: 'tel', path: '18001112345');
              if (await canLaunchUrl(uri)) await launchUrl(uri);
            },
          ),
          const SizedBox(height: 16),

          // Clear history
          _SectionHeader(title: s.historyTitle),
          _InfoCard(
            icon: Icons.delete_outline,
            iconColor: context.danger,
            title: s.settingsClearHistory,
            subtitle: '',
            destructive: true,
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  backgroundColor: context.cardBg,
                  title: Text(s.settingsClearHistory,
                      style: TextStyle(color: context.textPrimary)),
                  content: Text(s.settingsClearConfirm,
                      style: TextStyle(color: context.textSec)),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: Text(s.actionCancel),
                    ),
                    TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      style: TextButton.styleFrom(
                          foregroundColor: context.danger),
                      child: Text(s.actionConfirm),
                    ),
                  ],
                ),
              );
              if (confirmed == true) {
                await DatabaseService().clearHistory();
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('History cleared')),
                  );
                }
              }
            },
          ),
          const SizedBox(height: 16),

          // Disclaimer
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: context.warning.withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                  color: context.warning.withValues(alpha: 0.4)),
            ),
            child: Text(s.settingsDisclaimer,
                style: TextStyle(
                    color: context.textSec, fontSize: 12,
                    fontStyle: FontStyle.italic, height: 1.5)),
          ),
          const SizedBox(height: 16),

          // Sign out
          const _SectionHeader(title: 'Account'),
          _InfoCard(
            icon: Icons.logout,
            iconColor: context.danger,
            title: 'Sign Out',
            subtitle: '',
            destructive: true,
            onTap: () async {
              try {
                await FirebaseAuth.instance.signOut();
              } catch (_) {}
            },
          ),
          const SizedBox(height: 16),

          // Version
          Center(
            child: Text('${s.settingsVersion}: 1.0.0',
                style: TextStyle(color: context.textSec, fontSize: 12)),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: 8),
        child: Text(title,
            style: TextStyle(
                color: context.textSec,
                fontSize: 12, fontWeight: FontWeight.w600,
                letterSpacing: 0.8)),
      );
}

class _LangTile extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final lang     = provider.langCode;

    return Container(
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border),
      ),
      child: Column(
        children: AppStrings.supportedLangs.map((code) {
          final selected = code == lang;
          return ListTile(
            title: Text(AppStrings.langNames[code] ?? code,
                style: TextStyle(
                    color: context.textPrimary,
                    fontWeight: selected
                        ? FontWeight.w600
                        : FontWeight.normal)),
            trailing: selected
                ? Icon(Icons.check_circle, color: context.accent, size: 20)
                : null,
            onTap: () => provider.setLanguage(code),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 2),
          );
        }).toList(),
      ),
    );
  }
}

class _ThemeTile extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AppProvider>();
    final current  = provider.themeMode;
    final lang     = provider.langCode;
    final s        = AppStrings(lang);

    final options = [
      (ThemeMode.system, s.settingsThemeSystem, Icons.brightness_auto_outlined),
      (ThemeMode.light,  s.settingsThemeLight,  Icons.light_mode_outlined),
      (ThemeMode.dark,   s.settingsThemeDark,   Icons.dark_mode_outlined),
    ];

    return Container(
      decoration: BoxDecoration(
        color: context.cardBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: context.border),
      ),
      child: Column(
        children: options.map((opt) {
          final (mode, label, icon) = opt;
          final selected = current == mode;
          return ListTile(
            leading: Icon(icon,
                color: selected ? context.accent : context.textSec,
                size: 20),
            title: Text(label,
                style: TextStyle(
                    color: context.textPrimary,
                    fontWeight: selected
                        ? FontWeight.w600
                        : FontWeight.normal)),
            trailing: selected
                ? Icon(Icons.check_circle, color: context.accent, size: 20)
                : null,
            onTap: () => provider.setTheme(mode),
            contentPadding: const EdgeInsets.symmetric(
                horizontal: 16, vertical: 2),
          );
        }).toList(),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon;
  final Color    iconColor;
  final String   title;
  final String   subtitle;
  final VoidCallback onTap;
  final bool destructive;

  const _InfoCard({
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.destructive = false,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: context.cardBg,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
              color: destructive
                  ? context.danger.withValues(alpha: 0.3)
                  : context.border),
        ),
        child: Row(children: [
          Container(
            width: 40, height: 40,
            decoration: BoxDecoration(
              color: iconColor.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style: TextStyle(
                        color: destructive ? context.danger : context.textPrimary,
                        fontSize: 14, fontWeight: FontWeight.w500)),
                if (subtitle.isNotEmpty)
                  Text(subtitle,
                      style: TextStyle(
                          color: context.textSec, fontSize: 12)),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_ios,
              color: context.textSec, size: 14),
        ]),
      ),
    );
  }
}
