import 'package:flutter/foundation.dart';

/// Central config — edit _kDevUrl for your machine's LAN IP when testing
/// on a physical device. For CI/prod pass --dart-define=API_BASE_URL=https://...
class AppConfig {
  AppConfig._();

  /// Android emulator → host machine is 10.0.2.2
  /// iOS simulator   → host machine is 127.0.0.1
  /// Physical device → use your LAN IP, e.g. http://192.168.1.10:8000
  static const _kEmulatorUrl = 'http://10.0.2.2:8000';
  static const _kIosSimUrl   = 'http://127.0.0.1:8000';

  static const _kEnvUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static String get apiBaseUrl {
    if (_kEnvUrl.isNotEmpty) return _kEnvUrl;
    if (defaultTargetPlatform == TargetPlatform.iOS) return _kIosSimUrl;
    return _kEmulatorUrl;
  }
}
