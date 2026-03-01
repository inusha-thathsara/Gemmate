import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class ApiService {
  static Future<Map<String, dynamic>> triage(
    List<String> base64Images, {
    http.Client? client,
  }) async {
    final c = client ?? http.Client();
    final res = await c.post(
      Uri.parse('$kBaseUrl/api/triage'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'images': base64Images}),
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'HTTP ${res.statusCode}');
    }
    return data;
  }

  static Future<String> practice(
    List<String> coreConcepts,
    List<String> theTrap,
  ) async {
    final res = await http.post(
      Uri.parse('$kBaseUrl/api/practice'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'core_concepts': coreConcepts,
        'the_trap': theTrap,
      }),
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'HTTP ${res.statusCode}');
    }
    return data['markdown'] as String? ?? '';
  }

  static Future<String> hint(
    String question,
    List<String> existingHints,
  ) async {
    final res = await http.post(
      Uri.parse('$kBaseUrl/api/hint'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'question': question,
        'existing_hints': existingHints,
      }),
    );
    final data = jsonDecode(res.body) as Map<String, dynamic>;
    if (res.statusCode != 200) {
      throw Exception(data['error'] ?? 'HTTP ${res.statusCode}');
    }
    return data['hint'] as String? ?? '';
  }
}
