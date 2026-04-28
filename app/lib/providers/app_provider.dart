import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppProvider extends ChangeNotifier {
  static const _keyLang        = 'lang_code';
  static const _keyTheme       = 'theme_mode';
  static const _keyProfileName   = 'profile_name';
  static const _keyProfileAge    = 'profile_age';
  static const _keyProfileGender = 'profile_gender';
  static const _keyProfilePhone  = 'profile_phone';
  static const _keyGuest       = 'is_guest';

  String    _langCode  = 'en';
  ThemeMode _themeMode = ThemeMode.system;
  bool      _isGuest   = false;

  // User profile
  String _profileName   = '';
  String _profileAge    = '';
  String _profileGender = '';
  String _profilePhone  = '';

  String    get langCode  => _langCode;
  ThemeMode get themeMode => _themeMode;
  bool      get isGuest   => _isGuest;

  String get profileName   => _profileName;
  String get profileAge    => _profileAge;
  String get profileGender => _profileGender;
  String get profilePhone  => _profilePhone;
  bool   get hasProfile    => _profileName.trim().isNotEmpty && _profileAge.trim().isNotEmpty;

  AppProvider() {
    _load();
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    _langCode  = prefs.getString(_keyLang)  ?? 'en';
    final tm   = prefs.getString(_keyTheme) ?? 'system';
    _themeMode = switch (tm) {
      'light' => ThemeMode.light,
      'dark'  => ThemeMode.dark,
      _       => ThemeMode.system,
    };
    _profileName   = prefs.getString(_keyProfileName)   ?? '';
    _profileAge    = prefs.getString(_keyProfileAge)    ?? '';
    _profileGender = prefs.getString(_keyProfileGender) ?? '';
    _profilePhone  = prefs.getString(_keyProfilePhone)  ?? '';
    _isGuest       = prefs.getBool(_keyGuest)           ?? false;
    notifyListeners();
  }

  Future<void> setLanguage(String code) async {
    if (_langCode == code) return;
    _langCode = code;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyLang, code);
  }

  Future<void> setTheme(ThemeMode mode) async {
    if (_themeMode == mode) return;
    _themeMode = mode;
    notifyListeners();
    final tm = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark  => 'dark',
      _               => 'system',
    };
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyTheme, tm);
  }

  Future<void> setGuest(bool value) async {
    _isGuest = value;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_keyGuest, value);
  }

  Future<void> saveProfile({
    required String name,
    required String age,
    required String gender,
    String phone = '',
  }) async {
    _profileName   = name;
    _profileAge    = age;
    _profileGender = gender;
    _profilePhone  = phone;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyProfileName,   name);
    await prefs.setString(_keyProfileAge,    age);
    await prefs.setString(_keyProfileGender, gender);
    await prefs.setString(_keyProfilePhone,  phone);
  }
}
