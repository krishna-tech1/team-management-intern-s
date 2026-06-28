import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/incentive_provider.dart';
import '../models/payment_model.dart';

class IncentivesOverviewScreen extends StatelessWidget {
  const IncentivesOverviewScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final incentiveProvider = context.watch<IncentiveProvider>();
    final totalEarned = incentiveProvider.incentive?.totalEarned ?? 0.0;
    final currentMonthTotal = incentiveProvider.incentive?.currentMonthTotal ?? 0.0;

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
      body: incentiveProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Total Incentives Header
                  Text(
                    'TOTAL INCENTIVES EARNED',
                    style: AppTextStyles.labelLarge.copyWith(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Text(
                        '₹${totalEarned.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 34, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                      ),
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: AppColors.accentLight,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.trending_up, size: 13, color: AppColors.accent),
                            SizedBox(width: 4),
                            Text('+12%', style: TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w600)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  // October Earnings Card
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
                            const Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('Current Month Earnings', style: AppTextStyles.headlineMedium),
                                  Text('Estimated Payout: Nov 5, 2023', style: AppTextStyles.bodySmall),
                                ],
                              ),
                            ),
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: AppColors.accentLight,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.account_balance_wallet_outlined, size: 20, color: AppColors.accent),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Text(
                          '₹${currentMonthTotal.toStringAsFixed(2)}',
                          style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800, color: AppColors.textPrimary),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Text('Silver Tier', style: AppTextStyles.bodyMedium),
                            const Spacer(),
                            const Text('850 / 1000 pts', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.accent)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(6),
                          child: LinearProgressIndicator(
                            value: 0.85,
                            minHeight: 8,
                            backgroundColor: AppColors.accentLight,
                            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accent),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Earn 150 more points to unlock Gold Tier (2x Multiplier)',
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                  // Task Breakdown
                  const Text('Task Breakdown', style: AppTextStyles.headlineLarge),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.4,
                    children: [
                      _BreakdownCard(
                        icon: Icons.check_circle_outline,
                        label: 'GST VERIFICATIONS',
                        amount: '₹8,450',
                        badgeLabel: 'ACTIVE',
                        hasBadge: true,
                      ),
                      _BreakdownCard(
                        icon: Icons.location_on_outlined,
                        label: 'TRAVEL ALLOWANCE',
                        amount: '₹3,200',
                        hasBadge: false,
                      ),
                      _BreakdownCard(
                        icon: Icons.bolt,
                        label: 'QUALITY BONUS',
                        amount: '₹2,550',
                        hasBadge: false,
                        iconBgColor: const Color(0xFFE3F2FF),
                        iconColor: Colors.blue,
                      ),
                      _ClaimIncentiveCard(),
                    ],
                  ),
                  const SizedBox(height: 20),
                  // Payment History
                  Row(
                    children: [
                      const Text('Payment History', style: AppTextStyles.headlineLarge),
                      const Spacer(),
                      GestureDetector(
                        onTap: () {},
                        child: const Text('View All', style: TextStyle(fontSize: 13, color: AppColors.accent, fontWeight: FontWeight.w500)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (incentiveProvider.incentive == null || incentiveProvider.incentive!.history.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 20),
                      child: Text('No payment history records found.', style: AppTextStyles.bodyMedium),
                    )
                  else
                    ...incentiveProvider.incentive!.history.map((p) => _PaymentHistoryItem(payment: p)),
                  const SizedBox(height: 80),
                ],
              ),
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.accent,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        child: const Icon(Icons.card_giftcard, color: Colors.white),
      ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 3),
    );
  }
}

class _BreakdownCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String amount;
  final bool hasBadge;
  final String? badgeLabel;
  final Color? iconBgColor;
  final Color? iconColor;

  const _BreakdownCard({
    required this.icon,
    required this.label,
    required this.amount,
    required this.hasBadge,
    this.badgeLabel,
    this.iconBgColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
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
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconBgColor ?? AppColors.iconBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 16, color: iconColor ?? AppColors.primary),
              ),
              if (hasBadge) ...[
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.statusSuccess, borderRadius: BorderRadius.circular(4)),
                  child: Text(
                    badgeLabel ?? '',
                    style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w700),
                  ),
                ),
              ],
            ],
          ),
          const Spacer(),
          Text(label, style: AppTextStyles.labelMedium),
          const SizedBox(height: 4),
          Text(amount, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}

class _ClaimIncentiveCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.accent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.add_circle_outline, size: 28, color: Colors.white),
          SizedBox(height: 8),
          Text(
            'Claim Special\nIncentive',
            textAlign: TextAlign.center,
            style: TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}

class _PaymentHistoryItem extends StatelessWidget {
  final PaymentModel payment;
  const _PaymentHistoryItem({required this.payment});

  @override
  Widget build(BuildContext context) {
    final isArchived = payment.status == 'Archived';
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
            decoration: BoxDecoration(
              color: isArchived ? AppColors.surfaceVariant : AppColors.accentLight,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              isArchived ? Icons.history : Icons.check_circle_outline,
              size: 18,
              color: isArchived ? AppColors.textMuted : AppColors.accent,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(payment.month, style: AppTextStyles.titleLarge),
                Text(payment.date, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(payment.amount, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
              Text(
                payment.status,
                style: TextStyle(
                  fontSize: 11,
                  color: isArchived ? AppColors.textMuted : AppColors.statusSuccess,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
