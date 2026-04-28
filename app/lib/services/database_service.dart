import 'package:flutter/foundation.dart';
import 'package:path/path.dart';
import 'package:sqflite/sqflite.dart';
import '../models/scan_result.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._();
  factory DatabaseService() => _instance;
  DatabaseService._();

  Database? _db;

  /// Increments whenever the scans table changes.
  /// HistoryScreen listens to this so it reloads after every new scan,
  /// even when kept alive in an IndexedStack.
  final ValueNotifier<int> changes = ValueNotifier<int>(0);

  Future<Database> get _database async {
    _db ??= await _init();
    return _db!;
  }

  Future<Database> _init() async {
    final path = join(await getDatabasesPath(), 'janarogya_v2.db');
    return openDatabase(
      path,
      version: 3,
      onCreate: (db, _) => _createTables(db),
      onUpgrade: (db, oldV, _) async {
        if (oldV < 2) await _createTables(db);
        if (oldV < 3) {
          await db.execute('ALTER TABLE scans ADD COLUMN image_bytes BLOB');
        }
      },
    );
  }

  Future<void> _createTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS scans (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_type      TEXT    NOT NULL,
        risk_level     TEXT    NOT NULL,
        confidence     REAL    NOT NULL,
        explanation_en TEXT    NOT NULL DEFAULT '',
        explanation_hi TEXT    NOT NULL DEFAULT '',
        explanation_ta TEXT    NOT NULL DEFAULT '',
        explanation_te TEXT    NOT NULL DEFAULT '',
        timestamp      TEXT    NOT NULL,
        image_bytes    BLOB
      )
    ''');
  }

  Future<int> saveScan(ScanResult result) async {
    final db = await _database;
    final id = await db.insert('scans', {
      'scan_type':      result.scanType.name,
      'risk_level':     result.riskLevel.name,
      'confidence':     result.confidence,
      'explanation_en': result.explanationEn,
      'explanation_hi': result.explanationHi,
      'explanation_ta': result.explanationTa,
      'explanation_te': result.explanationTe,
      'timestamp':      result.timestamp.toIso8601String(),
      if (result.imageBytes != null) 'image_bytes': result.imageBytes,
    });
    changes.value++;
    return id;
  }

  Future<List<ScanResult>> getHistory({int limit = 50}) async {
    final db   = await _database;
    final rows = await db.query('scans', orderBy: 'timestamp DESC', limit: limit);
    return rows.map(_row).toList();
  }

  Future<void> clearHistory() async {
    final db = await _database;
    await db.delete('scans');
    changes.value++;
  }

  ScanResult _row(Map<String, dynamic> r) => ScanResult(
    scanType:      ScanType.values.firstWhere((e) => e.name == r['scan_type'],
                      orElse: () => ScanType.oral),
    riskLevel:     RiskLevel.values.firstWhere((e) => e.name == r['risk_level'],
                      orElse: () => RiskLevel.invalid),
    confidence:    (r['confidence'] as num).toDouble(),
    explanationEn: r['explanation_en'] as String? ?? r['english_msg'] as String? ?? '',
    explanationHi: r['explanation_hi'] as String? ?? r['hindi_msg']   as String? ?? '',
    explanationTa: r['explanation_ta'] as String? ?? '',
    explanationTe: r['explanation_te'] as String? ?? '',
    timestamp:     DateTime.parse(r['timestamp'] as String),
    imageBytes:    r['image_bytes'] as Uint8List?,
  );
}
