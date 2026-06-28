/// The NotificationModel maps internal user notifications and logs (e.g. reminders, announcements).
class NotificationModel {
  final String id; // Notification unique identifier
  final String employeeId; // Associated Employee ID receiving this notification
  final String title; // Notification header title
  final String body; // Description or content message
  final DateTime createdAt; // Time the notification was sent
  final bool isRead; // Status flag indicating if the employee viewed it
  final String type; // Type of notification: 'attendance_reminder', 'task_reminder', 'announcement', 'general'

  NotificationModel({
    required this.id,
    required this.employeeId,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.isRead,
    required this.type,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id']?.toString() ?? '',
      employeeId: json['employeeId']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      isRead: json['isRead'] ?? false,
      type: json['type']?.toString() ?? 'general',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeId': employeeId,
      'title': title,
      'body': body,
      'createdAt': createdAt.toIso8601String(),
      'isRead': isRead,
      'type': type,
    };
  }

  NotificationModel copyWith({
    String? employeeId,
    String? title,
    String? body,
    DateTime? createdAt,
    bool? isRead,
    String? type,
  }) {
    return NotificationModel(
      id: id,
      employeeId: employeeId ?? this.employeeId,
      title: title ?? this.title,
      body: body ?? this.body,
      createdAt: createdAt ?? this.createdAt,
      isRead: isRead ?? this.isRead,
      type: type ?? this.type,
    );
  }
}
