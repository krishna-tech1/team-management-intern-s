import 'package:flutter/material.dart';
import '../utils/app_theme.dart';

class SubmitWorkUpdateScreen extends StatefulWidget {
  const SubmitWorkUpdateScreen({super.key});

  @override
  State<SubmitWorkUpdateScreen> createState() => _SubmitWorkUpdateScreenState();
}

class _SubmitWorkUpdateScreenState extends State<SubmitWorkUpdateScreen> {
  double _progress = 0.85;
  final _titleController = TextEditingController();
  final _notesController = TextEditingController();

  @override
  void dispose() {
    _titleController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final percentLabel = '${(_progress * 100).round()}%';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF966314)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: const Text(
          'FieldCore',
          style: TextStyle(color: Color(0xFF966314), fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: const [
          Padding(
            padding: EdgeInsets.only(right: 16),
            child: CircleAvatar(
              radius: 16,
              backgroundImage: NetworkImage('https://i.pravatar.cc/150?img=11'),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // UPDATE TITLE
            const _SectionLabel(label: 'UPDATE TITLE'),
            const SizedBox(height: 8),
            TextField(
              controller: _titleController,
              decoration: InputDecoration(
                hintText: 'e.g., Initial cabling completed',
                hintStyle: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                fillColor: AppColors.surface,
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFD6C8B5)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFD6C8B5)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF966314), width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // PROGRESS PERCENTAGE
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFD6C8B5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Text(
                        'PROGRESS PERCENTAGE',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: Color(0xFF8A775E)),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF39C12),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          percentLabel,
                          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SliderTheme(
                    data: SliderTheme.of(context).copyWith(
                      activeTrackColor: const Color(0xFFF39C12),
                      inactiveTrackColor: const Color(0xFFEBE1D5),
                      thumbColor: const Color(0xFFF39C12),
                      trackHeight: 6,
                    ),
                    child: Slider(
                      value: _progress,
                      min: 0,
                      max: 1,
                      onChanged: (v) => setState(() => _progress = v),
                    ),
                  ),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: const [
                      Text('Not Started', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF8A775E))),
                      Text('Completed', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF8A775E))),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // DETAILED NOTES
            const _SectionLabel(label: 'DETAILED NOTES'),
            const SizedBox(height: 8),
            TextField(
              controller: _notesController,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'Describe the work performed, any blockers encountered, or specific details for the ops manager...',
                hintStyle: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
                hintMaxLines: 4,
                fillColor: AppColors.surface,
                filled: true,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFD6C8B5)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFFD6C8B5)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: const BorderSide(color: Color(0xFF966314), width: 1.5),
                ),
              ),
            ),
            const SizedBox(height: 40),

            const Text('Document Verification', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
            const SizedBox(height: 8),
            const Text(
              'Please upload the required documentation to proceed with your project assignment. Files must be under 25MB each.',
              style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 24),
            
            _buildUploadSection(
              title: 'Photos',
              icon: Icons.image,
              required: true,
              uploadIcon: Icons.cloud_upload_outlined,
              uploadText1: 'Drag & Drop or ',
              uploadLink: 'Browse',
              uploadText2: 'JPG, PNG up to 10MB',
            ),
            const SizedBox(height: 16),
            
            _buildUploadSection(
              title: 'Contracts',
              icon: Icons.description,
              required: false,
              uploadIcon: Icons.upload_file,
              uploadText1: 'Upload PDF Agreement',
              uploadText2: 'Must be digitally signed',
            ),
            const SizedBox(height: 16),

            _buildUploadSection(
              title: 'Support',
              icon: Icons.note_add,
              required: false,
              uploadIcon: Icons.add_box_outlined,
              uploadText1: 'Add Supporting Docs',
              uploadText2: 'Invoices, certificates, etc.',
            ),
            const SizedBox(height: 32),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                Text('Recent Uploads', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                Text('3 Files Uploaded', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Color(0xFF966314))),
              ],
            ),
            const SizedBox(height: 16),

            _buildRecentUploadItem(
              iconWidget: Image.network('https://images.unsplash.com/photo-1534088568595-a066f410cbda?w=100&q=80', width: 40, height: 40, fit: BoxFit.cover),
              filename: 'site_survey_north.jpg',
              subtitle: '4.2 MB • Uploaded 2m ago',
              status: 'done',
            ),
            const SizedBox(height: 12),
            _buildRecentUploadItem(
              iconWidget: const Icon(Icons.description, color: Color(0xFF966314), size: 24),
              iconBgColor: const Color(0xFFFFECCC),
              filename: 'compliance_checklist_v2.pdf',
              subtitle: 'Uploading... 65%',
              status: 'uploading',
              progress: 0.65,
            ),
            const SizedBox(height: 12),
            _buildRecentUploadItem(
              iconWidget: const Icon(Icons.description, color: Color(0xFF966314), size: 24),
              iconBgColor: const Color(0xFFFFECCC),
              filename: 'contract_signed_final.pdf',
              subtitle: '1.8 MB • Uploaded 15m ago',
              status: 'done',
            ),
            const SizedBox(height: 24),

            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFEBE1D5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.info, color: Color(0xFF966314), size: 20),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: const [
                        Text('Missing a document?', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                        SizedBox(height: 4),
                        Text(
                          'You can save your progress and return later to upload the remaining files. Your draft will be held for 7 days.',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                TextButton(
                  onPressed: () {},
                  child: const Text('SAVE FOR LATER', style: TextStyle(color: Color(0xFF966314), fontWeight: FontWeight.w700, fontSize: 13)),
                ),
                ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).pop();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF39C12),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: const Text('DONE', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildUploadSection({
    required String title,
    required IconData icon,
    required bool required,
    required IconData uploadIcon,
    required String uploadText1,
    String? uploadLink,
    required String uploadText2,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFEBE1D5), width: 1.5),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: const Color(0xFF966314)),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
              const Spacer(),
              if (required)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: const Color(0xFFFFD194), borderRadius: BorderRadius.circular(4)),
                  child: const Text('REQUIRED', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: Color(0xFF966314))),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24),
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFD6C8B5), width: 1.5),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Icon(uploadIcon, size: 32, color: const Color(0xFF966314)),
                const SizedBox(height: 12),
                if (uploadLink != null)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(uploadText1, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF966314))),
                      Text(uploadLink, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, decoration: TextDecoration.underline, color: Color(0xFF966314))),
                    ],
                  )
                else
                  Text(uploadText1, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Color(0xFF966314))),
                const SizedBox(height: 4),
                Text(uploadText2, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentUploadItem({
    required Widget iconWidget,
    Color? iconBgColor,
    required String filename,
    required String subtitle,
    required String status,
    double? progress,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        border: Border.all(color: const Color(0xFFD6C8B5), width: 1.5),
        borderRadius: BorderRadius.circular(8),
      ),
      clipBehavior: Clip.hardEdge,
      child: IntrinsicHeight(
        child: Row(
          children: [
            if (status == 'uploading')
              Container(width: 4, color: const Color(0xFFF39C12)),
            Expanded(
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: iconBgColor,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          clipBehavior: Clip.hardEdge,
                          child: Center(child: iconWidget),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(filename, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                              const SizedBox(height: 2),
                              Text(subtitle, style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                            ],
                          ),
                        ),
                        if (status == 'done') ...[
                          const Icon(Icons.check_circle, color: Color(0xFF966314), size: 20),
                          const SizedBox(width: 12),
                          const Icon(Icons.delete_outline, color: AppColors.textSecondary, size: 20),
                        ] else if (status == 'uploading') ...[
                          const Icon(Icons.close, color: AppColors.textSecondary, size: 20),
                        ],
                      ],
                    ),
                  ),
                  if (progress != null)
                    Padding(
                      padding: const EdgeInsets.only(left: 12, right: 12, bottom: 12),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: progress,
                          minHeight: 4,
                          backgroundColor: const Color(0xFFEBE1D5),
                          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFF39C12)),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: 1.2, color: Color(0xFF8A775E)),
    );
  }
}

