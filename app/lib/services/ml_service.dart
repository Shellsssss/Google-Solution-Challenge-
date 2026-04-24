import 'dart:math' as math;
import 'dart:typed_data';
import 'package:image/image.dart' as img;
import 'package:tflite_flutter/tflite_flutter.dart';
import '../models/scan_result.dart';

const int _inputSize = 224;
const int _numClasses = 2; // LOW_RISK=0, HIGH_RISK=1

const _messages = {
  RiskLevel.low: (
    en: 'No serious signs detected in this scan. Keep monitoring and do regular checkups.',
    hi: 'इस जांच में कोई गंभीर संकेत नहीं मिले। नियमित जांच करते रहें।',
    ta: 'இந்த ஸ்கேனில் தீவிரமான அறிகுறிகள் கண்டறியப்படவில்லை. தொடர்ந்து கண்காணிக்கவும்.',
    te: 'ఈ స్కాన్‌లో తీవ్రమైన సంకేతాలు కనుగొనబడలేదు. నిరంతరం పర్యవేక్షించండి.',
  ),
  RiskLevel.high: (
    en: 'Some signs need medical attention. Please see a doctor as soon as possible.',
    hi: 'इस तस्वीर में कुछ बातें हैं जिन पर ध्यान देना जरूरी है। जल्द डॉक्टर से मिलें।',
    ta: 'சில அறிகுறிகளுக்கு மருத்துவ கவனிப்பு தேவை. விரைவில் மருத்துவரை அணுகவும்.',
    te: 'కొన్ని సంకేతాలకు వైద్య శ్రద్ధ అవసరం. వీలైనంత త్వరగా వైద్యుడిని చూడండి.',
  ),
  RiskLevel.invalid: (
    en: 'Photo not suitable for screening. Please retake in good lighting.',
    hi: 'तस्वीर जांच के लिए उपयुक्त नहीं। कृपया अच्छी रोशनी में दोबारा लें।',
    ta: 'புகைப்படம் திரையிடலுக்கு ஏற்றதாக இல்லை. நல்ல வெளிச்சத்தில் மீண்டும் எடுக்கவும்.',
    te: 'ఫోటో స్క్రీనింగ్‌కి అనువుగా లేదు. మంచి వెలుతురులో తిరిగి తీయండి.',
  ),
};

class MLService {
  static final MLService _instance = MLService._();
  factory MLService() => _instance;
  MLService._();

  Interpreter? _skinInterpreter;
  Interpreter? _oralInterpreter;
  bool _skinLoaded = false;
  bool _oralLoaded = false;

  Future<void> loadModel(ScanType type) async {
    try {
      if (type == ScanType.skin && !_skinLoaded) {
        _skinInterpreter = await Interpreter.fromAsset(
          'assets/models/janarogya_skin_int8.tflite',
          options: InterpreterOptions()..threads = 2,
        );
        _skinLoaded = true;
      } else if (type == ScanType.oral && !_oralLoaded) {
        _oralInterpreter = await Interpreter.fromAsset(
          'assets/models/janarogya_oral_int8.tflite',
          options: InterpreterOptions()..threads = 2,
        );
        _oralLoaded = true;
      }
    } catch (_) {
      // Model not found — analyze() will use fallback
    }
  }

  Future<ScanResult> analyze(Uint8List imageBytes, ScanType scanType) async {
    await loadModel(scanType);

    final interpreter =
        scanType == ScanType.oral ? _oralInterpreter : _skinInterpreter;

    if (interpreter == null) {
      return _build(scanType, RiskLevel.invalid, 0.5);
    }

    try {
      final raw = img.decodeImage(imageBytes);
      if (raw == null) return _build(scanType, RiskLevel.invalid, 0.0);

      // Center-crop to square before resizing
      final side = raw.width < raw.height ? raw.width : raw.height;
      final dx = (raw.width - side) ~/ 2;
      final dy = (raw.height - side) ~/ 2;
      final cropped = img.copyCrop(raw, x: dx, y: dy, width: side, height: side);
      final resized =
          img.copyResize(cropped, width: _inputSize, height: _inputSize);

      final inputDetails = interpreter.getInputTensors().first;
      final outputDetails = interpreter.getOutputTensors().first;
      final isInt8 = inputDetails.type == TensorType.int8 ||
          inputDetails.type == TensorType.uint8;

      dynamic inputTensor;
      if (isInt8) {
        final scale = inputDetails.params.scale;
        final zp = inputDetails.params.zeroPoint;
        inputTensor = List.generate(
          1,
          (_) => List.generate(
            _inputSize,
            (y) => List.generate(
              _inputSize,
              (x) {
                final p = resized.getPixel(x, y);
                int q(num v) {
                  final qv = (v / 255.0 / scale + zp).round();
                  return qv.clamp(-128, 127);
                }
                return [q(p.r), q(p.g), q(p.b)];
              },
            ),
          ),
        );
      } else {
        inputTensor = List.generate(
          1,
          (_) => List.generate(
            _inputSize,
            (y) => List.generate(
              _inputSize,
              (x) {
                final p = resized.getPixel(x, y);
                return [
                  p.r.toDouble() / 255.0,
                  p.g.toDouble() / 255.0,
                  p.b.toDouble() / 255.0,
                ];
              },
            ),
          ),
        );
      }

      final outIsInt8 = outputDetails.type == TensorType.int8 ||
          outputDetails.type == TensorType.uint8;

      dynamic outputTensor;
      if (outIsInt8) {
        outputTensor = [List.filled(_numClasses, 0)];
      } else {
        outputTensor = [List.filled(_numClasses, 0.0)];
      }

      interpreter.run(inputTensor, outputTensor);

      List<double> scores;
      if (outIsInt8) {
        final scale = outputDetails.params.scale;
        final zp = outputDetails.params.zeroPoint;
        scores = [
          for (final v in outputTensor[0]) ((v as num).toInt() - zp) * scale,
        ];
      } else {
        scores = List<double>.from(
            outputTensor[0].map((e) => (e as num).toDouble()));
      }

      final maxVal = scores.reduce((a, b) => a > b ? a : b);
      final minVal = scores.reduce((a, b) => a < b ? a : b);
      if (maxVal > 1.01 || minVal < -0.01) {
        final exps = scores.map((s) => math.exp(s - maxVal)).toList();
        final sum = exps.reduce((a, b) => a + b);
        scores = exps.map((e) => e / sum).toList();
      }

      final best = scores.reduce((a, b) => a > b ? a : b);
      final idx = scores.indexOf(best);
      final risk = switch (idx) {
        0 => RiskLevel.low,
        1 => RiskLevel.high,
        _ => RiskLevel.invalid,
      };

      return _build(scanType, risk, best);
    } catch (_) {
      return _build(scanType, RiskLevel.invalid, 0.5);
    }
  }

  ScanResult _build(ScanType type, RiskLevel risk, double conf) {
    final m = _messages[risk]!;
    return ScanResult(
      scanType:      type,
      riskLevel:     risk,
      confidence:    conf,
      explanationEn: m.en,
      explanationHi: m.hi,
      explanationTa: m.ta,
      explanationTe: m.te,
      timestamp:     DateTime.now(),
    );
  }

  void dispose() {
    _skinInterpreter?.close();
    _oralInterpreter?.close();
  }
}
