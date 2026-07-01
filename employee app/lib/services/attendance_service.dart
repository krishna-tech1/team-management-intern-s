import 'dart:convert';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../models/attendance_model.dart';

class AttendanceService {
  final ApiClient _apiClient = ApiClient();

  Future<List<AttendanceModel>> getAttendanceHistory() async {
    final response = await _apiClient.get(ApiEndpoints.attendanceLogs);
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    final List list = payload is List ? payload : (payload['logs'] ?? payload['attendance'] ?? []);
    return list.map((item) => AttendanceModel.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  Future<AttendanceModel> clockIn(AttendanceModel record) async {
    final response = await _apiClient.post(
      ApiEndpoints.clockIn,
      body: {
        'latitude': record.checkInLatitude ?? 12.9716,
        'longitude': record.checkInLongitude ?? 77.5946,
        'accuracy': record.locationAccuracy ?? 0.0,
      },
    );
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return AttendanceModel.fromJson(payload);
  }

  Future<AttendanceModel> clockOut(String attendanceId, Map<String, dynamic> updateData) async {
    final response = await _apiClient.post(
      ApiEndpoints.clockOut,
      body: {
        'latitude': updateData['checkOutLatitude'] ?? 12.9768,
        'longitude': updateData['checkOutLongitude'] ?? 77.6012,
      },
    );
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return AttendanceModel.fromJson(payload);
  }
}
