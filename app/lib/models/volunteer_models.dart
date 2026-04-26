class VolunteerProfile {
  final String volunteerId;
  final String name;
  final String phone;
  final String org;
  final double? lat;
  final double? lng;
  final List<String> skills;
  final bool available;
  final String registeredAt;
  final List<String> acceptedTaskIds;

  const VolunteerProfile({
    required this.volunteerId,
    required this.name,
    required this.phone,
    required this.org,
    this.lat,
    this.lng,
    required this.skills,
    required this.available,
    required this.registeredAt,
    required this.acceptedTaskIds,
  });

  factory VolunteerProfile.fromJson(Map<String, dynamic> j) => VolunteerProfile(
        volunteerId: j['volunteer_id'] as String? ?? '',
        name: j['name'] as String? ?? '',
        phone: j['phone'] as String? ?? '',
        org: j['org'] as String? ?? 'Individual',
        lat: (j['lat'] as num?)?.toDouble(),
        lng: (j['lng'] as num?)?.toDouble(),
        skills: List<String>.from(j['skills'] as List? ?? []),
        available: j['available'] as bool? ?? true,
        registeredAt: j['registered_at'] as String? ?? '',
        acceptedTaskIds: List<String>.from(j['accepted_task_ids'] as List? ?? []),
      );
}

class VolunteerTask {
  final String taskId;
  final String city;
  final String state;
  final double lat;
  final double lng;
  final String taskType;    // screening_camp | patient_followup | awareness_drive
  final String urgency;     // HIGH | MEDIUM
  final String status;      // open | assigned | completed
  final String assignedTo;
  final String assignedName;
  final String createdAt;
  final String completedAt;
  final String notes;
  final double highRiskPct;
  final int totalScans;
  final double? distanceKm;

  const VolunteerTask({
    required this.taskId,
    required this.city,
    required this.state,
    required this.lat,
    required this.lng,
    required this.taskType,
    required this.urgency,
    required this.status,
    required this.assignedTo,
    required this.assignedName,
    required this.createdAt,
    required this.completedAt,
    required this.notes,
    required this.highRiskPct,
    required this.totalScans,
    this.distanceKm,
  });

  factory VolunteerTask.fromJson(Map<String, dynamic> j) => VolunteerTask(
        taskId: j['task_id'] as String? ?? '',
        city: j['city'] as String? ?? '',
        state: j['state'] as String? ?? '',
        lat: (j['lat'] as num?)?.toDouble() ?? 0,
        lng: (j['lng'] as num?)?.toDouble() ?? 0,
        taskType: j['task_type'] as String? ?? 'screening_camp',
        urgency: j['urgency'] as String? ?? 'MEDIUM',
        status: j['status'] as String? ?? 'open',
        assignedTo: j['assigned_to'] as String? ?? '',
        assignedName: j['assigned_name'] as String? ?? '',
        createdAt: j['created_at'] as String? ?? '',
        completedAt: j['completed_at'] as String? ?? '',
        notes: j['notes'] as String? ?? '',
        highRiskPct: (j['high_risk_pct'] as num?)?.toDouble() ?? 0,
        totalScans: j['total_scans'] as int? ?? 0,
        distanceKm: (j['distance_km'] as num?)?.toDouble(),
      );

  String get taskTypeLabel => switch (taskType) {
    'screening_camp'   => '🏕 Screening Camp',
    'patient_followup' => '🔁 Patient Followup',
    'awareness_drive'  => '📢 Awareness Drive',
    _                  => taskType,
  };
}

class CommunityZone {
  final String city;
  final String state;
  final double lat;
  final double lng;
  final int total;
  final int highRisk;
  final double highRiskPct;
  final String riskZone;      // HIGH | MEDIUM | LOW
  final bool needsScreeningCamp;
  final bool handled;
  final String handledBy;

  const CommunityZone({
    required this.city,
    required this.state,
    required this.lat,
    required this.lng,
    required this.total,
    required this.highRisk,
    required this.highRiskPct,
    required this.riskZone,
    required this.needsScreeningCamp,
    required this.handled,
    required this.handledBy,
  });

  factory CommunityZone.fromJson(Map<String, dynamic> j) => CommunityZone(
        city: j['city'] as String? ?? '',
        state: j['state'] as String? ?? '',
        lat: (j['lat'] as num?)?.toDouble() ?? 0,
        lng: (j['lng'] as num?)?.toDouble() ?? 0,
        total: j['total'] as int? ?? 0,
        highRisk: j['high_risk'] as int? ?? 0,
        highRiskPct: (j['high_risk_pct'] as num?)?.toDouble() ?? 0,
        riskZone: j['risk_zone'] as String? ?? 'LOW',
        needsScreeningCamp: j['needs_screening_camp'] as bool? ?? false,
        handled: j['handled'] as bool? ?? false,
        handledBy: j['handled_by'] as String? ?? '',
      );
}
