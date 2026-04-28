import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../l10n/app_strings.dart';
import '../providers/app_provider.dart';
import '../theme/app_theme.dart';

class ClinicsScreen extends StatefulWidget {
  const ClinicsScreen({super.key});
  @override
  State<ClinicsScreen> createState() => _ClinicsScreenState();
}

class _ClinicsScreenState extends State<ClinicsScreen> {
  int _active = 0;
  final _search = TextEditingController();
  final _mapController = MapController();

  final _clinics = const [
    _Clinic(
      name: 'Shirval Primary Health Centre',
      dist: '2.4 km',
      meta: 'Open until 8 pm · Free · Hindi, Marathi',
      phone: '02169-245211',
      lat: 17.9582,
      lng: 74.0693,
    ),
    _Clinic(
      name: 'Kolhapur CHC',
      dist: '8.1 km',
      meta: 'Open 24h · Free · Oncology Thu',
      phone: '0231-2661412',
      lat: 16.7050,
      lng: 74.2433,
    ),
    _Clinic(
      name: 'Pune District Hospital',
      dist: '18 km',
      meta: 'Cancer specialist · Mon–Sat · Free',
      phone: '020-25501144',
      lat: 18.5204,
      lng: 73.8567,
    ),
    _Clinic(
      name: 'Sangli Rural Clinic',
      dist: '24 km',
      meta: 'Mon–Fri · Subsidised · Tamil, Telugu',
      phone: '0233-2601900',
      lat: 16.8524,
      lng: 74.5815,
    ),
  ];

  List<_Clinic> get _filtered {
    final q = _search.text.trim().toLowerCase();
    if (q.isEmpty) return _clinics;
    return _clinics.where((c) => c.name.toLowerCase().contains(q) || c.meta.toLowerCase().contains(q)).toList();
  }

  void _selectClinic(int i) {
    setState(() => _active = i);
    _mapController.move(LatLng(_clinics[i].lat, _clinics[i].lng), 13);
  }

  @override
  void dispose() {
    _mapController.dispose();
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final s = AppStrings(context.watch<AppProvider>().langCode);
    final filtered = _filtered;

    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(s.clinicsTitle, style: GoogleFonts.nunito(fontSize: 22, fontWeight: FontWeight.w800, color: JaColors.ink)),
          Text(s.clinicsSubtitle, style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft)),
        ]),
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(height: 1, color: JaColors.line)),
      ),
      body: Column(children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: _search,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              hintText: s.clinicsSearchHint,
              prefixIcon: const Icon(Icons.search, color: JaColors.inkSoft),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.line)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.line)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.brand, width: 2)),
              filled: true,
              fillColor: JaColors.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
        ),

        // Real map
        Container(
          height: 200,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: JaColors.line),
          ),
          clipBehavior: Clip.antiAlias,
          child: FlutterMap(
            mapController: _mapController,
            options: MapOptions(
              initialCenter: LatLng(_clinics[_active].lat, _clinics[_active].lng),
              initialZoom: 12,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.pinchZoom | InteractiveFlag.drag,
              ),
            ),
            children: [
              TileLayer(
                urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                userAgentPackageName: 'com.janarogya.app',
              ),
              MarkerLayer(
                markers: List.generate(_clinics.length, (i) {
                  final c = _clinics[i];
                  final isActive = _active == i;
                  return Marker(
                    point: LatLng(c.lat, c.lng),
                    width: isActive ? 44 : 36,
                    height: isActive ? 44 : 36,
                    child: GestureDetector(
                      onTap: () => _selectClinic(i),
                      child: _MapPinWidget(
                        label: '${i + 1}',
                        color: isActive ? JaColors.accent : JaColors.brand,
                        active: isActive,
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),

        const SizedBox(height: 10),

        // Clinic list
        Expanded(
          child: filtered.isEmpty
              ? Center(child: Text('No clinics found', style: GoogleFonts.notoSans(color: JaColors.inkSoft)))
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  itemCount: filtered.length,
                  itemBuilder: (_, i) {
                    final clinic = filtered[i];
                    final idx = _clinics.indexOf(clinic);
                    return _ClinicCard(
                      clinic: clinic,
                      index: idx + 1,
                      active: _active == idx,
                      onTap: () => _selectClinic(idx),
                      s: s,
                    );
                  },
                ),
        ),
      ]),
    );
  }
}

