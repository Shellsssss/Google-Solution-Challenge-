import 'dart:convert';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../config.dart';

class ApiService {
  ApiService._();
  static final ApiService _instance = ApiService._();
  factory ApiService() => _instance;

  static String get _baseUrl => AppConfig.apiBaseUrl;

  /// Fetch symptom questions for a scan type.
  Future<List<Map<String, dynamic>>> getSymptomQuestions(String scanType) async {
    try {
      final res = await http
          .get(Uri.parse('$_baseUrl/api/v1/symptoms/$scanType'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return List<Map<String, dynamic>>.from(data['questions'] as List);
      }
    } catch (_) {}
    return _fallbackQuestions(scanType);
  }

  /// Send image + symptoms to backend.
  /// Returns map with keys: risk_level, confidence, explanation{en,hi,ta,te},
  /// nearest_centers, disclaimer. Returns null on failure.
  Future<Map<String, dynamic>?> analyze({
    required Uint8List imageBytes,
    required String scanType,
    required Map<String, String> symptoms,
    double? latitude,
    double? longitude,
  }) async {
    try {
      final body = jsonEncode({
        'image_base64': base64Encode(imageBytes),
        'scan_type':    scanType,
        'symptoms':     symptoms,
        if (latitude  != null) 'latitude':  latitude,
        if (longitude != null) 'longitude': longitude,
      });

      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/analyze'),
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
          .timeout(const Duration(seconds: 45));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  /// Generate a PDF report on the backend.
  /// Returns map with: success, report_id, download_url, filename.
  Future<Map<String, dynamic>?> generateReport(
      Map<String, dynamic> payload) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/report/generate'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 60));

      if (res.statusCode == 200) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (_) {}
    return null;
  }

  /// Download a PDF from the backend. Returns raw bytes or null.
  Future<Uint8List?> downloadReport(String reportId) async {
    try {
      final res = await http
          .get(Uri.parse('$_baseUrl/api/v1/report/download/$reportId'))
          .timeout(const Duration(seconds: 30));
      if (res.statusCode == 200) return res.bodyBytes;
    } catch (_) {}
    return null;
  }

  /// Get Gemini-generated questions based on the uploaded image.
  /// Returns list of question maps with id, en/hi/ta/te, options_en/hi/ta/te.
  Future<List<Map<String, dynamic>>> getImageQuestions({
    required Uint8List imageBytes,
    required String scanType,
  }) async {
    try {
      final body = jsonEncode({
        'image_base64': base64Encode(imageBytes),
        'scan_type': scanType,
      });
      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/image-questions'),
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
          .timeout(const Duration(seconds: 30));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return List<Map<String, dynamic>>.from(data['questions'] as List);
      }
    } catch (_) {}
    return _fallbackQuestions(scanType);
  }

  /// Send a chat message and get a health AI response.
  Future<String?> sendChatMessage({
    required String message,
    required List<Map<String, dynamic>> history,
    required String language,
  }) async {
    try {
      final body = jsonEncode({
        'message':  message,
        'history':  history,
        'language': language,
      });
      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/chat'),
            headers: {'Content-Type': 'application/json'},
            body: body,
          )
          .timeout(const Duration(seconds: 30));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body) as Map<String, dynamic>;
        return data['response'] as String?;
      }
    } catch (_) {}
    return null;
  }

  // ── Community ───────────────────────────────────────────────────────────────

  /// Fetch city-level community risk data (also triggers task generation).
  Future<List<Map<String, dynamic>>> getCommunityData() async {
    try {
      final res = await http
          .get(Uri.parse('$_baseUrl/api/v1/community/data'))
          .timeout(const Duration(seconds: 15));
      if (res.statusCode == 200) {
        return List<Map<String, dynamic>>.from(jsonDecode(res.body) as List);
      }
    } catch (_) {}
    return [];
  }

  // ── Volunteer ───────────────────────────────────────────────────────────────

  /// Register a new volunteer. Returns profile map with volunteer_id or null.
  Future<Map<String, dynamic>?> registerVolunteer({
    required String name,
    String phone = '',
    String org = 'Individual',
    double? lat,
    double? lng,
    List<String> skills = const [],
  }) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/volunteer/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'name': name,
              'phone': phone,
              'org': org,
              if (lat != null) 'lat': lat,
              if (lng != null) 'lng': lng,
              'skills': skills,
            }),
          )
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {}
    return null;
  }

  /// Get tasks split into available/accepted/completed for a volunteer.
  Future<Map<String, dynamic>?> getVolunteerTasks(String vid) async {
    try {
      final res = await http
          .get(Uri.parse('$_baseUrl/api/v1/volunteer/$vid/tasks'))
          .timeout(const Duration(seconds: 10));
      if (res.statusCode == 200) return jsonDecode(res.body) as Map<String, dynamic>;
    } catch (_) {}
    return null;
  }

  /// Accept a task.
  Future<bool> acceptTask(String vid, String tid) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/volunteer/$vid/tasks/$tid/accept'),
            headers: {'Content-Type': 'application/json'},
            body: '{}',
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Decline / unassign a task.
  Future<bool> declineTask(String vid, String tid) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/volunteer/$vid/tasks/$tid/decline'),
            headers: {'Content-Type': 'application/json'},
            body: '{}',
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  /// Mark a task complete.
  Future<bool> completeTask(String vid, String tid, {String notes = ''}) async {
    try {
      final res = await http
          .post(
            Uri.parse('$_baseUrl/api/v1/volunteer/$vid/tasks/$tid/complete'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'notes': notes}),
          )
          .timeout(const Duration(seconds: 10));
      return res.statusCode == 200;
    } catch (_) {
      return false;
    }
  }

  String get baseUrl => _baseUrl;

  List<Map<String, dynamic>> _fallbackQuestions(String scanType) {
    if (scanType == 'oral') {
      return [
        {
          'id': 'duration',
          'en': 'How many days have you had this problem?',
          'hi': 'यह समस्या कितने दिनों से है?',
          'ta': 'இந்தப் பிரச்சனை எத்தனை நாட்களாக உள்ளது?',
          'te': 'ఈ సమస్య ఎన్ని రోజులనుండి ఉంది?',
          'options_en': ['1-7 days', '1-4 weeks', 'More than 1 month'],
          'options_hi': ['1-7 दिन', '1-4 हफ्ते', '1 महीने से ज्यादा'],
        },
        {
          'id': 'pain',
          'en': 'Is there pain or burning in the mouth?',
          'hi': 'क्या मुँह में दर्द या जलन है?',
          'ta': 'வாயில் வலி அல்லது எரிச்சல் உள்ளதா?',
          'te': 'నోటిలో నొప్పి లేదా మంట ఉందా?',
          'options_en': ['Yes, severe', 'Mild', 'No'],
          'options_hi': ['हाँ, बहुत', 'थोड़ा', 'नहीं'],
        },
        {
          'id': 'patches',
          'en': 'Do you see white, red, or dark patches?',
          'hi': 'क्या सफेद, लाल, या काले धब्बे दिखते हैं?',
          'ta': 'வெள்ளை, சிவப்பு அல்லது கருப்பு திட்டுகள் தெரிகின்றனவா?',
          'te': 'తెలుపు, ఎరుపు లేదా చీకటి మచ్చలు కనిపిస్తున్నాయా?',
          'options_en': ['White patches', 'Red patches', 'None'],
          'options_hi': ['सफेद धब्बे', 'लाल धब्बे', 'कोई नहीं'],
        },
      ];
    }
    return [
      {
        'id': 'duration',
        'en': 'How long have you had this spot?',
        'hi': 'यह घाव/धब्बा कितने दिनों से है?',
        'ta': 'இந்த புண் அல்லது திட்டு எத்தனை நாட்களாக உள்ளது?',
        'te': 'ఈ మచ్చ ఎంత కాలం నుండి ఉంది?',
        'options_en': ['1-7 days', '1-4 weeks', 'More than 1 month'],
        'options_hi': ['1-7 दिन', '1-4 हफ्ते', '1 महीने से ज्यादा'],
      },
      {
        'id': 'pain',
        'en': 'Is there pain, itching, or burning?',
        'hi': 'क्या दर्द, खुजली, या जलन है?',
        'ta': 'வலி, அரிப்பு அல்லது எரிச்சல் உள்ளதா?',
        'te': 'నొప్పి, దురద లేదా మంట ఉందా?',
        'options_en': ['Yes, severe', 'Mild', 'No'],
        'options_hi': ['हाँ, बहुत', 'थोड़ा', 'नहीं'],
      },
      {
        'id': 'change',
        'en': 'Is it growing or changing color?',
        'hi': 'क्या यह बढ़ रहा है या रंग बदल रहा है?',
        'ta': 'இது பெரிதாகுகிறதா அல்லது நிறம் மாறுகிறதா?',
        'te': 'ఇది పెద్దదవుతుందా లేదా రంగు మారుతుందా?',
        'options_en': ['Yes, growing', 'Color changing', 'No change'],
        'options_hi': ['हाँ, बढ़ रहा है', 'रंग बदल रहा है', 'नहीं'],
      },
    ];
  }
}
