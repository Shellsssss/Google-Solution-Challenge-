import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/volunteer_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import 'volunteer_screen.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final _api = ApiService();
  List<CommunityZone> _zones = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final raw = await _api.getCommunityData();
    setState(() {
      _zones = raw.map(CommunityZone.fromJson).toList();
      _loading = false;
    });
  }

  Color _riskColor(String zone) => switch (zone) {
        'HIGH'   => JaColors.danger,
        'MEDIUM' => JaColors.warn,
        _        => JaColors.brand,
      };

  Color _riskBg(String zone) => switch (zone) {
        'HIGH'   => JaColors.dangerSoft,
        'MEDIUM' => JaColors.warnSoft,
        _        => JaColors.brandSoft,
      };

  String _riskEmoji(String zone) => switch (zone) {
        'HIGH'   => '🔴',
        'MEDIUM' => '🟡',
        _        => '🟢',
      };

  @override
  Widget build(BuildContext context) {
    final totalScans   = _zones.fold(0, (s, z) => s + z.total);
    final highRiskZones = _zones.where((z) => z.riskZone == 'HIGH').length;
    final campNeeded   = _zones.where((z) => z.needsScreeningCamp && !z.handled).length;

    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: AppBar(
        backgroundColor: JaColors.surface,
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Community Insights',
              style: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w800, color: JaColors.ink)),
          Text('Area-level screening risk data',
              style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft)),
        ]),
        bottom: PreferredSize(
            preferredSize: const Size.fromHeight(1),
            child: Container(height: 1, color: JaColors.line)),
        actions: [
          IconButton(
            icon: const Icon(Icons.volunteer_activism, color: JaColors.brand),
            tooltip: 'Volunteer Dashboard',
            onPressed: () => Navigator.push(
                context, MaterialPageRoute(builder: (_) => const VolunteerScreen())),
          ),
          IconButton(
            icon: const Icon(Icons.refresh, color: JaColors.inkSoft),
            onPressed: _load,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: JaColors.brand))
          : RefreshIndicator(
              color: JaColors.brand,
              onRefresh: _load,
              child: CustomScrollView(
                slivers: [
                  // KPI strip
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Row(children: [
                        _KpiCard(label: 'Total Scans', value: '$totalScans', color: JaColors.brand),
                        const SizedBox(width: 10),
                        _KpiCard(label: 'High-Risk Areas', value: '$highRiskZones', color: JaColors.danger),
                        const SizedBox(width: 10),
                        _KpiCard(label: 'Camps Needed', value: '$campNeeded', color: JaColors.warn),
                      ]),
                    ),
                  ),

                  // Camp recommendation banner
                  if (campNeeded > 0)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: JaColors.dangerSoft,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: JaColors.danger.withAlpha(80)),
                          ),
                          child: Row(children: [
                            const Text('⚠', style: TextStyle(fontSize: 22)),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text('Screening Camps Recommended',
                                    style: GoogleFonts.nunito(fontWeight: FontWeight.w800, color: JaColors.danger, fontSize: 14)),
                                Text(
                                  _zones.where((z) => z.needsScreeningCamp && !z.handled).map((z) => z.city).join(', '),
                                  style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.danger.withAlpha(200)),
                                ),
                              ]),
                            ),
                            TextButton(
                              onPressed: () => Navigator.push(
                                  context, MaterialPageRoute(builder: (_) => const VolunteerScreen())),
                              child: const Text('Act →', style: TextStyle(color: JaColors.danger, fontWeight: FontWeight.w800)),
                            ),
                          ]),
                        ),
                      ),
                    ),

                  // Visual "heatmap" — color bars per city
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                      child: Text('Risk Zones',
                          style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, color: JaColors.ink)),
                    ),
                  ),

                  // Risk zone mini-map (bar chart style)
                  if (_zones.isNotEmpty)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                        child: Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: JaColors.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: JaColors.line),
                            boxShadow: JaColors.cardShadow,
                          ),
                          child: Column(
                            children: _zones.take(8).map((z) {
                              final barWidth = (z.highRiskPct / 100).clamp(0.0, 1.0);
                              return Padding(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                child: Row(children: [
                                  SizedBox(
                                    width: 90,
                                    child: Text(z.city,
                                        style: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w600, color: JaColors.ink),
                                        overflow: TextOverflow.ellipsis),
                                  ),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Stack(children: [
                                      Container(height: 12, decoration: BoxDecoration(color: JaColors.line, borderRadius: BorderRadius.circular(6))),
                                      FractionallySizedBox(
                                        widthFactor: barWidth,
                                        child: Container(height: 12, decoration: BoxDecoration(color: _riskColor(z.riskZone), borderRadius: BorderRadius.circular(6))),
                                      ),
                                    ]),
                                  ),
                                  const SizedBox(width: 8),
                                  Text('${z.highRiskPct.toStringAsFixed(0)}%',
                                      style: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700, color: _riskColor(z.riskZone))),
                                ]),
                              );
                            }).toList(),
                          ),
                        ),
                      ),
                    ),

                  // Zone list header
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                      child: Text('Area Details',
                          style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, color: JaColors.ink)),
                    ),
                  ),

                  // Zone list
                  _zones.isEmpty
                      ? SliverFillRemaining(
                          child: Center(
                            child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                              const Text('🌿', style: TextStyle(fontSize: 48)),
                              const SizedBox(height: 12),
                              Text('No community data yet.',
                                  style: GoogleFonts.notoSans(color: JaColors.inkSoft, fontSize: 15)),
                              const SizedBox(height: 6),
                              Text('Scan with location enabled to populate the map.',
                                  style: GoogleFonts.notoSans(color: JaColors.inkSoft, fontSize: 13),
                                  textAlign: TextAlign.center),
                            ]),
                          ),
                        )
                      : SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (context, i) => _ZoneCard(
                              zone: _zones[i],
                              riskColor: _riskColor(_zones[i].riskZone),
                              riskBg: _riskBg(_zones[i].riskZone),
                              riskEmoji: _riskEmoji(_zones[i].riskZone),
                              onVolunteer: () => Navigator.push(
                                  context, MaterialPageRoute(builder: (_) => const VolunteerScreen())),
                            ),
                            childCount: _zones.length,
                          ),
                        ),

                  const SliverPadding(padding: EdgeInsets.only(bottom: 24)),
                ],
              ),
            ),
    );
  }
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────

