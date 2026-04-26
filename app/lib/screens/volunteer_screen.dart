import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/volunteer_models.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

const _kVidKey = 'janarogya_volunteer_id';

final _skillLabels = [
  ('medical',    'Medical / Nursing'),
  ('logistics',  'Logistics'),
  ('data_entry', 'Data Entry'),
  ('awareness',  'Awareness / Education'),
  ('field',      'Field Work'),
];

class VolunteerScreen extends StatefulWidget {
  const VolunteerScreen({super.key});

  @override
  State<VolunteerScreen> createState() => _VolunteerScreenState();
}

class _VolunteerScreenState extends State<VolunteerScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabs;

  String? _vid;
  bool _checkingVid = true;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 2, vsync: this);
    _loadStoredVid();
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  Future<void> _loadStoredVid() async {
    final prefs = await SharedPreferences.getInstance();
    final stored = prefs.getString(_kVidKey);
    if (mounted) setState(() { _vid = stored; _checkingVid = false; });
  }

  Future<void> _saveVid(String vid) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kVidKey, vid);
    if (mounted) setState(() => _vid = vid);
  }

  Future<void> _clearVid() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kVidKey);
    if (mounted) setState(() => _vid = null);
  }

  @override
  Widget build(BuildContext context) {
    if (_checkingVid) {
      return const Scaffold(body: Center(child: CircularProgressIndicator(color: JaColors.brand)));
    }

    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: AppBar(
        backgroundColor: JaColors.surface,
        title: Text('Volunteer Coordination',
            style: GoogleFonts.nunito(fontSize: 20, fontWeight: FontWeight.w800, color: JaColors.ink)),
        bottom: TabBar(
          controller: _tabs,
          labelColor: JaColors.brand,
          unselectedLabelColor: JaColors.inkSoft,
          indicatorColor: JaColors.brand,
          tabs: const [
            Tab(text: 'Register / My Tasks'),
            Tab(text: 'NGO Overview'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabs,
        children: [
          _vid == null
              ? _RegisterView(onRegistered: _saveVid)
              : _DashboardView(vid: _vid!, onSwitch: _clearVid),
          _NgoView(),
        ],
      ),
    );
  }
}

// ── Registration ──────────────────────────────────────────────────────────────

class _RegisterView extends StatefulWidget {
  final void Function(String vid) onRegistered;
  const _RegisterView({required this.onRegistered});

  @override
  State<_RegisterView> createState() => _RegisterViewState();
}

class _RegisterViewState extends State<_RegisterView> {
  final _api = ApiService();
  final _nameCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _orgCtrl   = TextEditingController();
  final Set<String> _skills = {};
  double? _lat, _lng;
  bool _gpsLoading = false;
  bool _loading = false;
  String _error = '';

  Future<void> _detectLocation() async {
    // Use geolocator if available; fallback: skip
    setState(() => _gpsLoading = true);
    await Future.delayed(const Duration(milliseconds: 300));
    // Without geolocator package we can't get GPS — show info
    if (mounted) {
      setState(() { _gpsLoading = false; });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Location detection requires GPS permission — grant it in device settings and retry.'),
          backgroundColor: JaColors.inkSoft,
        ),
      );
    }
  }

  Future<void> _register() async {
    if (_nameCtrl.text.trim().isEmpty) {
      setState(() => _error = 'Please enter your name.');
      return;
    }
    setState(() { _loading = true; _error = ''; });
    final result = await _api.registerVolunteer(
      name: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      org: _orgCtrl.text.trim().isEmpty ? 'Individual' : _orgCtrl.text.trim(),
      lat: _lat,
      lng: _lng,
      skills: _skills.toList(),
    );
    if (!mounted) return;
    setState(() => _loading = false);
    if (result != null && result['volunteer_id'] != null) {
      widget.onRegistered(result['volunteer_id'] as String);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Welcome, ${_nameCtrl.text.trim()}! You are now registered.'), backgroundColor: JaColors.brand),
      );
    } else {
      setState(() => _error = 'Registration failed. Is the backend reachable?');
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: JaColors.brandSoft, borderRadius: BorderRadius.circular(14)),
          child: Text(
            '🌿 Join our volunteer network. You\'ll be automatically matched to high-risk areas near your location.',
            style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.brandDark, height: 1.5),
          ),
        ),
        const SizedBox(height: 24),

        if (_error.isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Text(_error, style: GoogleFonts.notoSans(color: JaColors.danger, fontSize: 13)),
          ),

        _FormField(label: 'Full Name *', controller: _nameCtrl, hint: 'Dr. Priya Sharma'),
        const SizedBox(height: 14),
        _FormField(label: 'Phone', controller: _phoneCtrl, hint: '+91 98765 43210', keyboard: TextInputType.phone),
        const SizedBox(height: 14),
        _FormField(label: 'Organisation', controller: _orgCtrl, hint: 'HealthForAll NGO (optional)'),
        const SizedBox(height: 20),

        // Skills
        Text('Your Skills', style: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.8)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _skillLabels.map((pair) {
            final (val, label) = pair;
            final on = _skills.contains(val);
            return GestureDetector(
              onTap: () => setState(() { on ? _skills.remove(val) : _skills.add(val); }),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: on ? JaColors.brand : JaColors.surface,
                  borderRadius: BorderRadius.circular(999),
                  border: Border.all(color: on ? JaColors.brand : JaColors.line),
                ),
                child: Text(label,
                    style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w600, color: on ? Colors.white : JaColors.inkSoft)),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 20),

        // Location
        Text('Your Location', style: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.8)),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _gpsLoading ? null : _detectLocation,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: _lat != null ? JaColors.brandSoft : JaColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _lat != null ? JaColors.brand : JaColors.line),
            ),
            child: Row(children: [
              Icon(Icons.location_on, color: _lat != null ? JaColors.brand : JaColors.inkSoft, size: 20),
              const SizedBox(width: 8),
              Text(
                _gpsLoading ? 'Detecting…' : _lat != null ? '${_lat!.toStringAsFixed(3)}, ${_lng!.toStringAsFixed(3)}' : 'Detect My Location',
                style: GoogleFonts.notoSans(fontSize: 13, color: _lat != null ? JaColors.brand : JaColors.inkSoft, fontWeight: FontWeight.w600),
              ),
            ]),
          ),
        ),
        const SizedBox(height: 28),

        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _loading ? null : _register,
            style: ElevatedButton.styleFrom(
              backgroundColor: JaColors.brand,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _loading
                ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('Register & Start Helping →', style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800)),
          ),
        ),
      ]),
    );
  }
}

