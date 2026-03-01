import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';

import '../models/triage_result.dart';
import '../widgets/practice_question_card.dart';
import '../widgets/triage_card.dart';

class ResultScreen extends StatelessWidget {
  final TriageResult result;
  const ResultScreen({super.key, required this.result});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF05070F),
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              decoration: const BoxDecoration(
                border: Border(bottom: BorderSide(color: Color(0xFF1C2B47))),
              ),
              child: Row(
                children: [
                  GestureDetector(
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      width: 34,
                      height: 34,
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D1323),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF1C2B47)),
                      ),
                      child: const Icon(
                        Icons.arrow_back_rounded,
                        color: Color(0xFF94A3B8),
                        size: 18,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Row(
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFF34D399),
                          boxShadow: [BoxShadow(color: Color(0xFF34D399), blurRadius: 8)],
                        ),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'TRIAGE COMPLETE',
                        style: GoogleFonts.inter(
                          color: const Color(0xFF475569),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Scrollable content
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
                child: Column(
                  children: [
                    // Core Concepts card
                    TriageCard(
                      title: 'Core Concepts',
                      icon: Icons.lightbulb_rounded,
                      accentColor: const Color(0xFF4F8EFF),
                      gradientColors: const [Color(0xFF4F8EFF), Color(0xFF6366F1)],
                      child: Column(
                        children: result.coreConcepts
                            .map((c) => BulletItem(text: c, dotColor: const Color(0xFF4F8EFF)))
                            .toList(),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // The Trap(s) card
                    TriageCard(
                      title: result.theTrap.length > 1 ? 'The Traps' : 'The Trap',
                      icon: Icons.warning_amber_rounded,
                      accentColor: const Color(0xFFFBBF24),
                      gradientColors: const [Color(0xFFFBBF24), Color(0xFFF87171)],
                      child: Column(
                        children: result.theTrap
                            .asMap()
                            .entries
                            .map(
                              (entry) => Padding(
                                padding: const EdgeInsets.only(bottom: 10),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    if (result.theTrap.length > 1) ...[
                                      Container(
                                        width: 22,
                                        height: 22,
                                        margin: const EdgeInsets.only(top: 2),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFBBF24).withValues(alpha: 0.12),
                                          borderRadius: BorderRadius.circular(7),
                                          border: Border.all(
                                            color: const Color(0xFFFBBF24).withValues(alpha: 0.25),
                                          ),
                                        ),
                                        child: Center(
                                          child: Text(
                                            '${entry.key + 1}',
                                            style: GoogleFonts.inter(
                                              color: const Color(0xFFFBBF24),
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                    ],
                                    Expanded(
                                      child: Container(
                                        padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFFFBBF24).withValues(alpha: 0.05),
                                          borderRadius: BorderRadius.circular(11),
                                          border: Border.all(
                                            color: const Color(0xFFFBBF24).withValues(alpha: 0.14),
                                          ),
                                        ),
                                        child: MarkdownBody(
                                          data: entry.value,
                                          styleSheet: MarkdownStyleSheet(
                                            p: GoogleFonts.inter(
                                              color: const Color(0xFF94A3B8),
                                              fontSize: 13.5,
                                              height: 1.65,
                                            ),
                                            strong: GoogleFonts.inter(
                                              color: const Color(0xFFE2E8F0),
                                              fontWeight: FontWeight.w700,
                                              fontSize: 13.5,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Attack Plan card
                    TriageCard(
                      title: 'Attack Plan',
                      icon: Icons.offline_bolt_rounded,
                      accentColor: const Color(0xFF34D399),
                      gradientColors: const [Color(0xFF34D399), Color(0xFF06B6D4)],
                      child: Column(
                        children: result.attackPlan
                            .asMap()
                            .entries
                            .map(
                              (e) => NumberedItem(
                                number: e.key + 1,
                                text: e.value,
                                accentColor: const Color(0xFF34D399),
                              ),
                            )
                            .toList(),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Practice section
                    PracticeQuestionCard(
                      coreConcepts: result.coreConcepts,
                      theTrap: result.theTrap,
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
