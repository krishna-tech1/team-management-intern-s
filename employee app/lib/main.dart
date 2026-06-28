import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'utils/app_theme.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'providers/auth_provider.dart';
import 'providers/employee_provider.dart';
import 'providers/attendance_provider.dart';
import 'providers/task_provider.dart';
import 'providers/notification_provider.dart';
import 'providers/incentive_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FieldCoreApp());
}

class FieldCoreApp extends StatefulWidget {
  const FieldCoreApp({super.key});

  @override
  State<FieldCoreApp> createState() => _FieldCoreAppState();
}

class _FieldCoreAppState extends State<FieldCoreApp> {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        // Auth Provider - Initialize and handle auth state
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => AuthProvider()..initializeAuth(),
        ),
        // Employee Provider
        ChangeNotifierProvider<EmployeeProvider>(
          create: (_) => EmployeeProvider(),
        ),
        // Attendance Provider
        ChangeNotifierProvider<AttendanceProvider>(
          create: (_) => AttendanceProvider(),
        ),
        // Task Provider
        ChangeNotifierProvider<TaskProvider>(
          create: (_) => TaskProvider(),
        ),
        // Notification Provider
        ChangeNotifierProvider<NotificationProvider>(
          create: (_) => NotificationProvider(),
        ),
        // Incentive Provider
        ChangeNotifierProvider<IncentiveProvider>(
          create: (_) => IncentiveProvider(),
        ),
      ],
      child: MaterialApp(
        title: 'FieldCore - GST MCA Operations',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            // If authenticated, show dashboard, otherwise show login
            if (authProvider.isAuthenticated) {
              // Initialize employee data when authenticated
              if (authProvider.currentUser != null) {
                Future.microtask(() {
                  if (!context.mounted) return;
                  final employeeProvider = context.read<EmployeeProvider>();
                  final attendanceProvider = context.read<AttendanceProvider>();
                  final taskProvider = context.read<TaskProvider>();
                  final notificationProvider = context.read<NotificationProvider>();
                  final incentiveProvider = context.read<IncentiveProvider>();
                  
                  final uid = authProvider.currentUser!.uid;
                  
                  employeeProvider.loadEmployeeProfile(uid);
                  attendanceProvider.initializeAttendance(uid);
                  taskProvider.initializeTasks(uid);
                  notificationProvider.initializeNotifications(uid);
                  incentiveProvider.loadIncentives();
                });
              }
              return const DashboardScreen();
            } else {
              return const LoginScreen();
            }
          },
        ),
      ),
    );
  }
}
