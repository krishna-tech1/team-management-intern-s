import 'dart:convert';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../models/auth_response.dart';
import '../models/auth_user.dart';

class AuthService {
  final ApiClient _apiClient = ApiClient();

  Future<AuthResponse> login(String email, String password) async {
    final response = await _apiClient.post(
      ApiEndpoints.login,
      body: {
        'email': email,
        'password': password,
      },
    );
    final data = jsonDecode(response.body);
    final authResponse = AuthResponse.fromJson(data);
    await _apiClient.saveToken(authResponse.token);
    return authResponse;
  }

  Future<void> logout() async {
    try {
      await _apiClient.post(ApiEndpoints.logout);
    } catch (_) {
      // Ignore network errors on logout to allow offline state clear
    } finally {
      await _apiClient.clearToken();
    }
  }

  Future<AuthUser?> getProfile() async {
    try {
      final response = await _apiClient.get(ApiEndpoints.employeeProfile);
      final data = jsonDecode(response.body);
      final payload = data['data'] ?? data;
      return AuthUser.fromJson(payload['user'] ?? payload);
    } catch (_) {
      return null;
    }
  }
}
