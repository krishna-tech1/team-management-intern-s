import 'package:flutter/material.dart';
import '../models/employee.dart';
import '../services/employee_service.dart';

/// The EmployeeProvider manages the employee profile state including
/// loading, error handling, and profile updates.
class EmployeeProvider extends ChangeNotifier {
  final EmployeeService _employeeService = EmployeeService();
  Employee? _employee;
  String? _error;
  bool _isLoading = false;
  bool _isUpdating = false;

  EmployeeProvider();

  // Getters
  Employee? get employee => _employee;
  String? get error => _error;
  bool get isLoading => _isLoading;
  bool get isUpdating => _isUpdating;

  /// Loads the employee profile from the employee service.
  Future<void> loadEmployeeProfile(String uid) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _employee = await _employeeService.getEmployeeProfile();
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _employee = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Updates the employee profile with the provided data.
  Future<bool> updateProfile(String uid, Map<String, dynamic> updates) async {
    _isUpdating = true;
    _error = null;
    notifyListeners();

    try {
      _employee = await _employeeService.updateProfile(updates);
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

  /// Uploads a profile picture and updates the profile.
  Future<bool> uploadProfilePicture(String uid, String localImagePath) async {
    _isUpdating = true;
    _error = null;
    notifyListeners();

    try {
      final newUrl = await _employeeService.uploadProfilePicture(localImagePath);
      if (newUrl.isNotEmpty && _employee != null) {
        _employee = _employee!.copyWith(profilePictureUrl: newUrl);
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