class _KpiCard extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _KpiCard({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: JaColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: JaColors.line),
          boxShadow: JaColors.cardShadow,
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(value, style: GoogleFonts.nunito(fontSize: 26, fontWeight: FontWeight.w800, color: color)),
          Text(label, style: GoogleFonts.notoSans(fontSize: 11, color: JaColors.inkSoft)),
        ]),
      ),
    );
  }
}

class _ZoneCard extends StatelessWidget {
  final CommunityZone zone;
  final Color riskColor;
  final Color riskBg;
  final String riskEmoji;
  final VoidCallback onVolunteer;

  const _ZoneCard({
    required this.zone,
    required this.riskColor,
    required this.riskBg,
    required this.riskEmoji,
    required this.onVolunteer,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 10),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: zone.needsScreeningCamp && !zone.handled ? JaColors.dangerSoft.withAlpha(60) : JaColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: zone.needsScreeningCamp && !zone.handled ? JaColors.danger.withAlpha(80) : JaColors.line),
          boxShadow: JaColors.cardShadow,
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Text(riskEmoji, style: const TextStyle(fontSize: 20)),
            const SizedBox(width: 8),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(zone.city, style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, color: JaColors.ink)),
                Text(zone.state, style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft)),
              ]),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: riskBg, borderRadius: BorderRadius.circular(999)),
              child: Text('${zone.highRiskPct.toStringAsFixed(1)}% high',
                  style: GoogleFonts.notoSans(fontSize: 11, fontWeight: FontWeight.w700, color: riskColor)),
            ),
          ]),
          const SizedBox(height: 10),
          Row(children: [
            _Stat(label: 'Total', val: '${zone.total}'),
            const SizedBox(width: 16),
            _Stat(label: 'High Risk', val: '${zone.highRisk}', color: JaColors.danger),
          ]),
          if (zone.needsScreeningCamp && !zone.handled) ...[
            const SizedBox(height: 10),
            Row(children: [
              Expanded(
                child: Text('⚠ Screening camp recommended',
                    style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.danger, fontWeight: FontWeight.w700)),
              ),
              TextButton(
                onPressed: onVolunteer,
                style: TextButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  backgroundColor: JaColors.danger,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
                ),
                child: const Text('Volunteer →', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
              ),
            ]),
          ],
          if (zone.handled)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text('✓ Handled by ${zone.handledBy.isNotEmpty ? zone.handledBy : "volunteer"}',
                  style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.brand, fontWeight: FontWeight.w700)),
            ),
        ]),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String val;
  final Color? color;

  const _Stat({required this.label, required this.val, this.color});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(val, style: GoogleFonts.nunito(fontSize: 18, fontWeight: FontWeight.w800, color: color ?? JaColors.ink)),
      Text(label, style: GoogleFonts.notoSans(fontSize: 11, color: JaColors.inkSoft)),
    ]);
  }
}
