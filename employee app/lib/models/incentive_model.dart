import 'payment_model.dart';

class IncentiveModel {
  final double totalEarned;
  final double currentMonthTotal;
  final List<PaymentModel> history;

  IncentiveModel({
    required this.totalEarned,
    required this.currentMonthTotal,
    required this.history,
  });

  factory IncentiveModel.fromJson(Map<String, dynamic> json) {
    final List histJson = json['history'] ?? [];
    final List<PaymentModel> histList = histJson.map((item) {
      if (item is Map) {
        return PaymentModel(
          month: item['reason']?.toString() ?? item['month']?.toString() ?? 'Incentive Payout',
          date: item['createdAt']?.toString() ?? item['date']?.toString() ?? '',
          amount: item['amount'] != null ? '₹${item['amount']}' : '₹0',
          status: item['status']?.toString() ?? 'Successful',
        );
      }
      return PaymentModel.fromJson(Map<String, dynamic>.from(item));
    }).toList();

    return IncentiveModel(
      totalEarned: (json['totalEarned'] as num?)?.toDouble() ?? 0.0,
      currentMonthTotal: (json['currentMonthTotal'] as num?)?.toDouble() ?? 0.0,
      history: histList,
    );
  }
}
