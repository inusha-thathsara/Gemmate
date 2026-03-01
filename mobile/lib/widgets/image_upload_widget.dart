import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

// ── Data model ────────────────────────────────────────────────────────────────

/// A picked image with its bytes pre-loaded so Image.memory() works on all
/// platforms (Image.file is not supported on Flutter Web).
class PickedImage {
  final Uint8List bytes;
  final String name;
  const PickedImage({required this.bytes, required this.name});
}

// ── Single image thumbnail ────────────────────────────────────────────────────

class ImageSlot extends StatelessWidget {
  final PickedImage image;
  final VoidCallback onRemove;

  const ImageSlot({super.key, required this.image, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.memory(image.bytes, fit: BoxFit.cover),
          Positioned.fill(
            child: DecoratedBox(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Colors.black.withValues(alpha: 0.4),
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 6,
            right: 6,
            child: GestureDetector(
              onTap: onRemove,
              child: Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.red.withValues(alpha: 0.5),
                    width: 1,
                  ),
                ),
                child: const Icon(Icons.close, size: 14, color: Color(0xFFF87171)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Upload widget ─────────────────────────────────────────────────────────────

class ImageUploadWidget extends StatefulWidget {
  final ValueChanged<List<PickedImage>> onChanged;
  const ImageUploadWidget({super.key, required this.onChanged});

  @override
  State<ImageUploadWidget> createState() => _ImageUploadWidgetState();
}

class _ImageUploadWidgetState extends State<ImageUploadWidget> {
  final _picker = ImagePicker();
  final List<PickedImage> _images = [];
  static const int _max = 3;

  Future<void> _pick(ImageSource source) async {
    if (_images.length >= _max) return;
    if (source == ImageSource.gallery) {
      final picked = await _picker.pickMultiImage(imageQuality: 85);
      final remaining = _max - _images.length;
      final toAdd = <PickedImage>[];
      for (final x in picked.take(remaining)) {
        final bytes = await x.readAsBytes();
        toAdd.add(PickedImage(bytes: bytes, name: x.name));
      }
      setState(() => _images.addAll(toAdd));
    } else {
      final picked = await _picker.pickImage(source: source, imageQuality: 85);
      if (picked != null) {
        final bytes = await picked.readAsBytes();
        setState(() => _images.add(PickedImage(bytes: bytes, name: picked.name)));
      }
    }
    widget.onChanged(List.unmodifiable(_images));
  }

  void _remove(int index) {
    setState(() => _images.removeAt(index));
    widget.onChanged(List.unmodifiable(_images));
  }

  @override
  Widget build(BuildContext context) {
    final canAdd = _images.length < _max;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Drop zone
        if (canAdd)
          GestureDetector(
            onTap: () => _pick(ImageSource.gallery),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 28, horizontal: 20),
              decoration: BoxDecoration(
                color: const Color(0xFF0D1323),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: const Color(0xFF253D6B), width: 1.5),
              ),
              child: Column(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(14),
                      gradient: const LinearGradient(
                        colors: [Color(0xFF1A2E5E), Color(0xFF2D1B6B)],
                      ),
                      border: Border.all(
                        color: const Color(0xFF4F8EFF).withValues(alpha: 0.3),
                      ),
                    ),
                    child: const Icon(Icons.upload_rounded, color: Color(0xFF4F8EFF), size: 26),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Tap to select images',
                    style: GoogleFonts.inter(
                      color: const Color(0xFFE2E8F0),
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Up to $_max images · JPG, PNG, WEBP',
                    style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 12.5),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _ActionBtn(
                        icon: Icons.photo_library_rounded,
                        label: 'Gallery',
                        color: const Color(0xFF4F8EFF),
                        onTap: () => _pick(ImageSource.gallery),
                      ),
                      const SizedBox(width: 10),
                      _ActionBtn(
                        icon: Icons.camera_alt_rounded,
                        label: 'Camera',
                        color: const Color(0xFFA78BFA),
                        onTap: () => _pick(ImageSource.camera),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  // Slot progress indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(
                      _max,
                      (i) => Container(
                        width: 28,
                        height: 4,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(4),
                          color: i < _images.length
                              ? const Color(0xFF4F8EFF)
                              : const Color(0xFF1C2B47),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Thumbnails
        if (_images.isNotEmpty) ...[
          const SizedBox(height: 12),
          SizedBox(
            height: 110,
            child: Row(
              children: [
                ..._images.asMap().entries.map(
                  (entry) => Expanded(
                    child: Padding(
                      padding: EdgeInsets.only(
                        right: entry.key < _images.length - 1 ? 8 : 0,
                      ),
                      child: ImageSlot(
                        image: entry.value,
                        onRemove: () => _remove(entry.key),
                      ),
                    ),
                  ),
                ),
                // Empty placeholder slots
                ...List.generate(
                  _max - _images.length,
                  (_) => Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: Container(
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            color: const Color(0xFF1C2B47),
                            width: 1.5,
                          ),
                          color: const Color(0xFF080C18),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

// ── Small action button ───────────────────────────────────────────────────────

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionBtn({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          children: [
            Icon(icon, color: color, size: 15),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