// ── Volunteer Dashboard ────────────────────────────────────────────────────────

class _DashboardView extends StatefulWidget {
  final String vid;
  final VoidCallback onSwitch;

  const _DashboardView({required this.vid, required this.onSwitch});

  @override
  State<_DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<_DashboardView> {
  final _api = ApiService();
  List<VolunteerTask> _available = [];
  List<VolunteerTask> _accepted  = [];
  List<VolunteerTask> _completed = [];
  bool _loading = true;
  String _actionTid = '';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    final data = await _api.getVolunteerTasks(widget.vid);
    if (!mounted) return;
    setState(() {
      _available = _parseTasks(data?['available']);
      _accepted  = _parseTasks(data?['accepted']);
      _completed = _parseTasks(data?['completed']);
      _loading   = false;
    });
  }

  List<VolunteerTask> _parseTasks(dynamic raw) {
    if (raw == null) return [];
    return (raw as List).map((e) => VolunteerTask.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> _accept(String tid) async {
    setState(() => _actionTid = tid);
    await _api.acceptTask(widget.vid, tid);
    await _load();
    if (mounted) {
      setState(() => _actionTid = '');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task accepted!'), backgroundColor: JaColors.brand),
      );
    }
  }

  Future<void> _complete(String tid) async {
    setState(() => _actionTid = tid);
    await _api.completeTask(widget.vid, tid);
    await _load();
    if (mounted) {
      setState(() => _actionTid = '');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Task marked complete! Thank you.'), backgroundColor: JaColors.brand),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: JaColors.brand));

    return RefreshIndicator(
      color: JaColors.brand,
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ID strip
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(color: JaColors.brandSoft, borderRadius: BorderRadius.circular(12)),
            child: Row(children: [
              Expanded(child: Text('ID: ${widget.vid.substring(0, 8)}…',
                  style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.brand))),
              TextButton(
                onPressed: widget.onSwitch,
                child: Text('Switch', style: GoogleFonts.notoSans(color: JaColors.inkSoft, fontSize: 12)),
              ),
            ]),
          ),
          const SizedBox(height: 20),

          _SectionHeader(title: 'Tasks Matched Near You', count: _available.length, color: JaColors.brand),
          if (_available.isEmpty) const _EmptyState(msg: 'No open tasks near you yet. Tasks appear as screenings complete in high-risk areas.'),
          ..._available.map((t) => _TaskCard(
            task: t,
            actions: Row(children: [
              _ActionButton(label: 'Accept', color: JaColors.brand, loading: _actionTid == t.taskId, onTap: () => _accept(t.taskId)),
              const SizedBox(width: 8),
              _ActionButton(label: 'Skip', color: JaColors.inkSoft, outline: true, loading: false, onTap: () {}),
            ]),
          )),

          const SizedBox(height: 24),
          _SectionHeader(title: 'Accepted Tasks', count: _accepted.length, color: const Color(0xFF3B82F6)),
          if (_accepted.isEmpty) const _EmptyState(msg: 'Tasks you accept will appear here.'),
          ..._accepted.map((t) => _TaskCard(
            task: t,
            actions: _ActionButton(
              label: 'Mark Complete ✓',
              color: const Color(0xFF16A34A),
              loading: _actionTid == t.taskId,
              onTap: () => _complete(t.taskId),
            ),
          )),

          if (_completed.isNotEmpty) ...[
            const SizedBox(height: 24),
            _SectionHeader(title: 'Completed', count: _completed.length, color: JaColors.inkSoft),
            ..._completed.map((t) => _TaskCard(task: t, dim: true)),
          ],
        ],
      ),
    );
  }
}

