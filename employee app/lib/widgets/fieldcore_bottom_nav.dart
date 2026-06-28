import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../screens/dashboard_screen.dart';
import '../screens/assigned_tasks_screen.dart';
import '../screens/gps_attendance_screen.dart';
import '../screens/performance_dashboard_screen.dart';
import '../screens/employee_profile_screen.dart';

class FieldCoreBottomNav extends StatelessWidget {
  final int currentIndex;

  const FieldCoreBottomNav({super.key, required this.currentIndex});

  void _onTap(BuildContext context, int index) {
    if (index == currentIndex) return;
    Widget destination;
    switch (index) {
      case 0:
        destination = const DashboardScreen();
        break;
      case 1:
        destination = const AssignedTasksScreen();
        break;
      case 2:
        destination = const GpsAttendanceScreen();
        break;
      case 3:
        destination = const PerformanceDashboardScreen();
        break;
      case 4:
        destination = const EmployeeProfileScreen();
        break;
      default:
        return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => destination),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentIndex,
      onTap: (index) => _onTap(context, index),
      selectedItemColor: AppColors.accent,
      unselectedItemColor: AppColors.textSecondary,
      backgroundColor: AppColors.surface,
      type: BottomNavigationBarType.fixed,
      elevation: 10,
      selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
      unselectedLabelStyle: const TextStyle(fontSize: 11),
      items: [
        BottomNavigationBarItem(
          icon: Icon(currentIndex == 0 ? Icons.home : Icons.home_outlined),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(currentIndex == 1 ? Icons.check_box : Icons.check_box_outlined),
          label: 'Tasks',
        ),
        BottomNavigationBarItem(
          icon: Icon(currentIndex == 2 ? Icons.calendar_month : Icons.calendar_month_outlined),
          label: 'Attendance',
        ),
        BottomNavigationBarItem(
          icon: Icon(currentIndex == 3 ? Icons.trending_up : Icons.trending_up_outlined),
          label: 'Performance',
        ),
        BottomNavigationBarItem(
          icon: Icon(currentIndex == 4 ? Icons.person : Icons.person_outline),
          label: 'Profile',
        ),
      ],
    );
  }
}
