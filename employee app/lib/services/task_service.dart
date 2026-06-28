import 'dart:convert';
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

  Future<TaskModel> uploadTaskDocument(
    String taskId,
    String localFilePath,
    double progress,
    String? notes,
  ) async {
    final cleanId = taskId.replaceAll('#T-', '');
    final response = await _apiClient.post(
      ApiEndpoints.uploadTaskDocument(cleanId),
      body: {
        'title': 'Filing Document Update',
        'remarks': notes ?? '',
        'progress': progress,
      },
    );
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    return TaskModel.fromJson(payload['task'] ?? payload);
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