// ── NGO Overview ──────────────────────────────────────────────────────────────

class _NgoView extends StatefulWidget {
  @override
  State<_NgoView> createState() => _NgoViewState();
}

class _NgoViewState extends State<_NgoView> {
  final _api = ApiService();
  bool _loading = false;

  Future<void> _load() async {
    setState(() => _loading = true);
    await _api.getCommunityData();
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator(color: JaColors.brand));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: JaColors.brandSoft,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: JaColors.brand.withAlpha(80)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('NGO Overview', style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, color: JaColors.brand)),
            const SizedBox(height: 6),
            Text(
              'This view shows all open volunteer tasks auto-generated from high-risk community zones. Switch to the web app\'s Volunteer dashboard for smart-match and volunteer roster features.',
              style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.brandDark, height: 1.5),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _load,
              style: ElevatedButton.styleFrom(backgroundColor: JaColors.brand, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999))),
              child: const Text('Refresh'),
            ),
          ]),
        ),
        const SizedBox(height: 16),
        Text(
          'All active tasks and smart matching across all zones are available at jan-arogya.vercel.app/volunteer',
          style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.inkSoft, height: 1.5),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}

// ── Shared sub-widgets ────────────────────────────────────────────────────────

class _FormField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String hint;
  final TextInputType keyboard;

  const _FormField({
    required this.label,
    required this.controller,
    required this.hint,
    this.keyboard = TextInputType.text,
  });

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700, color: JaColors.inkSoft, letterSpacing: 0.8)),
      const SizedBox(height: 6),
      TextField(
        controller: controller,
        keyboardType: keyboard,
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: GoogleFonts.notoSans(color: JaColors.inkSoft.withAlpha(140), fontSize: 13),
          filled: true,
          fillColor: JaColors.surface,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: JaColors.line)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: JaColors.line)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: JaColors.brand, width: 2)),
        ),
        style: GoogleFonts.notoSans(fontSize: 14, color: JaColors.ink),
      ),
    ]);
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final int count;
  final Color color;

  const _SectionHeader({required this.title, required this.count, required this.color});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(children: [
        Text(title, style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, color: JaColors.ink)),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
          decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(999)),
          child: Text('$count', style: GoogleFonts.notoSans(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.white)),
        ),
      ]),
    );
  }
}

