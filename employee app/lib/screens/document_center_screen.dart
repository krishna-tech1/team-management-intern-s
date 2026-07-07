import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/task_provider.dart';
import '../providers/auth_provider.dart';
import '../services/document_upload_service.dart';

class DocumentCenterScreen extends StatefulWidget {
  const DocumentCenterScreen({super.key});

  @override
  State<DocumentCenterScreen> createState() => _DocumentCenterScreenState();
}

class _DocumentCenterScreenState extends State<DocumentCenterScreen> {
  final DocumentUploadService _uploadService = DocumentUploadService();
  
  List<Map<String, dynamic>> _history = [];
  bool _isLoadingHistory = true;
  
  File? _selectedFile;
  String? _selectedFileName;
  int? _selectedFileSize;
  
  int? _selectedTaskId;
  final TextEditingController _remarksController = TextEditingController();
  
  bool _isUploading = false;
  double _uploadProgress = 0.0;

  @override
  void initState() {
    super.initState();
    _loadHistory();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final auth = context.read<AuthProvider>();
        final employeeId = auth.currentUser?.uid ?? '';
        context.read<TaskProvider>().initializeTasks(employeeId);
      }
    });
  }

  @override
  void dispose() {
    _remarksController.dispose();
    super.dispose();
  }

  Future<void> _loadHistory() async {
    try {
      setState(() => _isLoadingHistory = true);
      final list = await _uploadService.getDocumentsHistory();
      setState(() {
        _history = list;
        _isLoadingHistory = false;
      });
    } catch (e) {
      setState(() => _isLoadingHistory = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to load history: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'],
      );
      if (result != null && result.files.single.path != null) {
        final path = result.files.single.path!;
        final file = File(path);
        final size = file.lengthSync();
        if (size > 25 * 1024 * 1024) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('File size must be under 25MB.'), backgroundColor: Colors.red),
            );
          }
          return;
        }
        setState(() {
          _selectedFile = file;
          _selectedFileName = result.files.single.name;
          _selectedFileSize = size;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking file: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  Future<void> _startUpload() async {
    if (_selectedFile == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a file first.'), backgroundColor: Colors.amber),
      );
      return;
    }

    setState(() {
      _isUploading = true;
      _uploadProgress = 0.0;
    });

    await _uploadService.uploadProgressDocument(
      file: _selectedFile!,
      fileName: _selectedFileName!,
      fileSize: _selectedFileSize!,
      taskId: _selectedTaskId,
      remarks: _remarksController.text.trim(),
      onProgress: (progress) {
        setState(() {
          _uploadProgress = progress;
        });
      },
      onComplete: (fileUrl, error) {
        setState(() {
          _isUploading = false;
        });
        if (error != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Upload failed: $error'), backgroundColor: Colors.red),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Document uploaded successfully!'), backgroundColor: AppColors.primary),
          );
          setState(() {
            _selectedFile = null;
            _selectedFileName = null;
            _selectedFileSize = null;
            _selectedTaskId = null;
            _remarksController.clear();
          });
          _loadHistory();
        }
      },
    );
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    return '${(bytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }

  @override
  Widget build(BuildContext context) {
    final taskProvider = context.watch<TaskProvider>();
    final activeTasks = taskProvider.tasks.where((t) => t.status != 'Completed').toList();

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
          'Traxa',
          style: TextStyle(color: AppColors.accent, fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimary),
            onPressed: _loadHistory,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Upload Progress Document', style: AppTextStyles.displayMedium),
            const SizedBox(height: 6),
            const Text(
              'Select a document (PDF, DOC/DOCX, JPG/PNG) to submit progress updates. Maximum file size 25MB.',
              style: AppTextStyles.bodyMedium,
            ),
            const SizedBox(height: 20),

            // Uploader Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.divider, width: 0.8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Select Progress File', style: AppTextStyles.headlineMedium),
                  const SizedBox(height: 12),
                  
                  // File Select Button
                  GestureDetector(
                    onTap: _isUploading ? null : _pickFile,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: _selectedFile != null ? AppColors.primary : AppColors.accentMedium,
                          width: 1.5,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            _selectedFile != null ? Icons.insert_drive_file : Icons.cloud_upload_outlined,
                            size: 38,
                            color: _selectedFile != null ? AppColors.primary : AppColors.accent,
                          ),
                          const SizedBox(height: 10),
                          Text(
                            _selectedFileName ?? 'Browse or pick document file',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              color: _selectedFile != null ? AppColors.primary : AppColors.accent,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          if (_selectedFileSize != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              _formatFileSize(_selectedFileSize!),
                              style: AppTextStyles.bodySmall,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Associate Task Dropdown
                  const Text('Associated Task (Optional)', style: AppTextStyles.titleLarge),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<int>(
                    initialValue: _selectedTaskId,
                    items: [
                      const DropdownMenuItem<int>(
                        value: null,
                        child: Text('No Task Association'),
                      ),
                      ...activeTasks.map((task) {
                        final taskId = int.tryParse(task.id.replaceAll('#T-', '')) ?? 0;
                        return DropdownMenuItem<int>(
                          value: taskId,
                          child: Text(task.title, overflow: TextOverflow.ellipsis),
                        );
                      }),
                    ],
                    onChanged: _isUploading ? null : (val) => setState(() => _selectedTaskId = val),
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: AppColors.background,
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppColors.divider),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Remarks Input
                  const Text('Remarks / Comments (Optional)', style: AppTextStyles.titleLarge),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _remarksController,
                    maxLines: 2,
                    enabled: !_isUploading,
                    decoration: InputDecoration(
                      hintText: 'Enter any remarks or comments for verification...',
                      filled: true,
                      fillColor: AppColors.background,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: const BorderSide(color: AppColors.divider),
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),

                  // Upload Progress
                  if (_isUploading) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Uploading document...', style: AppTextStyles.bodySmall),
                        Text('${(_uploadProgress * 100).toStringAsFixed(0)}%', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppColors.primary)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(4),
                      child: LinearProgressIndicator(
                        value: _uploadProgress,
                        minHeight: 6,
                        backgroundColor: AppColors.divider,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Action Button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _isUploading || _selectedFile == null ? null : _startUpload,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        disabledBackgroundColor: Colors.grey.shade300,
                      ),
                      child: const Text('SUBMIT PROGRESS UPLOAD', style: TextStyle(fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // History Header
            Row(
              children: [
                const Text('Upload History', style: AppTextStyles.headlineMedium),
                const Spacer(),
                Text(
                  '${_history.length} Uploads',
                  style: const TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // History List
            if (_isLoadingHistory)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_history.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No uploaded documents found.', style: AppTextStyles.bodyMedium),
                ),
              )
            else
              ..._history.map((doc) {
                final dateStr = doc['createdAt'] ?? doc['uploadedAt'] ?? '';
                final isVerified = doc['isVerified'] == true;
                final fileSize = doc['fileSize'] != null ? int.tryParse(doc['fileSize'].toString()) : null;
                
                DateTime? date;
                if (dateStr.isNotEmpty) {
                  date = DateTime.tryParse(dateStr.toString());
                }

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.divider, width: 0.8),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 40,
                        height: 40,
                        decoration: const BoxDecoration(
                          color: AppColors.accentLight,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.insert_drive_file_outlined,
                          color: AppColors.accent,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              doc['fileName']?.toString() ?? 'Document',
                              style: AppTextStyles.titleLarge,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${fileSize != null ? '${_formatFileSize(fileSize)} • ' : ''}${date != null ? DateFormat('MMM dd, yyyy').format(date.toLocal()) : ''}',
                              style: AppTextStyles.bodySmall,
                            ),
                            if (doc['remarks'] != null && doc['remarks'].toString().isNotEmpty) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Remarks: ${doc['remarks']}',
                                style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.textSecondary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Verification Status
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isVerified ? const Color(0xFFE8F5E9) : const Color(0xFFFFF3E0),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          isVerified ? 'VERIFIED' : 'PENDING',
                          style: TextStyle(
                            color: isVerified ? Colors.green.shade700 : Colors.orange.shade700,
                            fontSize: 10,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              }),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 0),
    );
  }
}
