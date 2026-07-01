import 'package:flutter/material.dart';
import 'dart:io';
import '../models/task_model.dart';
import '../services/task_service.dart';

/// The TaskProvider manages the task state including
/// loading task lists, tracking progress updates, and managing task completion.
class TaskProvider extends ChangeNotifier {
  final TaskService _taskService = TaskService();
  List<TaskModel> _tasks = [];
  TaskModel? _selectedTask;
  String? _error;
  bool _isLoading = false;
  bool _isUpdating = false;

  TaskProvider();

  // Getters
  List<TaskModel> get tasks => _tasks;
  TaskModel? get selectedTask => _selectedTask;
  String? get error => _error;
  bool get isLoading => _isLoading;
  bool get isUpdating => _isUpdating;

  /// Initializes the provider by fetching task data from TaskService.
  Future<void> initializeTasks(String employeeId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _tasks = await _taskService.getTasks();
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _tasks = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Selects a task for detailed view.
  void selectTask(TaskModel task) {
    _selectedTask = task;
    notifyListeners();
  }

  /// Clears the selected task.
  void clearSelectedTask() {
    _selectedTask = null;
    notifyListeners();
  }

  /// Updates the progress and notes of the selected task.
  Future<bool> updateTaskProgress(
    String taskId,
    double progress,
    String? notes,
    String status,
  ) async {
    _isUpdating = true;
    _error = null;
    notifyListeners();

    try {
      final updatedTask = await _taskService.updateTaskProgress(taskId, progress, notes, status);
      final index = _tasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        _tasks[index] = updatedTask;
      }
      if (_selectedTask?.id == taskId) {
        _selectedTask = updatedTask;
      }
      _isUpdating = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _isUpdating = false;
      notifyListeners();
      return false;
    }
  }

  /// Uploads a task document and updates the task progress.
  Future<bool> uploadTaskDocument({
    required String taskId,
    required String title,
    required double progress,
    String? remarks,
    List<File> photos = const [],
    List<File> documents = const [],
  }) async {
    _isUpdating = true;
    _error = null;
    notifyListeners();

    try {
      final updatedTask = await _taskService.uploadTaskDocument(
        taskId: taskId,
        title: title,
        progress: progress,
        remarks: remarks,
        photos: photos,
        documents: documents,
      );
      final index = _tasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        _tasks[index] = updatedTask;
      }
      if (_selectedTask?.id == taskId) {
        _selectedTask = updatedTask;
      }
      _isUpdating = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _isUpdating = false;
      notifyListeners();
      return false;
    }
  }

  /// Marks a task as completed.
  Future<bool> markTaskAsCompleted(String taskId) async {
    _isUpdating = true;
    _error = null;
    notifyListeners();

    try {
      final updatedTask = await _taskService.markTaskAsCompleted(taskId);
      final index = _tasks.indexWhere((t) => t.id == taskId);
      if (index != -1) {
        _tasks[index] = updatedTask;
      }
      if (_selectedTask?.id == taskId) {
        _selectedTask = updatedTask;
      }
      _isUpdating = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _isUpdating = false;
      notifyListeners();
      return false;
    }
  }

  /// Clears the error message.
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