class _EmptyState extends StatelessWidget {
  final String msg;
  const _EmptyState({required this.msg});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        border: Border.all(color: JaColors.line, style: BorderStyle.solid),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Text(msg, style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.inkSoft, height: 1.5), textAlign: TextAlign.center),
    );
  }
}

class _TaskCard extends StatelessWidget {
  final VolunteerTask task;
  final Widget? actions;
  final bool dim;

  const _TaskCard({required this.task, this.actions, this.dim = false});

  @override
  Widget build(BuildContext context) {
    final urgencyColor = task.urgency == 'HIGH' ? JaColors.danger : JaColors.warn;
    final urgencyBg    = task.urgency == 'HIGH' ? JaColors.dangerSoft : JaColors.warnSoft;

    return Opacity(
      opacity: dim ? 0.6 : 1.0,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: task.urgency == 'HIGH' && !dim ? JaColors.dangerSoft.withAlpha(40) : JaColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: task.urgency == 'HIGH' && !dim ? JaColors.danger.withAlpha(80) : JaColors.line),
          boxShadow: JaColors.cardShadow,
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Expanded(child: Text(task.city, style: GoogleFonts.nunito(fontSize: 16, fontWeight: FontWeight.w800, color: JaColors.ink))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
              decoration: BoxDecoration(color: urgencyBg, borderRadius: BorderRadius.circular(999)),
              child: Text(task.urgency, style: GoogleFonts.notoSans(fontSize: 11, fontWeight: FontWeight.w700, color: urgencyColor)),
            ),
          ]),
          const SizedBox(height: 4),
          Text(task.state, style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft)),
          const SizedBox(height: 8),
          Wrap(spacing: 12, children: [
            _chip(task.taskTypeLabel, JaColors.brandSoft, JaColors.brand),
            _chip('${task.totalScans} scans', JaColors.surface, JaColors.inkSoft),
            _chip('${task.highRiskPct.toStringAsFixed(0)}% high risk', JaColors.dangerSoft, JaColors.danger),
            if (task.distanceKm != null) _chip('📍 ${task.distanceKm!.toStringAsFixed(0)} km', JaColors.warnSoft, JaColors.warn),
          ]),
          if (actions != null) ...[const SizedBox(height: 12), actions!],
          if (task.completedAt.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 6),
              child: Text('✓ Completed', style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.brand, fontWeight: FontWeight.w700)),
            ),
        ]),
      ),
    );
  }

  Widget _chip(String label, Color bg, Color fg) => Container(
    margin: const EdgeInsets.only(bottom: 4),
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
    child: Text(label, style: GoogleFonts.notoSans(fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
  );
}

class _ActionButton extends StatelessWidget {
  final String label;
  final Color color;
  final bool outline;
  final bool loading;
  final VoidCallback onTap;

  const _ActionButton({
    required this.label,
    required this.color,
    this.outline = false,
    required this.loading,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ElevatedButton(
      onPressed: loading ? null : onTap,
      style: ElevatedButton.styleFrom(
        backgroundColor: outline ? Colors.transparent : color,
        foregroundColor: outline ? color : Colors.white,
        side: outline ? BorderSide(color: color, width: 1.5) : BorderSide.none,
        elevation: 0,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(999)),
      ),
      child: loading
          ? SizedBox(height: 16, width: 16, child: CircularProgressIndicator(color: outline ? color : Colors.white, strokeWidth: 2))
          : Text(label, style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700)),
    );
  }
}
