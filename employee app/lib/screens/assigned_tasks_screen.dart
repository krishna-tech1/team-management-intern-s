import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../utils/app_theme.dart';
import '../utils/app_constants.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/task_provider.dart';
import '../providers/auth_provider.dart';
import 'task_details_screen.dart';
import 'package:intl/intl.dart';

class AssignedTasksScreen extends StatefulWidget {
  const AssignedTasksScreen({super.key});

  @override
  State<AssignedTasksScreen> createState() => _AssignedTasksScreenState();
}

class _AssignedTasksScreenState extends State<AssignedTasksScreen> {
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
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
    _searchController.dispose();
    super.dispose();
  }

  Color _priorityColor(String p) {
    switch (p) {
      case 'HIGH':
        return AppColors.statusHigh;
      case 'MEDIUM':
        return AppColors.statusMedium;
      default:
        return AppColors.statusLow;
    }
  }

  Color _priorityBgColor(String p) {
    switch (p) {
      case 'HIGH':
        return AppColors.statusHighBg;
      case 'MEDIUM':
        return AppColors.statusMediumBg;
      default:
        return AppColors.statusLowBg;
    }
  }

  IconData _priorityIcon(String p) {
    switch (p) {
      case 'HIGH':
        return Icons.priority_high;
      case 'MEDIUM':
        return Icons.bolt;
      default:
        return Icons.menu;
    }
  }

  Color _statusDotColor(String status) {
    switch (status) {
      case 'Pending Review':
        return Colors.red;
      case 'Not Started':
        return Colors.grey;
      default:
        return AppColors.accent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.primary,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.list_alt, color: Colors.white, size: 18),
          ),
        ),
        title: const Text(
          AppConstants.appName,
          style: TextStyle(color: AppColors.primary, fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.search, color: AppColors.textPrimary),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Bar
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: InputDecoration(
                      hintText: 'Search Task ID or Client...',
                      prefixIcon: const Icon(Icons.search, color: AppColors.textMuted, size: 20),
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                      fillColor: AppColors.surface,
                      filled: true,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.divider),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.divider),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: const BorderSide(color: AppColors.accent),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.divider),
                  ),
                  child: const Icon(Icons.tune, color: AppColors.textSecondary),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Header
            Row(
              children: [
                const Text('Assigned Tasks', style: AppTextStyles.headlineLarge),
                const Spacer(),
                Consumer<TaskProvider>(
                  builder: (context, taskProvider, _) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.accentLight,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${taskProvider.tasks.length} Tasks',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            // Task Cards
            Consumer<TaskProvider>(
              builder: (context, taskProvider, _) {
                final tasks = taskProvider.tasks.where((t) => t.status != 'Completed').toList();
                
                if (tasks.isEmpty) {
                  return Center(
                    child: Column(
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            color: AppColors.textMuted.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Icon(Icons.inbox_outlined, size: 48, color: AppColors.textMuted),
                        ),
                        const SizedBox(height: 12),
                        const Text('No tasks assigned', style: AppTextStyles.bodyMedium),
                      ],
                    ),
                  );
                }
                
                return Column(
                  children: tasks.map((task) {
                    final priority = task.priority;
                    final dateStr = DateFormat('MMM dd, yyyy').format(task.dueDate);
                    
                    return GestureDetector(
                      onTap: () {
                        context.read<TaskProvider>().selectTask(task);
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const TaskDetailsScreen()),
                        );
                      },
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surface,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.divider, width: 0.8),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Top Row: Task ID + Priority Badge
                            Row(
                              children: [
                                Text(
                                  task.id,
                                  style: const TextStyle(
                                    color: AppColors.accent,
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                if (task.hasBonus) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.accent,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Text(
                                      'BONUS AVAILABLE',
                                      style: TextStyle(fontSize: 9, color: Colors.white, fontWeight: FontWeight.w700),
                                    ),
                                  ),
                                ],
                                const Spacer(),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: _priorityBgColor(priority),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Icon(_priorityIcon(priority), size: 12, color: _priorityColor(priority)),
                                      const SizedBox(width: 3),
                                      Text(
                                        priority,
                                        style: TextStyle(
                                          fontSize: 10,
                                          fontWeight: FontWeight.w700,
                                          color: _priorityColor(priority),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            // Client Name
                            Text(task.client, style: AppTextStyles.headlineMedium),
                            const SizedBox(height: 10),
                            // Location + Date
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 15, color: AppColors.textSecondary),
                                const SizedBox(width: 4),
                                Text(task.location, style: AppTextStyles.bodyMedium),
                                const SizedBox(width: 16),
                                const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.textSecondary),
                                const SizedBox(width: 4),
                                Text(dateStr, style: AppTextStyles.bodyMedium),
                              ],
                            ),
                            const SizedBox(height: 12),
                            const Divider(color: AppColors.divider, height: 1),
                            const SizedBox(height: 10),
                            // Status + View Details
                            Row(
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    color: _statusDotColor(task.status),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                Text(task.status, style: AppTextStyles.bodyMedium),
                                const Spacer(),
                                const Text(
                                  'VIEW DETAILS →',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.accent,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  }).toList(),
                );
              },
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 1),
    );
  }
}
