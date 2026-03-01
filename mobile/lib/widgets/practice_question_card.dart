import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';

import '../services/api_service.dart';

// ── Data model ────────────────────────────────────────────────────────────────

class _QuestionItem {
  final String id;
  String state = 'loading';
  String markdown = '';
  String error = '';
  bool expanded = true;
  List<String> hints = [];
  bool hintsLoading = false;
  bool hintsOpen = false;

  _QuestionItem({required this.id});
}

// ── Main widget ───────────────────────────────────────────────────────────────

class PracticeQuestionCard extends StatefulWidget {
  final List<String> coreConcepts;
  final List<String> theTrap;

  const PracticeQuestionCard({
    super.key,
    required this.coreConcepts,
    required this.theTrap,
  });

  @override
  State<PracticeQuestionCard> createState() => _PracticeQuestionCardState();
}

class _PracticeQuestionCardState extends State<PracticeQuestionCard> {
  final List<_QuestionItem> _questions = [];

  // ── API calls ──────────────────────────────────────────────────────────────

  Future<void> _addQuestion() async {
    final item = _QuestionItem(id: DateTime.now().millisecondsSinceEpoch.toString());
    setState(() => _questions.add(item));
    try {
      final md = await ApiService.practice(widget.coreConcepts, widget.theTrap);
      if (!mounted) return;
      setState(() {
        item.state = 'done';
        item.markdown = md;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        item.state = 'error';
        item.error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _regenerate(_QuestionItem item) async {
    setState(() {
      item.state = 'loading';
      item.markdown = '';
      item.error = '';
      item.hints = [];
      item.hintsOpen = false;
    });
    try {
      final md = await ApiService.practice(widget.coreConcepts, widget.theTrap);
      if (!mounted) return;
      setState(() {
        item.state = 'done';
        item.markdown = md;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        item.state = 'error';
        item.error = e.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  Future<void> _addHint(_QuestionItem item) async {
    if (item.hintsLoading || item.hints.length >= 3) return;
    setState(() {
      item.hintsLoading = true;
      item.hintsOpen = true;
    });
    try {
      final hint = await ApiService.hint(item.markdown, item.hints);
      if (!mounted) return;
      setState(() {
        item.hints = [...item.hints, hint];
        item.hintsLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => item.hintsLoading = false);
    }
  }

  Future<void> _exportPdf(_QuestionItem item, int number) async {
    final doc = pw.Document();
    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(40),
        build: (ctx) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            pw.Container(
              padding: const pw.EdgeInsets.only(bottom: 12),
              decoration: const pw.BoxDecoration(
                border: pw.Border(bottom: pw.BorderSide(width: 1.5)),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'TRIAGE AI · PRACTICE QUESTION',
                    style: const pw.TextStyle(
                      fontSize: 9,
                      letterSpacing: 1.5,
                    ),
                  ),
                  pw.SizedBox(height: 4),
                  pw.Text(
                    'Question $number',
                    style: pw.TextStyle(
                      fontSize: 22,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            pw.SizedBox(height: 20),
            pw.Text(
              item.markdown,
              style: const pw.TextStyle(fontSize: 13, lineSpacing: 4),
            ),
          ],
        ),
      ),
    );
    await Printing.layoutPdf(onLayout: (_) => doc.save());
  }

  // ── Build ──────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Section divider
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 20),
          child: Row(
            children: [
              Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.08))),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  'PRACTICE MODE',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF475569),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1.2,
                  ),
                ),
              ),
              Expanded(child: Divider(color: Colors.white.withValues(alpha: 0.08))),
            ],
          ),
        ),

        // Question cards
        ..._questions.asMap().entries.map((entry) {
          final idx = entry.key;
          final q = entry.value;
          return _QuestionCardItem(
            q: q,
            number: idx + 1,
            onRemove: () => setState(() => _questions.removeAt(idx)),
            onRegenerate: () => _regenerate(q),
            onGetHint: () => _addHint(q),
            onToggleExpand: () => setState(() => q.expanded = !q.expanded),
            onToggleHints: () => setState(() => q.hintsOpen = !q.hintsOpen),
            onExportPdf: () => _exportPdf(q, idx + 1),
          );
        }),

        // Generate button
        GestureDetector(
          onTap: _addQuestion,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 15),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: const LinearGradient(
                colors: [Color(0xFF7C3AED), Color(0xFFA78BFA), Color(0xFFEC4899)],
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF7C3AED).withValues(alpha: 0.35),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  _questions.isEmpty ? Icons.fitness_center_rounded : Icons.add_rounded,
                  color: Colors.white,
                  size: 18,
                ),
                const SizedBox(width: 8),
                Text(
                  _questions.isEmpty ? 'Generate Practice Question' : 'Generate Another Question',
                  style: GoogleFonts.inter(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 15,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── Per-question card ─────────────────────────────────────────────────────────

class _QuestionCardItem extends StatelessWidget {
  final _QuestionItem q;
  final int number;
  final VoidCallback onRemove;
  final VoidCallback onRegenerate;
  final VoidCallback onGetHint;
  final VoidCallback onToggleExpand;
  final VoidCallback onToggleHints;
  final VoidCallback onExportPdf;

  const _QuestionCardItem({
    required this.q,
    required this.number,
    required this.onRemove,
    required this.onRegenerate,
    required this.onGetHint,
    required this.onToggleExpand,
    required this.onToggleHints,
    required this.onExportPdf,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1323),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFA78BFA).withValues(alpha: 0.2)),
      ),
      child: Column(
        children: [
          // Gradient top bar
          Container(
            height: 3,
            decoration: const BoxDecoration(
              borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
              gradient: LinearGradient(
                colors: [Color(0xFF7C3AED), Color(0xFFA78BFA), Color(0xFFEC4899)],
              ),
            ),
          ),

          // Header row
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: onToggleExpand,
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: const Color(0xFF7C3AED).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: const Color(0xFFA78BFA).withValues(alpha: 0.25),
                            ),
                          ),
                          child: const Icon(
                            Icons.fitness_center_rounded,
                            color: Color(0xFFA78BFA),
                            size: 14,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Text(
                            'Practice Question $number',
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              color: const Color(0xFFE2E8F0),
                              fontWeight: FontWeight.w700,
                              fontSize: 13.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFF7C3AED).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: const Color(0xFFA78BFA).withValues(alpha: 0.2),
                            ),
                          ),
                          child: Text(
                            'AI',
                            style: GoogleFonts.inter(
                              color: const Color(0xFFA78BFA),
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                // Action buttons
                if (q.state == 'loading')
                  const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Color(0xFFA78BFA),
                    ),
                  )
                else ...[
                  if (q.state == 'done')
                    _IconBtn(
                      icon: Icons.download_rounded,
                      color: const Color(0xFF34D399),
                      onTap: onExportPdf,
                    ),
                  const SizedBox(width: 6),
                  _IconBtn(
                    icon: Icons.refresh_rounded,
                    color: const Color(0xFFA78BFA),
                    onTap: onRegenerate,
                  ),
                  const SizedBox(width: 6),
                  _IconBtn(
                    icon: Icons.close_rounded,
                    color: const Color(0xFFF87171),
                    onTap: onRemove,
                  ),
                ],
                const SizedBox(width: 6),
                Icon(
                  q.expanded
                      ? Icons.keyboard_arrow_up_rounded
                      : Icons.keyboard_arrow_down_rounded,
                  color: const Color(0xFF475569),
                  size: 20,
                ),
              ],
            ),
          ),

          // Collapsible body
          if (q.expanded) ...[
            const Divider(height: 1, color: Color(0xFF1C2B47)),
            _buildBody(),
          ],
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (q.state == 'loading') {
      return const Padding(
        padding: EdgeInsets.all(20),
        child: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFA78BFA)),
            ),
            SizedBox(width: 10),
            Text(
              'Generating question…',
              style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
            ),
          ],
        ),
      );
    }
    if (q.state == 'error') {
      return Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.warning_amber_rounded, color: Color(0xFFF87171), size: 16),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                q.error,
                style: const TextStyle(color: Color(0xFFF87171), fontSize: 13),
              ),
            ),
          ],
        ),
      );
    }

    // Done — show question + hints
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(18, 16, 18, 8),
          child: MarkdownBody(
            data: q.markdown,
            styleSheet: MarkdownStyleSheet(
              p: GoogleFonts.inter(
                color: const Color(0xFF94A3B8),
                fontSize: 13.5,
                height: 1.75,
              ),
              h1: GoogleFonts.inter(
                color: const Color(0xFFE2E8F0),
                fontWeight: FontWeight.w800,
                fontSize: 18,
              ),
              h2: GoogleFonts.inter(
                color: const Color(0xFFE2E8F0),
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
              h3: GoogleFonts.inter(
                color: const Color(0xFFE2E8F0),
                fontWeight: FontWeight.w600,
                fontSize: 14.5,
              ),
              strong: GoogleFonts.inter(
                color: const Color(0xFFE2E8F0),
                fontWeight: FontWeight.w700,
                fontSize: 13.5,
              ),
              em: GoogleFonts.inter(
                color: const Color(0xFF94A3B8),
                fontStyle: FontStyle.italic,
                fontSize: 13.5,
              ),
              code: GoogleFonts.robotoMono(
                color: const Color(0xFF7DD3FC),
                fontSize: 12.5,
                backgroundColor: const Color(0xFF111827),
              ),
              blockquote: GoogleFonts.inter(
                color: const Color(0xFF64748B),
                fontSize: 13,
                fontStyle: FontStyle.italic,
              ),
            ),
          ),
        ),
        _HintsSection(q: q, onGetHint: onGetHint, onToggleHints: onToggleHints),
        const SizedBox(height: 4),
      ],
    );
  }
}

