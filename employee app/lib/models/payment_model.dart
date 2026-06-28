class PaymentModel {
  final String month;
  final String date;
  final String amount;
  final String status;

  PaymentModel({
    required this.month,
    required this.date,
    required this.amount,
    required this.status,
  });

  factory PaymentModel.fromJson(Map<String, dynamic> json) {
    return PaymentModel(
      month: json['month']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      amount: json['amount']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'month': month,
      'date': date,
      'amount': amount,
      'status': status,
    };
  }
}
