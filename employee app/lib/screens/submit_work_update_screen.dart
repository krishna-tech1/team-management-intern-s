import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import '../utils/app_theme.dart';
import '../providers/task_provider.dart';

class SubmitWorkUpdateScreen extends StatefulWidget {
  const SubmitWorkUpdateScreen({super.key});

  @override
  State<SubmitWorkUpdateScreen> createState() => _SubmitWorkUpdateScreenState();
}

class _SubmitWorkUpdateScreenState extends State<SubmitWorkUpdateScreen> {
  double _progress = 0.0;
  final _titleController = TextEditingController();
  final _notesController = TextEditingController();

  List<File> _photos = [];
  List<File> _documents = [];
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final taskProvider = Provider.of<TaskProvider>(context, listen: false);
        final task = taskProvider.selectedTask;
        if (task != null) {
          setState(() {
            _progress = task.progress > 1.0 ? task.progress / 100.0 : task.progress;
            _notesController.text = task.notes ?? '';
          });
        }
      }
    });
  }

  @override
  void dispose() {
    _titleController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickPhotos() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.image,
        allowMultiple: true,
      );
      if (result != null) {
        final newPhotos = result.paths
            .where((path) => path != null)
            .map((path) => File(path!))
            .toList();
        setState(() {
          _photos.addAll(newPhotos);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking photos: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _pickDocuments() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx'],
        allowMultiple: true,
      );
      if (result != null) {
        final newDocs = result.paths
            .where((path) => path != null)
            .map((path) => File(path!))
            .toList();
        setState(() {
          _documents.addAll(newDocs);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking documents: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  Future<void> _submitWorkUpdate() async {
    final title = _titleController.text.trim();
    if (title.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter an update title.'), backgroundColor: Colors.amber),
      );
      return;
    }

    final taskProvider = Provider.of<TaskProvider>(context, listen: false);
    final task = taskProvider.selectedTask;
    if (task == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No task selected to update.'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final success = await taskProvider.uploadTaskDocument(
      taskId: task.id,
      title: title,
      progress: _progress,
      remarks: _notesController.text.trim(),
      photos: _photos,
      documents: _documents,
    );

    setState(() {
      _isSubmitting = false;
    });

    if (success) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Work update submitted successfully!'), backgroundColor: AppColors.primary),
        );
        Navigator.of(context).pop();
      }
    } else {
      if (mounted) {
        final errorMsg = taskProvider.error ?? 'Submission failed';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $errorMsg'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final taskProvider = context.watch<TaskProvider>();
    final task = taskProvider.selectedTask;
    final percentLabel = '${(_progress * 100).round()}%';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF966314)),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          task != null ? 'Update: ${task.id}' : 'Submit Work Update',
          style: const TextStyle(color: Color(0xFF966314), fontSize: 18, fontWeight: FontWeight.w700),
        ),
      ),
      body: task == null
          ? const Center(child: Text('No task selected.'))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // UPDATE TITLE
                  const _SectionLabel(label: 'UPDATE TITLE'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _titleController,
                    enabled: !_isSubmitting,
                    decoration: InputDecoration(
                      hintText: 'e.g., Cable splicing and panel testing completed',
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
                            min: 0.0,
                            max: 1.0,
                            onChanged: _isSubmitting ? null : (v) => setState(() => _progress = v),
                          ),
                        ),
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Not Started', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF8A775E))),
                            Text('Completed', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF8A775E))),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // DETAILED NOTES
                  const _SectionLabel(label: 'DETAILED NOTES / REMARKS'),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _notesController,
                    maxLines: 4,
                    enabled: !_isSubmitting,
                    decoration: InputDecoration(
                      hintText: 'Describe the work performed, details for verification or blockers...',
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
                  const SizedBox(height: 24),

                  const Text('Upload Supporting Files', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: AppColors.textPrimary)),
                  const SizedBox(height: 6),
                  const Text(
                    'Select photos or documents to submit with this work update. Files must be under 25MB.',
                    style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 16),

                  // Pick Photos
                  _buildUploadSection(
                    title: 'Photos (Images)',
                    icon: Icons.image_outlined,
                    onTap: _isSubmitting ? null : _pickPhotos,
                    uploadHint: 'Tap to browse photo attachments',
                    uploadSub: 'JPG, PNG formats supported',
                  ),
                  const SizedBox(height: 12),

                  // Pick Documents
                  _buildUploadSection(
                    title: 'Documents (PDF, Word, Excel)',
                    icon: Icons.description_outlined,
                    onTap: _isSubmitting ? null : _pickDocuments,
                    uploadHint: 'Tap to browse PDF/Office documents',
                    uploadSub: 'PDF, DOC, XLS formats supported',
                  ),
                  const SizedBox(height: 20),

                  // Picked Files Section
                  if (_photos.isNotEmpty || _documents.isNotEmpty) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Picked Files', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                        Text('${_photos.length + _documents.length} Files', style: const TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w600)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ..._photos.map((file) {
                      final name = file.path.split(Platform.pathSeparator).last;
                      final size = file.lengthSync();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _buildPickedFileRow(
                          filename: name,
                          info: 'Photo • ${_formatFileSize(size)}',
                          isImage: true,
                          onDelete: _isSubmitting
                              ? null
                              : () => setState(() => _photos.remove(file)),
                        ),
                      );
                    }),
                    ..._documents.map((file) {
                      final name = file.path.split(Platform.pathSeparator).last;
                      final size = file.lengthSync();
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8),
                        child: _buildPickedFileRow(
                          filename: name,
                          info: 'Document • ${_formatFileSize(size)}',
                          isImage: false,
                          onDelete: _isSubmitting
                              ? null
                              : () => setState(() => _documents.remove(file)),
                        ),
                      );
                    }),
                    const SizedBox(height: 20),
                  ],

                  if (_isSubmitting) ...[
                    const Center(
                      child: Column(
                        children: [
                          CircularProgressIndicator(),
                          SizedBox(height: 8),
                          Text('Uploading work update and files...', style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Action Buttons
                  Row(
                    children: [
                      Expanded(
                        child: TextButton(
                          onPressed: _isSubmitting ? null : () => Navigator.of(context).pop(),
                          child: const Text(
                            'CANCEL',
                            style: TextStyle(color: AppColors.textSecondary, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: _isSubmitting ? null : _submitWorkUpdate,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFF39C12),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('SUBMIT', style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
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
    required VoidCallback? onTap,
    required String uploadHint,
    required String uploadSub,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: const Color(0xFF966314)),
              const SizedBox(width: 8),
              Text(title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.textPrimary)),
            ],
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: onTap,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.accentMedium, width: 1.5),
              ),
              child: Column(
                children: [
                  const Icon(Icons.cloud_upload_outlined, size: 28, color: Color(0xFF966314)),
                  const SizedBox(height: 8),
                  Text(
                    uploadHint,
                    style: const TextStyle(fontSize: 12, color: Color(0xFF966314), fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 3),
                  Text(uploadSub, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPickedFileRow({
    required String filename,
    required String info,
    required bool isImage,
    required VoidCallback? onDelete,
  }) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.divider, width: 0.8),
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isImage ? const Color(0xFFE8F5E9) : AppColors.accentLight,
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(
              isImage ? Icons.image : Icons.insert_drive_file,
              color: isImage ? Colors.green : AppColors.accent,
              size: 18,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  filename,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.textPrimary),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(info, style: const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
              ],
            ),
          ),
          if (onDelete != null)
            GestureDetector(
              onTap: onDelete,
              child: const Icon(Icons.delete_outline, color: Colors.red, size: 18),
            ),
        ],
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
