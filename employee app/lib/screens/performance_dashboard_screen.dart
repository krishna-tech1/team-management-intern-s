import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/employee_provider.dart';

class PerformanceDashboardScreen extends StatefulWidget {
  const PerformanceDashboardScreen({super.key});

  @override
  State<PerformanceDashboardScreen> createState() => _PerformanceDashboardScreenState();
}

class _PerformanceDashboardScreenState extends State<PerformanceDashboardScreen> {
  bool _isWeekly = true;

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
          'FieldCore',
          style: TextStyle(color: Color(0xFF966314), fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search, color: AppColors.textPrimary), onPressed: () {}),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Performance Score Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: const Color(0xFFF39C12),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'CURRENT PERFORMANCE SCORE',
                    style: AppTextStyles.labelLarge.copyWith(color: Colors.white70),
                  ),
                  const SizedBox(height: 8),
                  Consumer<EmployeeProvider>(
                    builder: (context, employeeProvider, _) {
                      final score = employeeProvider.employee?.performanceScore ?? 0;
                      return Text(
                        '$score%',
                        style: const TextStyle(fontSize: 42, fontWeight: FontWeight.w800, color: Colors.white),
                      );
                    },
                  ),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.trending_up, size: 13, color: Colors.white),
                        SizedBox(width: 4),
                        Text('+8.6% vs last month', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w500)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    "Excellent work this month. You're currently in the top 5% of field agents.",
                    style: TextStyle(color: Colors.white, fontSize: 13),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 16),
            // Weekly Productivity Chart
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
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Weekly Productivity', style: AppTextStyles.headlineMedium),
                          Text('Completion volume over time', style: AppTextStyles.bodySmall),
                        ],
                      ),
                      const Spacer(),
                      _ToggleButton(
                        label: 'Daily',
                        active: !_isWeekly,
                        onTap: () => setState(() => _isWeekly = false),
                      ),
                      const SizedBox(width: 4),
                      _ToggleButton(
                        label: 'Weekly',
                        active: _isWeekly,
                        onTap: () => setState(() => _isWeekly = true),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    height: 100,
                    child: CustomPaint(
                      painter: _LineChartPainter(),
                      size: const Size(double.infinity, 100),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Mon', style: AppTextStyles.bodySmall),
                      Text('Tue', style: AppTextStyles.bodySmall),
                      Text('Wed', style: AppTextStyles.bodySmall),
                      Text('Thu', style: AppTextStyles.bodySmall),
                      Text('Fri', style: TextStyle(fontSize: 11, color: Color(0xFF966314), fontWeight: FontWeight.w600)),
                      Text('Sat', style: AppTextStyles.bodySmall),
                      Text('Sun', style: AppTextStyles.bodySmall),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Incentive History
            Row(
              children: [
                const Text('Incentive History', style: AppTextStyles.headlineMedium),
                const Spacer(),
                GestureDetector(
                  onTap: () {},
                  child: const Text('View Reports', style: TextStyle(fontSize: 13, color: Color(0xFF966314), fontWeight: FontWeight.w600)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.divider, width: 0.8),
              ),
              child: Column(
                children: [
                  _IncentiveRow(
                    month: 'September 2025',
                    type: 'Performance Bonus',
                    amount: '\$450.00',
                    paidDate: 'Paid Oct 05',
                  ),
                  const Divider(height: 1, color: AppColors.divider),
                  _IncentiveRow(
                    month: 'August 2025',
                    type: 'Quality Merit',
                    amount: '\$385.50',
                    paidDate: 'Paid Sep 05',
                  ),
                  const Divider(height: 1, color: AppColors.divider),
                  _IncentiveRow(
                    month: 'July 2025',
                    type: 'Loyalty Program',
                    amount: '\$412.00',
                    paidDate: 'Paid Aug 05',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Recent Achievements
            Row(
              children: [
                const Text('Recent Achievements', style: AppTextStyles.headlineMedium),
                const Spacer(),
                GestureDetector(
                  onTap: () {},
                  child: const Text('View All', style: TextStyle(fontSize: 13, color: Color(0xFF966314), fontWeight: FontWeight.w500)),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 130,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: const [
                  _AchievementCard(label: 'Top Performer', subtitle: 'October 2025', icon: Icons.emoji_events),
                  SizedBox(width: 10),
                  _AchievementCard(label: 'Always On Time', subtitle: '15 Day Streak', icon: Icons.alarm_on),
                  SizedBox(width: 10),
                  _AchievementCard(label: 'Quality Star', subtitle: 'September 2025', icon: Icons.star),
                ],
              ),
            ),
            const SizedBox(height: 80),
          ],
        ),
      ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 3),
    );
  }
}

class _ToggleButton extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;

  const _ToggleButton({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : Colors.transparent,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: active ? Colors.white : AppColors.textSecondary,
          ),
        ),
      ),
    );
  }
}

class _IncentiveRow extends StatelessWidget {
  final String month;
  final String type;
  final String amount;
  final String paidDate;

  const _IncentiveRow({
    required this.month,
    required this.type,
    required this.amount,
    required this.paidDate,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFFD194),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.money, color: Color(0xFF966314)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(month, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                Text(type, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(amount, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF966314))),
              Text(paidDate, style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }
}

class _AchievementCard extends StatelessWidget {
  final String label;
  final String subtitle;
  final IconData icon;

  const _AchievementCard({required this.label, required this.subtitle, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 110,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider),
        color: AppColors.surface,
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Container(
              height: 75,
              color: Colors.black87,
              child: Center(child: Icon(icon, color: const Color(0xFFF39C12), size: 36)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(6),
            child: Column(
              children: [
                Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
                Text(subtitle, style: AppTextStyles.bodySmall, textAlign: TextAlign.center),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _LineChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final points = [0.3, 0.5, 0.4, 0.6, 0.85, 0.7, 0.6];
    final paint = Paint()
      ..color = const Color(0xFFD6C8B5)
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final stepX = size.width / (points.length - 1);

    path.moveTo(0, size.height * (1 - points[0]));
    for (int i = 1; i < points.length; i++) {
      final x = i * stepX;
      final y = size.height * (1 - points[i]);
      final prevX = (i - 1) * stepX;
      final prevY = size.height * (1 - points[i - 1]);
      final cpX1 = prevX + stepX / 3;
      final cpX2 = x - stepX / 3;
      path.cubicTo(cpX1, prevY, cpX2, y, x, y);
    }

    // Fill
    final fillPaint = Paint()
      ..color = Colors.transparent
      ..style = PaintingStyle.fill;
    final fillPath = Path.from(path);
    fillPath.lineTo(size.width, size.height);
    fillPath.lineTo(0, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);

    // Dot at Friday
    final fridayX = 4 * stepX;
    final fridayY = size.height * (1 - points[4]);
    final dotPaint = Paint()..color = const Color(0xFF966314);
    canvas.drawCircle(Offset(fridayX, fridayY), 5, dotPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
