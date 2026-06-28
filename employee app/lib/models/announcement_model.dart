/// The AnnouncementModel represents public broadcasts or announcements
/// issued by the GST MCA Administration to field experts.
class AnnouncementModel {
  final String id; // Unique announcement identifier
  final String title; // Title label of announcement
  final String body; // Full description details
  final DateTime createdAt; // Time generated
  final String createdBy; // Name/Role of supervisor creating it

  AnnouncementModel({
    required this.id,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.createdBy,
  });

  factory AnnouncementModel.fromJson(Map<String, dynamic> json) {
    return AnnouncementModel(
      id: json['id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      body: json['body']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      createdBy: json['createdBy']?.toString() ?? 'System Admin',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'body': body,
      'createdAt': createdAt.toIso8601String(),
      'createdBy': createdBy,
    };
  }

  AnnouncementModel copyWith({
    String? title,
    String? body,
    DateTime? createdAt,
    String? createdBy,
  }) {
    return AnnouncementModel(
      id: id,
      title: title ?? this.title,
      body: body ?? this.body,
      createdAt: createdAt ?? this.createdAt,
      createdBy: createdBy ?? this.createdBy,
    );
  }
}
