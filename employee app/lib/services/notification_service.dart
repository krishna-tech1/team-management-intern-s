import 'dart:convert';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../models/notification_model.dart';
import '../models/announcement_model.dart';

class NotificationService {
  final ApiClient _apiClient = ApiClient();

  Future<List<NotificationModel>> getNotifications() async {
    final response = await _apiClient.get(ApiEndpoints.notifications);
    final data = jsonDecode(response.body);
    final List list = data['notifications'] ?? (data is List ? data : []);
    return list.map((item) => NotificationModel.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  Future<List<AnnouncementModel>> getAnnouncements() async {
    final response = await _apiClient.get(ApiEndpoints.announcements);
    final data = jsonDecode(response.body);
    final List list = data['announcements'] ?? (data is List ? data : []);
    return list.map((item) => AnnouncementModel.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  Future<void> markNotificationAsRead(String id) async {
    await _apiClient.put(ApiEndpoints.markNotificationRead(id));
  }
}
