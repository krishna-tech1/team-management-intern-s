import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../core/app_config.dart';
import 'api_client.dart';
import 'api_endpoints.dart';
import '../models/task_model.dart';

class TaskService {
  final ApiClient _apiClient = ApiClient();

  Future<List<TaskModel>> getTasks() async {
    final response = await _apiClient.get(ApiEndpoints.tasks);
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    final List list = payload is List ? payload : (payload['tasks'] ?? []);
    return list.map((item) => TaskModel.fromJson(Map<String, dynamic>.from(item))).toList();
  }

  Future<TaskModel> updateTaskProgress(
    String taskId,
    double progress,
    String? notes,
    String status,
  ) async {
    String dbStatus = 'PENDING';
    if (status == 'In Progress' || status == 'In-Progress') {
      dbStatus = 'IN_PROGRESS';
    } else if (status == 'Completed') {
      dbStatus = 'COMPLETED';
    } else if (status == 'On Hold') {
      dbStatus = 'ON_HOLD';
    }

    final cleanId = taskId.replaceAll('#T-', '');

    final response = await _apiClient.put(
      ApiEndpoints.updateTaskProgress(cleanId),
      body: {
        'status': dbStatus,
      },
    );
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return TaskModel.fromJson(payload['task'] ?? payload);
  }

  Future<TaskModel> uploadTaskDocument({
    required String taskId,
    required String title,
    required double progress,
    String? remarks,
    List<File> photos = const [],
    List<File> documents = const [],
  }) async {
    final cleanId = taskId.replaceAll('#T-', '');
    final token = await _apiClient.getToken();
    final uri = Uri.parse('${AppConfig.apiBaseUrl}${ApiEndpoints.uploadTaskDocument(cleanId)}');

    final request = http.MultipartRequest('POST', uri);
    if (token != null && token.isNotEmpty) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    request.headers['Accept'] = 'application/json';

    request.fields['title'] = title;
    request.fields['progress'] = (progress * 100).round().toString();
    if (remarks != null && remarks.isNotEmpty) {
      request.fields['remarks'] = remarks;
      request.fields['description'] = remarks;
    }

    for (final file in photos) {
      final multipartFile = await http.MultipartFile.fromPath(
        'photos',
        file.path,
      );
      request.files.add(multipartFile);
    }

    for (final file in documents) {
      final multipartFile = await http.MultipartFile.fromPath(
        'documents',
        file.path,
      );
      request.files.add(multipartFile);
    }

    final response = await request.send();
    final responseBody = await response.stream.bytesToString();
    final decoded = jsonDecode(responseBody);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      final payload = decoded['data'] ?? decoded;
      return TaskModel.fromJson(payload['task'] ?? payload);
    } else {
      throw HttpException(decoded['message'] ?? 'Upload failed with status ${response.statusCode}');
    }
  }

  Future<TaskModel> markTaskAsCompleted(String taskId) async {
    final cleanId = taskId.replaceAll('#T-', '');
    final response = await _apiClient.put(
      ApiEndpoints.completeTask(cleanId),
      body: {
        'status': 'COMPLETED',
      },
    );
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return TaskModel.fromJson(payload['task'] ?? payload);
  }
}
