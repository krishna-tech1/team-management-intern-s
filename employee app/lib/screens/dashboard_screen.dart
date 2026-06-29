import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
//import 'dart:math' as math;
import '../utils/app_theme.dart';
import '../utils/app_constants.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/employee_provider.dart';
import '../providers/task_provider.dart';
import '../providers/attendance_provider.dart';
import 'performance_dashboard_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: CircleAvatar(
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.person, color: Colors.white, size: 20),
          ),
        ),
        title: const Text(
          AppConstants.appName,
          style: TextStyle(
            color: Color(0xFF966314),
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
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
            // Greeting Card
            _GreetingCard(),
            const SizedBox(height: 16),
            // Performance Score Card
            _PerformanceScoreCard(),
            const SizedBox(height: 16),
            // Stats Grid
            _StatsGrid(),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 0),
    );
  }
}

class _GreetingCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer2<EmployeeProvider, TaskProvider>(
      builder: (context, employeeProvider, taskProvider, _) {
        final employee = employeeProvider.employee;
        final taskCount = taskProvider.tasks.length;
        
        return Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.divider, width: 0.8),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'WELCOME BACK',
                style: AppTextStyles.labelLarge.copyWith(color: AppColors.textMuted),
              ),
              const SizedBox(height: 6),
              Text(
                'Good Morning, ${employee?.name ?? 'Employee'}',
                style: AppTextStyles.displayMedium,
              ),
              const SizedBox(height: 4),
              Text(
                'You have $taskCount assigned tasks today.',
                style: AppTextStyles.bodyMedium,
              ),
            ],
          ),
        );
      },
    );
  }
}

class _PerformanceScoreCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer<EmployeeProvider>(
      builder: (context, employeeProvider, _) {
        final employee = employeeProvider.employee;
        final score = employee?.performanceScore ?? 0;
        
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.divider, width: 0.8),
          ),
          child: Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color.fromARGB(255, 140, 97, 28), width: 10),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '$score',
                        style: const TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF966314),
                        ),
                      ),
                      const Text(
                        'SCORE',
                        style: TextStyle(
                          fontSize: 10,
                          letterSpacing: 1,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 20),
              Expanded(
                flex: 2,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Performance\nScore', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                    const SizedBox(height: 8),
                    GestureDetector(
                      onTap: () {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const PerformanceDashboardScreen()),
                        );
                      },
                      child: const Text(
                        'View Details >',
                        style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Color(0xFF966314)),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFD194),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          Icon(Icons.trending_up, size: 14, color: Color(0xFF966314)),
                          SizedBox(width: 4),
                          Text(
                            '+12% vs last\nmonth',
                            style: TextStyle(fontSize: 11, color: Color(0xFF966314), fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}



class _StatsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Consumer3<TaskProvider, AttendanceProvider, EmployeeProvider>(
      builder: (context, taskProvider, attendanceProvider, employeeProvider, _) {
        final allTasks = taskProvider.tasks;
        final completedTasks = allTasks.where((t) => t.status == 'Completed').length;
        final pendingTasks = allTasks.where((t) => t.status != 'Completed').length;
        final isClockedIn = attendanceProvider.isClockedIn;

        final stats = [
          {
            'icon': Icons.assignment,
            'label': 'ASSIGNED TASKS',
            'value': '${allTasks.length}',
            'color': const Color(0xFF966314),
            'bgColor': const Color(0xFFEBE1D5),
            'highlight': false
          },
          {
            'icon': Icons.check_circle_outline,
            'label': 'COMPLETED',
            'value': '$completedTasks',
            'color': const Color(0xFF966314),
            'bgColor': const Color(0xFFFFD194),
            'highlight': false
          },
          {
            'icon': Icons.pending_actions,
            'label': 'PENDING TASKS',
            'value': '$pendingTasks',
            'color': const Color(0xFFD32F2F),
            'bgColor': const Color(0xFFFFEBEE),
            'highlight': false
          },
          {
            'icon': Icons.location_on,
            'label': 'CHECK-IN STATUS',
            'value': isClockedIn ? 'Active' : 'Inactive',
            'color': isClockedIn ? const Color(0xFF1976D2) : const Color(0xFFD32F2F),
            'bgColor': isClockedIn ? const Color(0xFFE3F2FD) : const Color(0xFFFFEBEE),
            'highlight': true
          },
        ];
        return GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.5,
          children: stats.map((s) {
            final highlight = s['highlight'] as bool;
            final color = s['color'] as Color;
            final bgColor = s['bgColor'] as Color;
            return Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.divider, width: 0.8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(color: bgColor, borderRadius: BorderRadius.circular(8)),
                    child: Icon(s['icon'] as IconData, size: 18, color: color),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s['label'] as String, style: AppTextStyles.labelMedium),
                      Text(
                        s['value'] as String,
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: highlight ? const Color(0xFF966314) : AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }).toList(),
        );
      },
    );
  }
}


