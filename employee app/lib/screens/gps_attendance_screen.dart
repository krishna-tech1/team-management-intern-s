import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/attendance_provider.dart';
import '../providers/auth_provider.dart';
import '../models/attendance_model.dart';

class GpsAttendanceScreen extends StatefulWidget {
  const GpsAttendanceScreen({super.key});

  @override
  State<GpsAttendanceScreen> createState() => _GpsAttendanceScreenState();
}

class _GpsAttendanceScreenState extends State<GpsAttendanceScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 0.8, end: 1.2).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final attProvider = context.watch<AttendanceProvider>();
    final auth = context.watch<AuthProvider>();
    final employeeId = auth.currentUser?.uid ?? '';
    
    final hasCheckIn = attProvider.todayAttendance?.checkInTime != null;
    final hasCheckOut = attProvider.todayAttendance?.checkOutTime != null;
    final formatter = DateFormat('hh:mm a');
    
    final String checkInText = hasCheckIn ? formatter.format(attProvider.todayAttendance!.checkInTime!) : '--';
    final String checkOutText = hasCheckOut ? formatter.format(attProvider.todayAttendance!.checkOutTime!) : '--';

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
          'FieldCore',
          style: TextStyle(color: AppColors.primary, fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search, color: AppColors.textPrimary), onPressed: () {}),
        ],
      ),
      body: attProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  // Map Container
                  SizedBox(
                    height: 260,
                    child: Stack(
                      children: [
                        // Dark map background
                        Container(
                          width: double.infinity,
                          height: 260,
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [Color(0xFF1A3040), Color(0xFF2A4A60), Color(0xFF1C3850)],
                            ),
                          ),
                          child: CustomPaint(painter: _MapPainter()),
                        ),
                        // GPS Label
                        const Positioned(
                          top: 12,
                          right: 50,
                          child: Text(
                            'GPS ATTENDANCE',
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                        // Menu icon
                        const Positioned(
                          top: 12,
                          right: 12,
                          child: Icon(Icons.menu, color: Colors.white70, size: 20),
                        ),
                        // "You are here" bubble
                        const Positioned(
                          top: 60,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: _YouAreHereBubble(),
                          ),
                        ),
                        // Pulsing location dot
                        Positioned(
                          bottom: 50,
                          left: 0,
                          right: 0,
                          child: Center(
                            child: AnimatedBuilder(
                              animation: _pulseAnimation,
                              builder: (_, child) => Container(
                                width: 20 * _pulseAnimation.value,
                                height: 20 * _pulseAnimation.value,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: AppColors.accent.withValues(alpha: 0.5),
                                ),
                                child: Center(
                                  child: Container(
                                    width: 12,
                                    height: 12,
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                      color: AppColors.accent,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Location Verified Card
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
                                  const Text('Location Verified', style: AppTextStyles.headlineLarge),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: AppColors.accent,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.location_on, size: 12, color: Colors.white),
                                        SizedBox(width: 4),
                                        Text('ACTIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              const Row(
                                children: [
                                  Icon(Icons.check_circle_outline, size: 14, color: AppColors.accent),
                                  SizedBox(width: 4),
                                  Text('GPS High Accuracy', style: TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w500)),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.accentLight,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.location_on_outlined, size: 16, color: AppColors.primary),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text('CURRENT ADDRESS', style: AppTextStyles.labelMedium),
                                          const SizedBox(height: 3),
                                          Text(
                                            attProvider.todayAttendance?.checkInAddress ??
                                                'Innovation Tower, 452 Tech Plaza,\nSan Francisco, CA 94103',
                                            style: AppTextStyles.bodyMedium,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Check In / Check Out Buttons
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: attProvider.isClockedIn
                                    ? null
                                    : () async {
                                        final now = DateTime.now();
                                        final record = AttendanceModel(
                                          id: 'att-$employeeId-${now.millisecondsSinceEpoch}',
                                          employeeId: employeeId,
                                          date: now.toIso8601String().split('T').first,
                                          checkInTime: now,
                                          status: 'VERIFIED',
                                          duration: '0h 0m',
                                          checkInLatitude: 12.9716,
                                          checkInLongitude: 77.5946,
                                          checkInAddress: 'Innovation Tower, 452 Tech Plaza, San Francisco, CA 94103',
                                        );
                                        final success = await attProvider.clockIn(record);
                                        if (success && context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Checked In successfully!'), backgroundColor: AppColors.primary),
                                          );
                                        }
                                      },
                                icon: const Icon(Icons.login, color: Colors.white),
                                label: const Text('Check-In', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: !attProvider.isClockedIn
                                    ? null
                                    : () async {
                                        final todayAttId = attProvider.todayAttendance?.id ?? '';
                                        if (todayAttId.isEmpty) return;
                                        
                                        final success = await attProvider.clockOut(todayAttId, {
                                          'duration': '8h 43m',
                                          'checkOutLatitude': 12.9768,
                                          'checkOutLongitude': 77.6012,
                                          'checkOutAddress': 'Innovation Tower, 452 Tech Plaza, San Francisco, CA 94103',
                                        });
                                        if (success && context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Checked Out successfully!'), backgroundColor: AppColors.primary),
                                          );
                                        }
                                      },
                                icon: const Icon(Icons.logout, color: AppColors.primary),
                                label: const Text('Check-Out', style: TextStyle(color: AppColors.primary, fontSize: 16, fontWeight: FontWeight.w600)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  side: const BorderSide(color: AppColors.primary, width: 1.5),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (hasCheckIn)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.divider),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                Text('Check-in: $checkInText', style: AppTextStyles.bodyMedium),
                                Text('Check-out: $checkOutText', style: AppTextStyles.bodyMedium),
                              ],
                            ),
                          ),
                        const SizedBox(height: 20),
                        // Recent Logs
                        Row(
                          children: [
                            const Text('Recent Logs', style: AppTextStyles.headlineMedium),
                            const Spacer(),
                            GestureDetector(
                              onTap: () {},
                              child: const Text(
                                'VIEW ALL',
                                style: TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (attProvider.attendanceHistory.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Text('No attendance logs found.', style: AppTextStyles.bodyMedium),
                          )
                        else
                          ...attProvider.attendanceHistory.map((log) => _AttendanceLogItem(log: log)),
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 2),
    );
  }
}

class _YouAreHereBubble extends StatelessWidget {
  const _YouAreHereBubble();

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.15), blurRadius: 8)],
      ),
      child: const Column(
        children: [
          Text('You are here', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          Text('Within 5m range', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ],
      ),
    );
  }
}

