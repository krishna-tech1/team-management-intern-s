import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

class DocumentCenterScreen extends StatefulWidget {
  const DocumentCenterScreen({super.key});

  @override
  State<DocumentCenterScreen> createState() => _DocumentCenterScreenState();
}

class _DocumentCenterScreenState extends State<DocumentCenterScreen> {
  late List<Map<String, dynamic>> _uploads;

  @override
  void initState() {
    super.initState();
    _uploads = [];
  }

  void _removeUpload(int index) {
    setState(() => _uploads.removeAt(index));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.accent),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'FieldCore',
          style: TextStyle(color: AppColors.primary, fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: CircleAvatar(
              backgroundColor: AppColors.primary,
              radius: 17,
              child: const Icon(Icons.person, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Document Verification', style: AppTextStyles.displayMedium),
            const SizedBox(height: 6),
            const Text(
              'Please upload the required documentation to proceed with your project assignment. Files must be under 25MB each.',
              style: AppTextStyles.bodyMedium,
            ),
            const SizedBox(height: 20),

            // Upload Sections
            _UploadSection(
              icon: Icons.image_outlined,
              title: 'Photos',
              required: true,
              uploadHint: 'Drag & Drop or Browse',
              uploadSub: 'JPG, PNG up to 10MB',
              uploadIcon: Icons.cloud_upload_outlined,
            ),
            const SizedBox(height: 12),
            _UploadSection(
              icon: Icons.picture_as_pdf_outlined,
              title: 'Contracts',
              required: false,
              uploadHint: 'Upload PDF Agreement',
              uploadSub: 'Must be digitally signed',
              uploadIcon: Icons.upload_file_outlined,
            ),
            const SizedBox(height: 12),
            _UploadSection(
              icon: Icons.description_outlined,
              title: 'Support',
              required: false,
              uploadHint: 'Add Supporting Docs',
              uploadSub: 'Invoices, certificates, etc.',
              uploadIcon: Icons.add_box_outlined,
            ),
            const SizedBox(height: 20),

            // Recent Uploads
            Row(
              children: [
                const Text('Recent Uploads', style: AppTextStyles.headlineMedium),
                const Spacer(),
                Text(
                  '${_uploads.length} Files Uploaded',
                  style: const TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ..._uploads.asMap().entries.map((entry) {
              final i = entry.key;
              final upload = entry.value;
              return _UploadedFileItem(
                upload: upload,
                onRemove: () => _removeUpload(i),
              );
            }),
            const SizedBox(height: 16),

            // Missing document banner
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.accentLight,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.accentMedium, width: 0.8),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.info_outline, color: AppColors.accent, size: 18),
                  SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Missing a document?',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.primary),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'You can save your progress and return later to upload the remaining files. Your draft will be held for 7 days.',
                          style: AppTextStyles.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.divider, width: 0.8)),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                Expanded(
                  child: TextButton(
                    onPressed: () => Navigator.of(context).pop(),
                    child: const Text(
                      'SAVE FOR LATER',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Documents submitted!'), backgroundColor: AppColors.primary),
                      );
                      Navigator.of(context).pop();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: const Text('DONE', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _UploadSection extends StatelessWidget {
  final IconData icon;
  final String title;
  final bool required;
  final String uploadHint;
  final String uploadSub;
  final IconData uploadIcon;

  const _UploadSection({
    required this.icon,
    required this.title,
    required this.required,
    required this.uploadHint,
    required this.uploadSub,
    required this.uploadIcon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppColors.primary),
              const SizedBox(width: 8),
              Text(title, style: AppTextStyles.headlineMedium),
              const Spacer(),
              if (required)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accentLight,
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.accentMedium),
                  ),
                  child: const Text(
                    'REQUIRED',
                    style: TextStyle(fontSize: 9, fontWeight: FontWeight.w700, color: AppColors.accent),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () {},
            child: DottedBorderContainer(
              child: Column(
                children: [
                  Icon(uploadIcon, size: 30, color: AppColors.accent),
                  const SizedBox(height: 6),
                  Text(
                    uploadHint,
                    style: const TextStyle(fontSize: 13, color: AppColors.accent, fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 3),
                  Text(uploadSub, style: AppTextStyles.bodySmall),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class DottedBorderContainer extends StatelessWidget {
  final Widget child;
  const DottedBorderContainer({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 20),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: AppColors.accentMedium,
          width: 1.5,
          style: BorderStyle.solid,
        ),
      ),
      child: child,
    );
  }
}

class _UploadedFileItem extends StatelessWidget {
  final Map<String, dynamic> upload;
  final VoidCallback onRemove;

  const _UploadedFileItem({required this.upload, required this.onRemove});

  @override
  Widget build(BuildContext context) {
    final status = upload['status'] as String;
    final isUploading = status == 'uploading';
    final progress = upload['progress'] as double;
    final isImage = upload['isImage'] as bool;

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isUploading ? AppColors.accent : AppColors.divider,
          width: isUploading ? 1.5 : 0.8,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isImage ? const Color(0xFFE8F5E9) : AppColors.accentLight,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  isImage ? Icons.image_outlined : Icons.picture_as_pdf_outlined,
                  size: 20,
                  color: isImage ? Colors.green : AppColors.accent,
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(upload['name'] as String, style: AppTextStyles.titleLarge),
                    Text(
                      isUploading ? upload['info'] as String : '${upload['size']} • ${upload['info']}',
                      style: AppTextStyles.bodySmall,
                    ),
                  ],
                ),
              ),
              if (!isUploading) ...[
                const Icon(Icons.check_circle_outline, size: 20, color: AppColors.statusSuccess),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: onRemove,
                  child: const Icon(Icons.delete_outline, size: 20, color: AppColors.textMuted),
                ),
              ] else
                GestureDetector(
                  onTap: onRemove,
                  child: const Icon(Icons.close, size: 20, color: AppColors.textMuted),
                ),
            ],
          ),
          if (isUploading) ...[
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 4,
                backgroundColor: AppColors.accentLight,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
