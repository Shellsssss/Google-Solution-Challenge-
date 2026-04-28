import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../l10n/app_strings.dart';
import '../models/scan_result.dart';
import '../providers/app_provider.dart';
import '../services/database_service.dart';
import '../theme/app_theme.dart';
import 'result_screen.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  List<ScanResult> _all     = [];
  String           _filter  = 'all';
  bool             _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
    DatabaseService().changes.addListener(_load);
  }

  @override
  void dispose() {
    DatabaseService().changes.removeListener(_load);
    super.dispose();
  }

  Future<void> _load() async {
    if (mounted) setState(() => _loading = true);
    final rows = await DatabaseService().getHistory();
    if (mounted) setState(() { _all = rows; _loading = false; });
  }

  List<ScanResult> get _filtered {
    if (_filter == 'low')     return _all.where((r) => r.riskLevel == RiskLevel.low).toList();
    if (_filter == 'high')    return _all.where((r) => r.riskLevel == RiskLevel.high).toList();
    if (_filter == 'invalid') return _all.where((r) => r.riskLevel == RiskLevel.invalid).toList();
    return _all;
  }

  (Color bg, Color fg, IconData icon, String label) _riskStyle(RiskLevel r, AppStrings s) =>
      switch (r) {
        RiskLevel.low     => (JaColors.brandSoft, JaColors.brand,  Icons.check_circle_outline, s.resultLowRisk),
        RiskLevel.high    => (JaColors.dangerSoft, JaColors.danger, Icons.warning_amber_outlined, s.resultHighRisk),
        RiskLevel.invalid => (JaColors.warnSoft,   JaColors.warn,   Icons.camera_alt_outlined, s.resultInvalid),
      };

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<AppProvider>().langCode;
    final s    = AppStrings(lang);

    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: AppBar(
        title: Text(s.historyTitle,
            style: GoogleFonts.nunito(fontSize: 22, fontWeight: FontWeight.w800, color: JaColors.ink)),
        automaticallyImplyLeading: false,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: JaColors.inkSoft),
            onPressed: _load,
          ),
        ],
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1),
          child: Container(height: 1, color: JaColors.line),
        ),
      ),
      body: Column(children: [
        // ── Filter chips ───────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(children: [
              _FilterChip(label: s.historyFilterAll,  value: 'all',     current: _filter, onTap: (v) => setState(() => _filter = v)),
              const SizedBox(width: 8),
              _FilterChip(label: s.historyFilterLow,  value: 'low',     current: _filter, onTap: (v) => setState(() => _filter = v), activeColor: JaColors.brand),
              const SizedBox(width: 8),
              _FilterChip(label: s.historyFilterHigh, value: 'high',    current: _filter, onTap: (v) => setState(() => _filter = v), activeColor: JaColors.danger),
              const SizedBox(width: 8),
              _FilterChip(label: s.historyFilterInv,  value: 'invalid', current: _filter, onTap: (v) => setState(() => _filter = v), activeColor: JaColors.warn),
            ]),
          ),
        ),
        Container(height: 1, color: JaColors.line),

        // ── Content ────────────────────────────────────────────────────
        if (_loading)
          const Expanded(child: Center(child: CircularProgressIndicator(color: JaColors.brand)))
        else if (_filtered.isEmpty)
          Expanded(child: _EmptyState(s: s))
        else
          Expanded(
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _filtered.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, i) {
                final r = _filtered[i];
                final (bg, fg, icon, label) = _riskStyle(r.riskLevel, s);
                final dateStr = DateFormat('dd MMM yyyy, hh:mm a').format(r.timestamp);

                return InkWell(
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => ResultScreen(result: r, fromHistory: true),
                    ),
                  ),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: JaColors.surface,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: JaColors.line),
                      boxShadow: JaColors.cardShadow,
                    ),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      // Icon circle
                      Container(
                        width: 48, height: 48,
                        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(12)),
                        child: Icon(icon, color: fg, size: 22),
                      ),
                      const SizedBox(width: 14),
                      // Main info
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Text(r.scanLabel,
                              style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w700, color: JaColors.ink)),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                            decoration: BoxDecoration(
                              color: bg,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: fg.withValues(alpha: 0.3)),
                            ),
                            child: Text(label,
                                style: GoogleFonts.notoSans(fontSize: 11, fontWeight: FontWeight.w700, color: fg)),
                          ),
                        ]),
                        const SizedBox(height: 4),
                        Text(dateStr,
                            style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft)),
                      ])),
                      // Confidence
                      Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                        Text('${(r.confidence * 100).toStringAsFixed(0)}%',
                            style: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w800, color: fg)),
                        Text(s.historyConfidence,
                            style: GoogleFonts.notoSans(fontSize: 11, color: JaColors.inkSoft)),
                      ]),
                      const SizedBox(width: 6),
                      Icon(Icons.chevron_right, color: JaColors.inkSoft, size: 22),
                    ]),
                  ),
                );
              },
            ),
          ),
      ]),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final String value;
  final String current;
  final void Function(String) onTap;
  final Color activeColor;

  const _FilterChip({
    required this.label,
    required this.value,
    required this.current,
    required this.onTap,
    this.activeColor = JaColors.brand,
  });

  @override
  Widget build(BuildContext context) {
    final active = current == value;
    return GestureDetector(
      onTap: () => onTap(value),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: active ? activeColor : JaColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? activeColor : JaColors.line,
            width: active ? 1.5 : 1,
          ),
        ),
        child: Text(label,
            style: GoogleFonts.notoSans(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: active ? Colors.white : JaColors.inkSoft,
            )),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final AppStrings s;
  const _EmptyState({required this.s});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(color: JaColors.brandSoft, borderRadius: BorderRadius.circular(20)),
          child: const Icon(Icons.history_outlined, color: JaColors.brand, size: 40),
        ),
        const SizedBox(height: 20),
        Text(s.historyEmpty,
            style: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w700, color: JaColors.ink)),
        const SizedBox(height: 6),
        Text(s.historyEmptyHint,
            textAlign: TextAlign.center,
            style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.inkSoft)),
      ]),
    );
  }
}
