import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ── Reusable card shell ───────────────────────────────────────────────────────

class TriageCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color accentColor;
  final List<Color> gradientColors;
  final Widget child;

  const TriageCard({
    super.key,
    required this.title,
    required this.icon,
    required this.accentColor,
    required this.gradientColors,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF0D1323),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: accentColor.withValues(alpha: 0.22)),
        boxShadow: [
          BoxShadow(
            color: accentColor.withValues(alpha: 0.06),
            blurRadius: 20,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Gradient top bar
          Container(
            height: 3,
            decoration: BoxDecoration(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
              gradient: LinearGradient(colors: gradientColors),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 18, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 36,
                      height: 36,
                      decoration: BoxDecoration(
                        color: accentColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(11),
                        border: Border.all(color: accentColor.withValues(alpha: 0.25)),
                      ),
                      child: Icon(icon, color: accentColor, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        color: const Color(0xFFE2E8F0),
                        fontWeight: FontWeight.w800,
                        fontSize: 15,
                        letterSpacing: -0.3,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                child,
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Bullet list item ──────────────────────────────────────────────────────────

class BulletItem extends StatelessWidget {
  final String text;
  final Color dotColor;

  const BulletItem({super.key, required this.text, required this.dotColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 9),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 7),
            child: Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                color: dotColor,
                shape: BoxShape.circle,
                boxShadow: [BoxShadow(color: dotColor.withValues(alpha: 0.5), blurRadius: 4)],
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                color: const Color(0xFF94A3B8),
                fontSize: 13.5,
                height: 1.6,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Numbered list item ────────────────────────────────────────────────────────

class NumberedItem extends StatelessWidget {
  final int number;
  final String text;
  final Color accentColor;

  const NumberedItem({
    super.key,
    required this.number,
    required this.text,
    required this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: accentColor.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: accentColor.withValues(alpha: 0.25)),
            ),
            child: Center(
              child: Text(
                '$number',
                style: GoogleFonts.inter(
                  color: accentColor,
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: GoogleFonts.inter(
                color: const Color(0xFF94A3B8),
                fontSize: 13.5,
                height: 1.65,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