// ── Hints section ─────────────────────────────────────────────────────────────

class _HintsSection extends StatelessWidget {
  final _QuestionItem q;
  final VoidCallback onGetHint;
  final VoidCallback onToggleHints;

  const _HintsSection({
    required this.q,
    required this.onGetHint,
    required this.onToggleHints,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Column(
        children: [
          // Divider row with hints toggle
          Row(
            children: [
              Expanded(
                child: Divider(color: const Color(0xFFFBBF24).withValues(alpha: 0.15)),
              ),
              if (q.hints.isNotEmpty) ...[
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: onToggleHints,
                  child: Row(
                    children: [
                      const Icon(Icons.lightbulb_rounded, color: Color(0xFFFBBF24), size: 12),
                      const SizedBox(width: 4),
                      Text(
                        'Hints (${q.hints.length})',
                        style: GoogleFonts.inter(
                          color: const Color(0xFFFBBF24),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 1,
                        ),
                      ),
                      const SizedBox(width: 4),
                      Icon(
                        q.hintsOpen
                            ? Icons.keyboard_arrow_up
                            : Icons.keyboard_arrow_down,
                        color: const Color(0xFFFBBF24),
                        size: 14,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
              ],
              Expanded(
                child: Divider(color: const Color(0xFFFBBF24).withValues(alpha: 0.15)),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Hint cards
          if (q.hintsOpen)
            ...q.hints.asMap().entries.map(
              (e) => Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFBBF24).withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(
                    color: const Color(0xFFFBBF24).withValues(alpha: 0.18),
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 20,
                      height: 20,
                      decoration: BoxDecoration(
                        color: const Color(0xFFFBBF24).withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(
                          color: const Color(0xFFFBBF24).withValues(alpha: 0.25),
                        ),
                      ),
                      child: Center(
                        child: Text(
                          '${e.key + 1}',
                          style: GoogleFonts.inter(
                            color: const Color(0xFFFBBF24),
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        e.value,
                        style: GoogleFonts.inter(
                          color: const Color(0xFF94A3B8),
                          fontSize: 13,
                          height: 1.65,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

          // Get hint button or max reached
          if (q.hints.length < 3)
            GestureDetector(
              onTap: q.hintsLoading ? null : onGetHint,
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFBBF24).withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(11),
                  border: Border.all(
                    color: const Color(0xFFFBBF24).withValues(alpha: 0.2),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    if (q.hintsLoading)
                      const SizedBox(
                        width: 13,
                        height: 13,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Color(0xFFFBBF24),
                        ),
                      )
                    else
                      const Icon(Icons.lightbulb_rounded, color: Color(0xFFFBBF24), size: 14),
                    const SizedBox(width: 7),
                    Text(
                      q.hintsLoading
                          ? 'Getting hint…'
                          : q.hints.isEmpty
                              ? 'Get a Hint'
                              : 'Get Another Hint',
                      style: GoogleFonts.inter(
                        color: const Color(0xFFFBBF24),
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Text(
              'Maximum hints reached — try solving it now!',
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                color: const Color(0xFF475569),
                fontSize: 12,
                fontStyle: FontStyle.italic,
              ),
            ),
        ],
      ),
    );
  }
}

// ── Small icon button ─────────────────────────────────────────────────────────

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _IconBtn({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Icon(icon, color: color, size: 13),
      ),
    );
  }
}
