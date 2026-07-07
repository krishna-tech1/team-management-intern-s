import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/task_provider.dart';
import '../providers/employee_provider.dart';
import 'submit_work_update_screen.dart';

class TaskDetailsScreen extends StatefulWidget {
  const TaskDetailsScreen({super.key});

  @override
  State<TaskDetailsScreen> createState() => _TaskDetailsScreenState();
}

class _TaskDetailsScreenState extends State<TaskDetailsScreen> {
  bool _isSaving = false;

  void _handleMarkCompleted(BuildContext context, String taskId) async {
    final taskProvider = Provider.of<TaskProvider>(context, listen: false);
    final messenger = ScaffoldMessenger.of(context);
    final navigator = Navigator.of(context);
    setState(() {
      _isSaving = true;
    });

    final success = await taskProvider.markTaskAsCompleted(taskId);

    setState(() {
      _isSaving = false;
    });

    if (mounted) {
      if (success) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Task status updated to Completed!')),
        );
        navigator.pop();
      } else {
        final error = taskProvider.error ?? 'Failed to complete task';
        messenger.showSnackBar(
          SnackBar(content: Text(error)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final taskProvider = context.watch<TaskProvider>();
    final employeeProvider = context.watch<EmployeeProvider>();
    final task = taskProvider.selectedTask;

    if (task == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(title: const Text('Task Details')),
        body: const Center(child: Text('No task selected.')),
      );
    }

    final dateStr = DateFormat('MMM dd, yyyy').format(task.dueDate);
    final employeeName = employeeProvider.employee?.name ?? 'Assigned Agent';

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
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Card
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
                  Row(
                    children: [
                      Text(
                        'TASK ID: ${task.id}',
                        style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w500),
                      ),
                      const Spacer(),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.accentLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.bolt, size: 13, color: AppColors.accent),
                            const SizedBox(width: 3),
                            Text(
                              'Priority: ${task.priority}',
                              style: const TextStyle(fontSize: 11, color: AppColors.accent, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    task.title.isNotEmpty ? task.title : 'Compliance Filing Duty',
                    style: AppTextStyles.displayMedium,
                  ),
                  const SizedBox(height: 16),
                  _InfoRow(icon: Icons.grid_view_outlined, label: 'Client', value: task.client),
                  const SizedBox(height: 10),
                  _InfoRow(
                    icon: Icons.calendar_today_outlined,
                    label: 'Due Date',
                    value: dateStr,
                    valueColor: AppColors.statusHigh,
                  ),
                  const SizedBox(height: 10),
                  _InfoRow(icon: Icons.person_outline, label: 'Assigned To', value: employeeName),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Work Progress
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
                  const Text('Work Progress', style: AppTextStyles.headlineMedium),
                  const SizedBox(height: 16),
                  _WorkProgressStepper(status: task.status),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Description
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
                  const Text('Description', style: AppTextStyles.headlineMedium),
                  const SizedBox(height: 10),
                  Text(
                    task.description.isNotEmpty
                        ? task.description
                        : 'No additional instructions provided. Please execute standard filing and upload documents.',
                    style: AppTextStyles.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 10,
                    children: [
                      OutlinedButton.icon(
                        onPressed: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const SubmitWorkUpdateScreen()),
                          );
                        },
                        icon: const Icon(Icons.edit_note, size: 16, color: AppColors.accent),
                        label: const Text('Submit Update', style: TextStyle(color: AppColors.accent, fontSize: 12)),
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.accent),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Site Location
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
                  Text(
                    'SITE LOCATION',
                    style: AppTextStyles.labelLarge.copyWith(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      height: 140,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF1A2F3A), Color(0xFF2D5468), Color(0xFF1A3A4A)],
                        ),
                      ),
                      child: Stack(
                        children: [
                          // Grid lines
                          CustomPaint(
                            size: const Size(double.infinity, 140),
                            painter: _MapGridPainter(),
                          ),
                          // Location marker
                          const Center(
                            child: Icon(Icons.location_on, color: AppColors.accent, size: 36),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text('Zone 4B - Sector Alpha', style: AppTextStyles.titleLarge),
                  Text(task.location.isNotEmpty ? task.location : 'North Industrial Park, Gateway Way', style: AppTextStyles.bodyMedium),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Mark Completed Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: (task.status == 'Completed' || _isSaving)
                    ? null
                    : () => _handleMarkCompleted(context, task.id),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isSaving
                    ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text(task.status == 'Completed' ? 'Already Completed' : 'Mark Completed', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 1),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({required this.icon, required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          width: 34,
          height: 34,
          decoration: BoxDecoration(color: AppColors.iconBg, borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, size: 16, color: AppColors.primary),
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: AppTextStyles.bodySmall),
            Text(value, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: valueColor ?? AppColors.textPrimary)),
          ],
        ),
      ],
    );
  }
}

class _WorkProgressStepper extends StatelessWidget {
  final String status;
  const _WorkProgressStepper({required this.status});

  @override
  Widget build(BuildContext context) {
    final steps = [
      {'label': 'Assigned', 'done': true, 'active': false},
      {'label': 'In-Progress', 'done': status == 'In Progress' || status == 'Completed', 'active': status == 'In Progress'},
      {'label': 'Completed', 'done': status == 'Completed', 'active': status == 'Completed'},
    ];

    return Row(
      children: List.generate(steps.length * 2 - 1, (i) {
        if (i.isOdd) {
          // Connector line
          final leftStep = steps[i ~/ 2];
          final isDone = leftStep['done'] as bool;
          return Expanded(
            child: Container(
              height: 3,
              color: isDone ? AppColors.accent : AppColors.divider,
            ),
          );
        }
        final stepIndex = i ~/ 2;
        final step = steps[stepIndex];
        final isDone = step['done'] as bool;
        final isActive = step['active'] as bool;
        return Column(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: isDone
                    ? AppColors.accent
                    : isActive
                        ? AppColors.primary
                        : AppColors.divider,
              ),
              child: Icon(
                isDone ? Icons.check : isActive ? Icons.circle : Icons.flag_outlined,
                size: 16,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              step['label'] as String,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: isDone ? AppColors.accent : isActive ? AppColors.primary : AppColors.textMuted,
              ),
            ),
          ],
        );
      }),
    );
  }
}

class _MapGridPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.08)
      ..strokeWidth = 0.8;

    for (double x = 0; x < size.width; x += 30) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 30) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
