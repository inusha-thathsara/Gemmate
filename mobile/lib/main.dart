import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'screens/home_screen.dart';

void main() {
  runApp(const TriageApp());
}

class TriageApp extends StatelessWidget {
  const TriageApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Triage AI',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF4F8EFF),
          brightness: Brightness.dark,
          surface: const Color(0xFF05070F),
        ),
        scaffoldBackgroundColor: const Color(0xFF05070F),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
        splashFactory: NoSplash.splashFactory,
        highlightColor: Colors.transparent,
      ),
      home: const HomeScreen(),
    );
  }
}