class _AttendanceLogItem extends StatelessWidget {
  final AttendanceModel log;
  const _AttendanceLogItem({required this.log});

  @override
  Widget build(BuildContext context) {
    final isIn = log.checkOutTime == null;
    final isVerified = log.status == 'VERIFIED';
    final formatter = DateFormat('MMM dd • hh:mm a');
    final String displayDate = log.checkInTime != null ? formatter.format(log.checkInTime!) : log.date;
    final String logType = log.checkOutTime != null ? 'Clock Out' : 'Clock In';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider, width: 0.8),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: AppColors.iconBg, borderRadius: BorderRadius.circular(10)),
            child: Icon(isIn ? Icons.login : Icons.logout, size: 18, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(logType, style: AppTextStyles.titleLarge),
                Text(displayDate, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          if (isVerified)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(6)),
              child: const Text('VERIFIED', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
            )
          else
            Text(log.status, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}

class _MapPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.07)
      ..strokeWidth = 1;
    final roadPaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.12)
      ..strokeWidth = 2;

    // Grid
    for (double x = 0; x < size.width; x += 40) {
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);
    }
    for (double y = 0; y < size.height; y += 40) {
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }
    // Roads
    canvas.drawLine(Offset(0, size.height * 0.4), Offset(size.width, size.height * 0.4), roadPaint);
    canvas.drawLine(Offset(size.width * 0.3, 0), Offset(size.width * 0.3, size.height), roadPaint);
    canvas.drawLine(Offset(size.width * 0.7, 0), Offset(size.width * 0.7, size.height), roadPaint);
    // Diagonal road
    canvas.drawLine(
      Offset(0, size.height * 0.2),
      Offset(size.width * 0.6, size.height),
      roadPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
