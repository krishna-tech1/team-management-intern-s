import 'dart:convert';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../models/employee.dart';

class EmployeeService {
  final ApiClient _apiClient = ApiClient();

  Future<Employee> getEmployeeProfile() async {
    final response = await _apiClient.get(ApiEndpoints.employeeProfile);
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return Employee.fromJson(payload['employee'] ?? payload);
  }

  Future<Employee> updateProfile(Map<String, dynamic> updates) async {
    final response = await _apiClient.put(
      ApiEndpoints.updateProfile,
      body: updates,
    );
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return Employee.fromJson(payload['employee'] ?? payload);
  }

  Future<String> uploadProfilePicture(String localImagePath) async {
    // Note: Multipart files upload placeholder pattern
    final response = await _apiClient.post(
      ApiEndpoints.uploadAvatar,
      body: {'filePath': localImagePath},
    );
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return payload['profilePictureUrl']?.toString() ?? payload['profilePhotoUrl']?.toString() ?? '';
  }

  Future<Map<String, dynamic>> getEmployeePerformance() async {
    final response = await _apiClient.get(ApiEndpoints.performance);
    final data = jsonDecode(response.body);
    return Map<String, dynamic>.from(data['data'] ?? data);
  }
}
