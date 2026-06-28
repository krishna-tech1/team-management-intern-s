import 'package:flutter/material.dart';
import '../models/attendance_model.dart';
import '../services/attendance_service.dart';

/// The AttendanceProvider manages the attendance state including
/// check-in/out operations and attendance history.
class AttendanceProvider extends ChangeNotifier {
  final AttendanceService _attendanceService = AttendanceService();
  List<AttendanceModel> _attendanceHistory = [];
  AttendanceModel? _todayAttendance;
  String? _error;
  bool _isLoading = false;
  bool _isClockedIn = false;

  AttendanceProvider();

  // Getters
  List<AttendanceModel> get attendanceHistory => _attendanceHistory;
  AttendanceModel? get todayAttendance => _todayAttendance;
  String? get error => _error;
  bool get isLoading => _isLoading;
  bool get isClockedIn => _isClockedIn;

  /// Initializes the provider with logs from the service.
  Future<void> initializeAttendance(String employeeId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _attendanceHistory = await _attendanceService.getAttendanceHistory();
      
      final todayStr = DateTime.now().toIso8601String().split('T').first;
      _todayAttendance = _attendanceHistory.firstWhere(
        (record) => record.date == todayStr && record.checkOutTime == null,
        orElse: () => _attendanceHistory.isNotEmpty ? _attendanceHistory.first : AttendanceModel(
          id: '',
          employeeId: employeeId,
          date: todayStr,
          status: 'ABSENT',
          duration: '',
        ),
      );
      _isClockedIn = _todayAttendance != null && _todayAttendance!.id.isNotEmpty && _todayAttendance!.checkOutTime == null;
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _attendanceHistory = [];
      _todayAttendance = null;
      _isClockedIn = false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clocks in the employee with the provided record.
  Future<bool> clockIn(AttendanceModel record) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final savedRecord = await _attendanceService.clockIn(record);
      _attendanceHistory.insert(0, savedRecord);
      _todayAttendance = savedRecord;
      _isClockedIn = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Clocks out the employee by updating their attendance record.
  Future<bool> clockOut(String attendanceId, Map<String, dynamic> updateData) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final updatedRecord = await _attendanceService.clockOut(attendanceId, updateData);
      final index = _attendanceHistory.indexWhere((record) => record.id == attendanceId);
      if (index != -1) {
        _attendanceHistory[index] = updatedRecord;
      }
      if (_todayAttendance?.id == attendanceId) {
        _todayAttendance = updatedRecord;
      }
      _isClockedIn = false;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Fetches today's attendance record.
  Future<void> loadTodayAttendance(String employeeId, String dateString) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Reload logs to get the latest status
      _attendanceHistory = await _attendanceService.getAttendanceHistory();
      _todayAttendance = _attendanceHistory.firstWhere(
        (record) => record.date == dateString,
        orElse: () => _attendanceHistory.isNotEmpty ? _attendanceHistory.first : AttendanceModel(
          id: '',
          employeeId: employeeId,
          date: dateString,
          status: 'ABSENT',
          duration: '',
        ),
      );
      _isClockedIn = _todayAttendance != null && _todayAttendance!.id.isNotEmpty && _todayAttendance!.checkOutTime == null;
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Clears the error message.
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
