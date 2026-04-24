import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ── Warm palette ──────────────────────────────────────────────────────────────
class JaColors {
  static const bg         = Color(0xFFFFF9F1);
  static const surface    = Color(0xFFFFFFFF);
  static const ink        = Color(0xFF2A241D);
  static const inkSoft    = Color(0xFF6B5F52);
  static const line       = Color(0xFFE8D9C4);
  static const brand      = Color(0xFF1F7A5A);
  static const brandDark  = Color(0xFF155C43);
  static const brandSoft  = Color(0xFFE1F1E8);
  static const accent     = Color(0xFFE0803A);
  static const accentSoft = Color(0xFFFDE7D5);
  static const danger     = Color(0xFFC13A2B);
  static const dangerSoft = Color(0xFFFBE0DB);
  static const warn       = Color(0xFFE6A817);
  static const warnSoft   = Color(0xFFFFF2D0);

  static const cardShadow = [
    BoxShadow(color: Color(0x18000000), blurRadius: 24, offset: Offset(0, 8)),
  ];
}

// ── Semantic extensions ───────────────────────────────────────────────────────
extension JaColorsX on BuildContext {
  Color get bg         => JaColors.bg;
  Color get surface    => JaColors.surface;
  Color get ink        => JaColors.ink;
  Color get inkSoft    => JaColors.inkSoft;
  Color get line       => JaColors.line;
  Color get brand      => JaColors.brand;
  Color get brandDark  => JaColors.brandDark;
  Color get brandSoft  => JaColors.brandSoft;
  Color get accent     => JaColors.accent;
  Color get accentSoft => JaColors.accentSoft;
  Color get danger     => JaColors.danger;
  Color get dangerSoft => JaColors.dangerSoft;
  Color get warn       => JaColors.warn;
  Color get warnSoft   => JaColors.warnSoft;

  // Legacy compat
  Color get primaryBg   => JaColors.bg;
  Color get secondaryBg => JaColors.surface;
  Color get cardBg      => JaColors.surface;
  Color get success     => JaColors.brand;
  Color get warning     => JaColors.warn;
  Color get textPrimary => JaColors.ink;
  Color get textSec     => JaColors.inkSoft;
  Color get border      => JaColors.line;
  bool  get isDark      => false;
}

// ── Typography ────────────────────────────────────────────────────────────────
class JaText {
  static TextStyle heading(double size, {Color color = JaColors.ink, FontWeight weight = FontWeight.w800}) =>
      GoogleFonts.nunito(fontSize: size, fontWeight: weight, color: color, height: 1.2);

  static TextStyle body(double size, {Color color = JaColors.ink, FontWeight weight = FontWeight.w400}) =>
      GoogleFonts.notoSans(fontSize: size, fontWeight: weight, color: color, height: 1.55);

  static TextStyle label(double size, {Color color = JaColors.inkSoft}) =>
      GoogleFonts.notoSans(fontSize: size, fontWeight: FontWeight.w700, color: color);
}

// ── Theme ─────────────────────────────────────────────────────────────────────
class AppTheme {
  static ThemeData get() => ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    scaffoldBackgroundColor: JaColors.bg,
    colorScheme: const ColorScheme.light(
      primary: JaColors.brand,
      secondary: JaColors.accent,
      surface: JaColors.surface,
      error: JaColors.danger,
      onPrimary: Colors.white,
      onSurface: JaColors.ink,
      onError: Colors.white,
    ),
    textTheme: GoogleFonts.notoSansTextTheme().copyWith(
      displayLarge:   GoogleFonts.nunito(fontSize: 40, fontWeight: FontWeight.w800, color: JaColors.ink),
      displayMedium:  GoogleFonts.nunito(fontSize: 32, fontWeight: FontWeight.w800, color: JaColors.ink),
      headlineLarge:  GoogleFonts.nunito(fontSize: 28, fontWeight: FontWeight.w800, color: JaColors.ink),
      headlineMedium: GoogleFonts.nunito(fontSize: 24, fontWeight: FontWeight.w700, color: JaColors.ink),
      titleLarge:     GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w700, color: JaColors.ink),
      titleMedium:    GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700, color: JaColors.ink),
      bodyLarge:      GoogleFonts.notoSans(fontSize: 17, color: JaColors.ink),
      bodyMedium:     GoogleFonts.notoSans(fontSize: 15, color: JaColors.ink),
      bodySmall:      GoogleFonts.notoSans(fontSize: 13, color: JaColors.inkSoft),
      labelLarge:     GoogleFonts.notoSans(fontSize: 14, fontWeight: FontWeight.w700, color: JaColors.ink),
      labelSmall:     GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.5),
    ),
    appBarTheme: AppBarTheme(
      backgroundColor: JaColors.surface,
      foregroundColor: JaColors.ink,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w800, color: JaColors.ink),
      iconTheme: const IconThemeData(color: JaColors.ink),
    ),
    cardTheme: CardThemeData(
      color: JaColors.surface,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: const BorderSide(color: JaColors.line),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: JaColors.brand,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700),
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: JaColors.brand,
        side: const BorderSide(color: JaColors.brand, width: 2),
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        textStyle: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w700),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: JaColors.surface,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: JaColors.line, width: 1.5),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: JaColors.line, width: 1.5),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: JaColors.brand, width: 2),
      ),
      hintStyle: GoogleFonts.notoSans(fontSize: 15, color: JaColors.inkSoft),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    ),
    dividerTheme: const DividerThemeData(color: JaColors.line, thickness: 1),
    chipTheme: ChipThemeData(
      backgroundColor: JaColors.brandSoft,
      labelStyle: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w600, color: JaColors.brandDark),
      side: BorderSide.none,
      shape: const StadiumBorder(),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
    ),
    bottomNavigationBarTheme: BottomNavigationBarThemeData(
      backgroundColor: JaColors.surface,
      selectedItemColor: JaColors.brand,
      unselectedItemColor: JaColors.inkSoft,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      selectedLabelStyle: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700),
      unselectedLabelStyle: GoogleFonts.notoSans(fontSize: 12),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: JaColors.brand,
      linearTrackColor: JaColors.line,
      circularTrackColor: JaColors.line,
    ),
  );

  static ThemeData light() => get();
  static ThemeData dark()  => get();
}

// Legacy AppColors compat
class AppColors {
  static const lightPrimaryBg   = JaColors.bg;
  static const lightSecondaryBg = JaColors.surface;
  static const lightCardBg      = JaColors.surface;
  static const lightAccent      = JaColors.brand;
  static const lightAccentSec   = JaColors.brandSoft;
  static const lightSuccess     = JaColors.brand;
  static const lightWarning     = JaColors.warn;
  static const lightDanger      = JaColors.danger;
  static const lightTextPrimary = JaColors.ink;
  static const lightTextSec     = JaColors.inkSoft;
  static const lightBorder      = JaColors.line;
  static const darkPrimaryBg    = JaColors.bg;
  static const darkSecondaryBg  = JaColors.surface;
  static const darkCardBg       = JaColors.surface;
  static const darkAccent       = JaColors.brand;
  static const darkAccentSec    = JaColors.brandSoft;
  static const darkSuccess      = JaColors.brand;
  static const darkWarning      = JaColors.warn;
  static const darkDanger       = JaColors.danger;
  static const darkTextPrimary  = JaColors.ink;
  static const darkTextSec      = JaColors.inkSoft;
  static const darkBorder       = JaColors.line;
}