class _Clinic {
  final String name, dist, meta, phone;
  final double lat, lng;
  const _Clinic({
    required this.name,
    required this.dist,
    required this.meta,
    required this.phone,
    required this.lat,
    required this.lng,
  });
}

class _ClinicCard extends StatelessWidget {
  final _Clinic clinic;
  final int index;
  final bool active;
  final VoidCallback onTap;
  final AppStrings s;
  const _ClinicCard({required this.clinic, required this.index, required this.active, required this.onTap, required this.s});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: active ? JaColors.brandSoft : JaColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: active ? JaColors.brand : JaColors.line, width: active ? 1.5 : 1),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(
              width: 26, height: 26,
              decoration: BoxDecoration(
                color: active ? JaColors.brand : JaColors.inkSoft.withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Center(child: Text('$index', style: GoogleFonts.nunito(fontSize: 12, fontWeight: FontWeight.w800, color: active ? Colors.white : JaColors.inkSoft))),
            ),
            const SizedBox(width: 10),
            Expanded(child: Text(clinic.name, style: GoogleFonts.nunito(fontSize: 17, fontWeight: FontWeight.w700, color: JaColors.ink))),
            Text(clinic.dist, style: GoogleFonts.notoSans(fontSize: 15, fontWeight: FontWeight.w700, color: JaColors.brand)),
          ]),
          const SizedBox(height: 6),
          Text(clinic.meta, style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.inkSoft)),
          const SizedBox(height: 12),
          Row(children: [
            _SmallBtn(
              label: s.clinicsDirections,
              icon: Icons.directions,
              onTap: () async {
                final geo = Uri.parse('geo:${clinic.lat},${clinic.lng}?q=${clinic.lat},${clinic.lng}(${Uri.encodeComponent(clinic.name)})');
                if (await canLaunchUrl(geo)) {
                  await launchUrl(geo);
                } else {
                  await launchUrl(
                    Uri.parse('https://www.google.com/maps/search/?api=1&query=${clinic.lat},${clinic.lng}'),
                    mode: LaunchMode.externalApplication,
                  );
                }
              },
            ),
            const SizedBox(width: 8),
            _SmallBtn(
              label: s.clinicsCall,
              icon: Icons.phone,
              outline: true,
              onTap: () async {
                final uri = Uri(scheme: 'tel', path: clinic.phone);
                if (await canLaunchUrl(uri)) launchUrl(uri);
              },
            ),
          ]),
        ]),
      ),
    );
  }
}

class _SmallBtn extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool outline;
  final VoidCallback onTap;
  const _SmallBtn({required this.label, required this.icon, required this.onTap, this.outline = false});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: outline ? Colors.transparent : JaColors.brand,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: JaColors.brand),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 16, color: outline ? JaColors.brand : Colors.white),
          const SizedBox(width: 6),
          Text(label, style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: outline ? JaColors.brand : Colors.white)),
        ]),
      ),
    );
  }
}

class _MapPinWidget extends StatelessWidget {
  final String label;
  final Color color;
  final bool active;
  const _MapPinWidget({required this.label, required this.color, required this.active});

  @override
  Widget build(BuildContext context) {
    final size = active ? 40.0 : 32.0;
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: size, height: size,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2.5),
          boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 8, offset: Offset(0, 3))],
        ),
        child: Center(child: Text(label, style: GoogleFonts.nunito(fontSize: active ? 14 : 12, fontWeight: FontWeight.w800, color: Colors.white))),
      ),
      Container(width: 2, height: 6, color: color),
    ]);
  }
}
