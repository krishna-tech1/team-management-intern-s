import 'package:flutter/material.dart';
import '../models/notification_model.dart';
import '../models/announcement_model.dart';
import '../services/notification_service.dart';

/// The NotificationProvider manages notifications and announcements state
/// including fetching, displaying, and marking as read.
class NotificationProvider extends ChangeNotifier {
  final NotificationService _notificationService = NotificationService();
  List<NotificationModel> _notifications = [];
  List<AnnouncementModel> _announcements = [];
  String? _error;
  bool _isLoading = false;

  NotificationProvider();

  // Getters
  List<NotificationModel> get notifications => _notifications;
  List<AnnouncementModel> get announcements => _announcements;
  String? get error => _error;
  bool get isLoading => _isLoading;

  int get unreadNotificationCount =>
      _notifications.where((n) => !n.isRead).length;

  /// Initializes the provider by loading notifications and announcements from the service.
  Future<void> initializeNotifications(String employeeId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _notifications = await _notificationService.getNotifications();
      _announcements = await _notificationService.getAnnouncements();
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _notifications = [];
      _announcements = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Marks a notification as read.
  Future<void> markAsRead(String notificationId) async {
    try {
      await _notificationService.markNotificationAsRead(notificationId);
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      notifyListeners();
    }
  }

  /// Clears the error message.
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
