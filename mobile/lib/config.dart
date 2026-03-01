import 'package:flutter/foundation.dart' show kIsWeb;

/// Base URL for the Next.js backend.
///
/// - Flutter Web dev  → localhost:3000 (same machine)
/// - Android emulator → 10.0.2.2:3000 (emulator's alias for host localhost)
/// - Physical Android → change to your LAN IP, e.g. http://192.168.1.42:3000
/// - Production       → https://your-app.vercel.app
final String kBaseUrl = kIsWeb
    ? 'http://localhost:3000'
    : 'http://10.0.2.2:3000';
