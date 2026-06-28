/// The AttendanceModel maps checking-in, checking-out, durations, status calculations,
/// and geolocation coordinates for the employee's logs.
class AttendanceModel {
  final String id; // Unique record ID (e.g. att_uid_yyyy_MM_dd)
  final String employeeId; // Foreign key referencing the employee
  final String date; // String date representation in format YYYY-MM-DD
  final DateTime? checkInTime; // Clock-in timestamp
  final DateTime? checkOutTime; // Clock-out timestamp
  final String status; // Calculated status: e.g., 'VERIFIED', 'LATE', 'ABSENT'
  final String duration; // Clock-in duration string: e.g., '8h 43m'
  final double? checkInLatitude; // Lat coordinate for check-in
  final double? checkInLongitude; // Long coordinate for check-in
  final double? checkOutLatitude; // Lat coordinate for check-out
  final double? checkOutLongitude; // Long coordinate for check-out
  final String? checkInAddress; // Address at check-in location
  final String? checkOutAddress; // Address at check-out location

  AttendanceModel({
    required this.id,
    required this.employeeId,
    required this.date,
    this.checkInTime,
    this.checkOutTime,
    required this.status,
    required this.duration,
    this.checkInLatitude,
    this.checkInLongitude,
    this.checkOutLatitude,
    this.checkOutLongitude,
    this.checkInAddress,
    this.checkOutAddress,
  });

  factory AttendanceModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(String? value) {
      if (value == null) return null;
      return DateTime.tryParse(value);
    }

    return AttendanceModel(
      id: json['id']?.toString() ?? '',
      employeeId: json['employeeId']?.toString() ?? '',
      date: json['date']?.toString() ?? '',
      checkInTime: parseDate(json['checkInTime']?.toString()),
      checkOutTime: parseDate(json['checkOutTime']?.toString()),
      status: json['status']?.toString() ?? 'ABSENT',
      duration: json['duration']?.toString() ?? '',
      checkInLatitude: (json['checkInLatitude'] as num?)?.toDouble(),
      checkInLongitude: (json['checkInLongitude'] as num?)?.toDouble(),
      checkOutLatitude: (json['checkOutLatitude'] as num?)?.toDouble(),
      checkOutLongitude: (json['checkOutLongitude'] as num?)?.toDouble(),
      checkInAddress: json['checkInAddress']?.toString(),
      checkOutAddress: json['checkOutAddress']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeId': employeeId,
      'date': date,
      'checkInTime': checkInTime?.toIso8601String(),
      'checkOutTime': checkOutTime?.toIso8601String(),
      'status': status,
      'duration': duration,
      'checkInLatitude': checkInLatitude,
      'checkInLongitude': checkInLongitude,
      'checkOutLatitude': checkOutLatitude,
      'checkOutLongitude': checkOutLongitude,
      'checkInAddress': checkInAddress,
      'checkOutAddress': checkOutAddress,
    };
  }

  AttendanceModel copyWith({
    String? employeeId,
    String? date,
    DateTime? checkInTime,
    DateTime? checkOutTime,
    String? status,
    String? duration,
    double? checkInLatitude,
    double? checkInLongitude,
    double? checkOutLatitude,
    double? checkOutLongitude,
    String? checkInAddress,
    String? checkOutAddress,
  }) {
    return AttendanceModel(
      id: id,
      employeeId: employeeId ?? this.employeeId,
      date: date ?? this.date,
      checkInTime: checkInTime ?? this.checkInTime,
      checkOutTime: checkOutTime ?? this.checkOutTime,
      status: status ?? this.status,
      duration: duration ?? this.duration,
      checkInLatitude: checkInLatitude ?? this.checkInLatitude,
      checkInLongitude: checkInLongitude ?? this.checkInLongitude,
      checkOutLatitude: checkOutLatitude ?? this.checkOutLatitude,
      checkOutLongitude: checkOutLongitude ?? this.checkOutLongitude,
      checkInAddress: checkInAddress ?? this.checkInAddress,
      checkOutAddress: checkOutAddress ?? this.checkOutAddress,
    );
  }
}
