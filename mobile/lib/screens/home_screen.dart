import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/triage_result.dart';
import '../services/api_service.dart';
import '../widgets/image_upload_widget.dart';
import 'result_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  List<PickedImage> _images = [];
  bool _loading = false;
  String? _error;

  Future<void> _triage() async {
    if (_images.isEmpty) {
      setState(() => _error = 'Please select at least one image before triaging.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final base64Images = _images.map((img) {
        return 'data:image/jpeg;base64,${base64Encode(img.bytes)}';
      }).toList();

      final data = await ApiService.triage(base64Images);
      final result = TriageResult.fromJson(data);

      if (!mounted) return;
      setState(() => _loading = false);
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => ResultScreen(result: result)),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF05070F),
      body: SafeArea(
        child: Stack(
          children: [
            // Ambient background blobs
            Positioned(
              top: -80,
              left: -60,
              child: Container(
                width: 280,
                height: 280,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF4F8EFF).withValues(alpha: 0.04),
                ),
              ),
            ),
            Positioned(
              bottom: 120,
              right: -40,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFA78BFA).withValues(alpha: 0.04),
                ),
              ),
            ),

            Column(
              children: [
                // Header
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  decoration: const BoxDecoration(
                    border: Border(
                      bottom: BorderSide(color: Color(0xFF1C2B47)),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 34,
                        height: 34,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(10),
                          gradient: const LinearGradient(
                            colors: [Color(0xFF4F8EFF), Color(0xFFA78BFA)],
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF4F8EFF).withValues(alpha: 0.4),
                              blurRadius: 16,
                            ),
                          ],
                        ),
                        child: const Icon(Icons.bolt_rounded, color: Colors.white, size: 18),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        'Triage',
                        style: GoogleFonts.inter(
                          color: const Color(0xFFE2E8F0),
                          fontWeight: FontWeight.w900,
                          fontSize: 18,
                          letterSpacing: -0.6,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF4F8EFF).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(5),
                          border: Border.all(
                            color: const Color(0xFF4F8EFF).withValues(alpha: 0.25),
                          ),
                        ),
                        child: Text(
                          'AI',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF4F8EFF),
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Scrollable body
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 28, 20, 120),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4F8EFF).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFF4F8EFF).withValues(alpha: 0.2),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 6,
                                height: 6,
                                decoration: const BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: Color(0xFF4F8EFF),
                                  boxShadow: [BoxShadow(color: Color(0xFF4F8EFF), blurRadius: 6)],
                                ),
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'Powered by Gemini 2.5 Flash',
                                style: GoogleFonts.inter(
                                  color: const Color(0xFF4F8EFF),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Headline
                        RichText(
                          text: TextSpan(
                            style: GoogleFonts.inter(
                              fontSize: 30,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -1.2,
                              height: 1.15,
                            ),
                            children: const [
                              TextSpan(
                                text: 'Crack your exam\n',
                                style: TextStyle(color: Color(0xFFE2E8F0)),
                              ),
                              TextSpan(
                                text: 'question instantly.',
                                style: TextStyle(color: Color(0xFF4F8EFF)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 14),
                        Text(
                          'Upload your question · Triage breaks it down into core concepts, the hidden trap, and a step-by-step attack plan.',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF64748B),
                            fontSize: 14,
                            height: 1.7,
                          ),
                        ),
                        const SizedBox(height: 28),

                        // Inline error alert
                        if (_error != null) ...[
                          Container(
                            padding: const EdgeInsets.fromLTRB(14, 12, 12, 12),
                            margin: const EdgeInsets.only(bottom: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFBBF24).withValues(alpha: 0.07),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(
                                color: const Color(0xFFFBBF24).withValues(alpha: 0.25),
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Icon(
                                  Icons.warning_amber_rounded,
                                  color: Color(0xFFFBBF24),
                                  size: 16,
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Text(
                                    _error!,
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF94A3B8),
                                      fontSize: 13.5,
                                      height: 1.5,
                                    ),
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () => setState(() => _error = null),
                                  child: const Icon(
                                    Icons.close_rounded,
                                    color: Color(0xFF475569),
                                    size: 16,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        // Upload label
                        Text(
                          'QUESTION IMAGES',
                          style: GoogleFonts.inter(
                            color: const Color(0xFF475569),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ImageUploadWidget(
                          onChanged: (imgs) => setState(() => _images = imgs),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            // Fixed bottom CTA
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      const Color(0xFF05070F).withValues(alpha: 0),
                      const Color(0xFF05070F),
                    ],
                    stops: const [0.0, 0.4],
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 40),
                child: GestureDetector(
                  onTap: _loading ? null : _triage,
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: _loading
                          ? null
                          : const LinearGradient(
                              colors: [Color(0xFF4F8EFF), Color(0xFF6366F1), Color(0xFFA78BFA)],
                            ),
                      color: _loading ? const Color(0xFF111829) : null,
                      border: _loading ? Border.all(color: const Color(0xFF1C2B47)) : null,
                      boxShadow: _loading
                          ? null
                          : [
                              BoxShadow(
                                color: const Color(0xFF4F8EFF).withValues(alpha: 0.35),
                                blurRadius: 30,
                                offset: const Offset(0, 4),
                              ),
                            ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        if (_loading) ...[
                          const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Color(0xFF4F8EFF),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Text(
                            'Triaging…',
                            style: GoogleFonts.inter(
                              color: const Color(0xFF475569),
                              fontSize: 16,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ] else ...[
                          const Icon(Icons.bolt_rounded, color: Colors.white, size: 19),
                          const SizedBox(width: 8),
                          Text(
                            'Triage Question',
                            style: GoogleFonts.inter(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 16),
                        ],
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
