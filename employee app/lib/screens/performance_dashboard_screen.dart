import 'package:flutter/material.dart';
import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../services/employee_service.dart';

class PerformanceDashboardScreen extends StatefulWidget {
  const PerformanceDashboardScreen({super.key});

  @override
  State<PerformanceDashboardScreen> createState() => _PerformanceDashboardScreenState();
}

class _PerformanceDashboardScreenState extends State<PerformanceDashboardScreen> {
  final EmployeeService _employeeService = EmployeeService();
  bool _isLoading = true;
  String? _error;
  Map<String, dynamic>? _perfData;

  @override
  void initState() {
    super.initState();
    _loadPerformanceData();
  }

  Future<void> _loadPerformanceData() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      final data = await _employeeService.getEmployeePerformance();
      setState(() {
        _perfData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString().replaceAll('HttpException: ', '');
        _isLoading = false;
      });
    }
  }

  Widget _buildStars(double rating) {
    List<Widget> stars = [];
    int fullStars = rating.floor();
    bool hasHalf = (rating - fullStars) >= 0.5;
    for (int i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.add(const Icon(Icons.star, color: Colors.amber, size: 14));
      } else if (i == fullStars && hasHalf) {
        stars.add(const Icon(Icons.star_half, color: Colors.amber, size: 14));
      } else {
        stars.add(const Icon(Icons.star_border, color: Colors.amber, size: 14));
      }
    }
    return Row(mainAxisSize: MainAxisSize.min, children: stars);
  }

  Widget _buildKpiCard({
    required String title,
    required String value,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
    double fontSize = 20,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider, width: 0.8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: bgColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
            ],
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: fontSize,
              fontWeight: FontWeight.w800,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRatingCard({
    required String title,
    required double rating,
    required IconData icon,
    required Color iconColor,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider, width: 0.8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textSecondary,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: bgColor,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                rating.toStringAsFixed(1),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 2),
              _buildStars(rating),
            ],
          ),
        ],
      ),
    );
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
          child: CircleAvatar(
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.person, color: Colors.white, size: 20),
          ),
        ),
        title: const Text(
          'Traxa',
          style: TextStyle(color: AppColors.accent, fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textPrimary),
            onPressed: _loadPerformanceData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.error_outline, color: Colors.red, size: 48),
                        const SizedBox(height: 16),
                        Text(_error!, style: AppTextStyles.bodyMedium, textAlign: TextAlign.center),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadPerformanceData,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
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
                            Text(
                              '${_perfData?['score'] ?? 0}%',
                              style: const TextStyle(fontSize: 42, fontWeight: FontWeight.w800, color: Colors.white),
                            ),
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.3),
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
                              "Excellent work this month. You're currently in the top 5% of compliance executives.",
                              style: TextStyle(color: Colors.white, fontSize: 13),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 20),
                      const Text(
                        'Key Performance Indicators',
                        style: AppTextStyles.headlineMedium,
                      ),
                      const SizedBox(height: 12),

                      // KPI Cards Grid (Replaces charts)
                      GridView.count(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        crossAxisCount: 2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                        childAspectRatio: 1.3,
                        children: [
                          _buildKpiCard(
                            title: 'Tasks Completed',
                            value: '${_perfData?['completedTasks'] ?? 0}',
                            icon: Icons.assignment_turned_in,
                            iconColor: Colors.green,
                            bgColor: const Color(0xFFE8F5E9),
                          ),
                          _buildKpiCard(
                            title: 'Tasks Pending',
                            value: '${_perfData?['pendingTasks'] ?? 0}',
                            icon: Icons.assignment_late,
                            iconColor: Colors.orange,
                            bgColor: const Color(0xFFFFF3E0),
                          ),
                          _buildKpiCard(
                            title: 'Attendance %',
                            value: '${_perfData?['attendancePercentage'] ?? 0}%',
                            icon: Icons.calendar_month,
                            iconColor: Colors.blue,
                            bgColor: const Color(0xFFE3F2FD),
                          ),
                          _buildKpiCard(
                            title: 'Productivity %',
                            value: '${_perfData?['productivityPercentage'] ?? 0}%',
                            icon: Icons.speed,
                            iconColor: Colors.purple,
                            bgColor: const Color(0xFFF3E5F5),
                          ),
                          _buildKpiCard(
                            title: 'Avg Comp Time',
                            value: '${_perfData?['averageCompletionTime'] ?? 'N/A'}',
                            icon: Icons.timer,
                            iconColor: Colors.teal,
                            bgColor: const Color(0xFFE0F2F1),
                            fontSize: 13,
                          ),
                          _buildRatingCard(
                            title: 'Current Rating',
                            rating: (_perfData?['currentRating'] as num?)?.toDouble() ?? 4.0,
                            icon: Icons.star_rate,
                            iconColor: Colors.amber,
                            bgColor: const Color(0xFFFFFDE7),
                          ),
                        ],
                      ),

                      const SizedBox(height: 24),
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
                              amount: '₹450.00',
                              paidDate: 'Paid Oct 05',
                            ),
                            const Divider(height: 1, color: AppColors.divider),
                            _IncentiveRow(
                              month: 'August 2025',
                              type: 'Quality Merit',
                              amount: '₹385.50',
                              paidDate: 'Paid Sep 05',
                            ),
                            const Divider(height: 1, color: AppColors.divider),
                            _IncentiveRow(
                              month: 'July 2025',
                              type: 'Loyalty Program',
                              amount: '₹412.00',
                              paidDate: 'Paid Aug 05',
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
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
                          children: [
                            const _AchievementCard(label: 'Top Performer', subtitle: 'October 2025', icon: Icons.emoji_events),
                            const SizedBox(width: 10),
                            const _AchievementCard(label: 'Always On Time', subtitle: '15 Day Streak', icon: Icons.alarm_on),
                            const SizedBox(width: 10),
                            const _AchievementCard(label: 'Quality Star', subtitle: 'September 2025', icon: Icons.star),
                            if (_perfData?['achievements'] != null)
                              ...(_perfData!['achievements'] as List).map(
                                (ach) => Padding(
                                  padding: const EdgeInsets.only(left: 10),
                                  child: _AchievementCard(label: ach.toString(), subtitle: 'Milestone Achieved', icon: Icons.workspace_premium),
                                ),
                              ),
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
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(month, style: AppTextStyles.titleLarge),
                const SizedBox(height: 2),
                Text(type, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.accent,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                paidDate,
                style: const TextStyle(
                  fontSize: 11,
                  color: AppColors.textSecondary,
                ),
              ),
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

  const _AchievementCard({
    required this.label,
    required this.subtitle,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: const Color(0xFFF39C12), size: 24),
          const SizedBox(height: 10),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: const TextStyle(
              fontSize: 10,
              color: AppColors.textSecondary,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
