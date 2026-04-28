import 'dart:typed_data';

enum ScanType  { oral, skin }
enum RiskLevel { low, high, invalid }

class ScanResult {
  final ScanType    scanType;
  final RiskLevel   riskLevel;
  final double      confidence;
  final String      explanationEn;
  final String      explanationHi;
  final String      explanationTa;
  final String      explanationTe;
  final String      concern;       // Gemini-generated layman "what to do" text
  final DateTime    timestamp;
  final Map<String, String>? symptoms;  // {English question text: English answer}
  final Uint8List?  imageBytes;          // Photo bytes — persisted in history so reports can include the image

  // Legacy — kept for DB compatibility
  String get hindiMessage   => explanationHi;
  String get englishMessage => explanationEn;

  const ScanResult({
    required this.scanType,
    required this.riskLevel,
    required this.confidence,
    required this.explanationEn,
    this.explanationHi = '',
    this.explanationTa = '',
    this.explanationTe = '',
    this.concern       = '',
    required this.timestamp,
    this.symptoms,
    this.imageBytes,
  });

  ScanResult copyWith({
    ScanType?   scanType,
    RiskLevel?  riskLevel,
    double?     confidence,
    String?     explanationEn,
    String?     explanationHi,
    String?     explanationTa,
    String?     explanationTe,
    String?     concern,
    DateTime?   timestamp,
    Map<String, String>? symptoms,
    Uint8List?  imageBytes,
  }) => ScanResult(
    scanType:      scanType      ?? this.scanType,
    riskLevel:     riskLevel     ?? this.riskLevel,
    confidence:    confidence    ?? this.confidence,
    explanationEn: explanationEn ?? this.explanationEn,
    explanationHi: explanationHi ?? this.explanationHi,
    explanationTa: explanationTa ?? this.explanationTa,
    explanationTe: explanationTe ?? this.explanationTe,
    concern:       concern       ?? this.concern,
    timestamp:     timestamp     ?? this.timestamp,
    symptoms:      symptoms      ?? this.symptoms,
    imageBytes:    imageBytes    ?? this.imageBytes,
  );

  /// Get explanation for a given language code.
  String explanationFor(String lang) {
    switch (lang) {
      case 'hi': return explanationHi.isNotEmpty ? explanationHi : explanationEn;
      case 'ta': return explanationTa.isNotEmpty ? explanationTa : explanationEn;
      case 'te': return explanationTe.isNotEmpty ? explanationTe : explanationEn;
      default:   return explanationEn;
    }
  }

  String get riskKey => switch (riskLevel) {
    RiskLevel.low     => 'LOW_RISK',
    RiskLevel.high    => 'HIGH_RISK',
    RiskLevel.invalid => 'INVALID',
  };

  String get scanLabel => scanType == ScanType.oral ? 'Oral' : 'Skin';
}
