class AppConfig {
  /// Update this value to point to your backend REST API base URL.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://team-management-intern-s-pzly.vercel.app/api',
  );
}
