class TriageResult {
  final List<String> coreConcepts;
  final List<String> theTrap;
  final List<String> attackPlan;

  TriageResult({
    required this.coreConcepts,
    required this.theTrap,
    required this.attackPlan,
  });

  factory TriageResult.fromJson(Map<String, dynamic> json) {
    List<String> parseTrap(dynamic v) {
      if (v is List) return v.cast<String>();
      if (v is String && v.isNotEmpty) return [v];
      return [];
    }

    return TriageResult(
      coreConcepts: (json['core_concepts'] as List? ?? []).cast<String>(),
      theTrap: parseTrap(json['the_trap']),
      attackPlan: (json['attack_plan'] as List? ?? []).cast<String>(),
    );
  }
}
