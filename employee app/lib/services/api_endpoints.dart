class ApiEndpoints {
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  
  static const String employeeProfile = '/employee/profile';
  static const String updateProfile = '/employee/profile';
  static const String uploadAvatar = '/employee/profile';

  static const String tasks = '/employee/tasks';
  static String updateTaskProgress(String id) => '/employee/tasks/$id/status';
  static String uploadTaskDocument(String id) => '/employee/tasks/$id/work-update';
  static String completeTask(String id) => '/employee/tasks/$id/status';

  static const String attendanceLogs = '/employee/attendance';
  static const String clockIn = '/employee/checkin';
  static const String clockOut = '/employee/checkout';

  static const String notifications = '/employee/notifications';
  static const String announcements = '/employee/notifications';
  static String markNotificationRead(String id) => '/employee/notifications/$id/read';
}
