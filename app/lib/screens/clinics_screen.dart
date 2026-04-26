import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../theme/app_theme.dart';

class ClinicsScreen extends StatefulWidget {
  const ClinicsScreen({super.key});
  @override
  State<ClinicsScreen> createState() => _ClinicsScreenState();
}

class _ClinicsScreenState extends State<ClinicsScreen> {
  int _active = 0;
  final _search = TextEditingController();

  final _clinics = const [
    _Clinic(name: 'Shirval Primary Health Centre', dist: '2.4 km', meta: 'Open until 8 pm · Free · Hindi, Marathi', phone: '0218-2245211'),
    _Clinic(name: 'Kolhapur CHC', dist: '8.1 km', meta: 'Open 24h · Free · Oncology Thu', phone: '0231-2661412'),
    _Clinic(name: 'Pune District Hospital', dist: '18 km', meta: 'Cancer specialist · Mon–Sat · Free', phone: '020-25501144'),
    _Clinic(name: 'Sangli Rural Clinic', dist: '24 km', meta: 'Mon–Fri · Subsidised · Tamil, Telugu', phone: '0233-2601900'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: JaColors.bg,
      appBar: AppBar(
        title: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Nearest clinics', style: GoogleFonts.nunito(fontSize: 22, fontWeight: FontWeight.w800, color: JaColors.ink)),
          Text('Free and subsidised centres near you', style: GoogleFonts.notoSans(fontSize: 12, color: JaColors.inkSoft)),
        ]),
        bottom: PreferredSize(preferredSize: const Size.fromHeight(1), child: Container(height: 1, color: JaColors.line)),
      ),
      body: Column(children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _search,
            decoration: InputDecoration(
              hintText: 'Search by village or district',
              prefixIcon: const Icon(Icons.search, color: JaColors.inkSoft),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.line)),
              enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.line)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: JaColors.brand, width: 2)),
              filled: true, fillColor: JaColors.surface,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            ),
          ),
        ),
        // Map placeholder
        Container(
          height: 180,
          margin: const EdgeInsets.symmetric(horizontal: 16),
          decoration: BoxDecoration(
            color: JaColors.brandSoft,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: JaColors.line),
          ),
          child: Stack(children: [
            // Grid lines
            CustomPaint(size: const Size(double.infinity, 180), painter: _MapGridPainter()),
            // "You" pin
            Positioned(left: MediaQuery.of(context).size.width * 0.4, top: 70,
              child: _MapPin(label: 'You', color: JaColors.accent)),
            // Clinic pins
            const Positioned(left: 60, top: 40, child: _MapPin(label: '1', color: JaColors.brand)),
            const Positioned(right: 60, top: 90, child: _MapPin(label: '2', color: JaColors.brand)),
            const Positioned(right: 30, top: 30, child: _MapPin(label: '3', color: JaColors.brand)),
            const Positioned(left: 80, bottom: 30, child: _MapPin(label: '4', color: JaColors.brand)),
            Positioned(bottom: 12, left: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(color: JaColors.surface, borderRadius: BorderRadius.circular(8), border: Border.all(color: JaColors.line)),
                child: Text(_clinics[_active].name,
                    style: GoogleFonts.notoSans(fontSize: 13, fontWeight: FontWeight.w700, color: JaColors.ink)),
              )),
          ]),
        ),
        const SizedBox(height: 12),
        // Clinic list
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: _clinics.length,
            itemBuilder: (_, i) => _ClinicCard(
              clinic: _clinics[i],
              active: _active == i,
              onTap: () => setState(() => _active = i),
            ),
          ),
        ),
      ]),
    );
  }
}

class _Clinic {
  final String name, dist, meta, phone;
  const _Clinic({required this.name, required this.dist, required this.meta, required this.phone});
}

class _ClinicCard extends StatelessWidget {
  final _Clinic clinic;
  final bool active;
  final VoidCallback onTap;
  const _ClinicCard({required this.clinic, required this.active, required this.onTap});

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
            Expanded(child: Text(clinic.name, style: GoogleFonts.nunito(fontSize: 17, fontWeight: FontWeight.w700, color: JaColors.ink))),
            Text(clinic.dist, style: GoogleFonts.notoSans(fontSize: 15, fontWeight: FontWeight.w700, color: JaColors.brand)),
          ]),
          const SizedBox(height: 4),
          Text(clinic.meta, style: GoogleFonts.notoSans(fontSize: 13, color: JaColors.inkSoft)),
          const SizedBox(height: 12),
          Row(children: [
            _SmallBtn(label: 'Directions', icon: Icons.directions, onTap: () async {
                final geo = Uri.parse('geo:0,0?q=${Uri.encodeComponent(clinic.name)}');
                if (await canLaunchUrl(geo)) {
                  await launchUrl(geo);
                } else {
                  await launchUrl(Uri.parse('https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(clinic.name)}'), mode: LaunchMode.externalApplication);
                }
              }),
            const SizedBox(width: 8),
            _SmallBtn(
              label: 'Call',
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
          border: Border.all(color: outline ? JaColors.brand : JaColors.brand),
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

class _MapPin extends StatelessWidget {
  final String label;
  final Color color;
  const _MapPin({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(mainAxisSize: MainAxisSize.min, children: [
      Container(
        width: 28, height: 28,
        decoration: BoxDecoration(color: color, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2),
          boxShadow: const [BoxShadow(color: Color(0x30000000), blurRadius: 6, offset: Offset(0, 3))]),
        child: Center(child: Text(label, style: GoogleFonts.nunito(fontSize: 12, fontWeight: FontWeight.w800, color: Colors.white))),
      ),
      Container(width: 2, height: 6, color: color),
    ]);
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = JaColors.line..strokeWidth = 1;
    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }
  @override
  bool shouldRepaint(_) => false;
}
