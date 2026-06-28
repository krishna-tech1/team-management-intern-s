/// The TaskModel represents a field task or audit assigned to an employee,
/// tracking its progress, client details, priority levels, and submission records.
class TaskModel {
  final String id; // Task identifier (e.g. #T-1024)
  final String employeeId; // Associated Employee ID
  final String client; // Client or target company (e.g., Reliance Industries Ltd.)
  final String location; // Geographical location summary (e.g., Mumbai, MH)
  final DateTime dueDate; // Task deadline
  final String priority; // Priority status: 'HIGH', 'MEDIUM', 'LOW'
  final String status; // Progress status: 'Not Started', 'In-Progress', 'Pending Review', 'Completed'
  final bool hasBonus; // Extra incentives flag
  final String title; // Title description
  final String description; // Comprehensive task detail instructions
  final double progress; // Completion ratio (0.0 to 1.0)
  final String? notes; // Additional notes typed during submission
  final DateTime? completedAt; // Task completion timestamp

  TaskModel({
    required this.id,
    required this.employeeId,
    required this.client,
    required this.location,
    required this.dueDate,
    required this.priority,
    required this.status,
    required this.hasBonus,
    required this.title,
    required this.description,
    required this.progress,
    this.notes,
    this.completedAt,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    String clientName = '';
    if (json['client'] is Map) {
      clientName = json['client']['companyName']?.toString() ?? '';
    } else {
      clientName = json['client']?.toString() ?? '';
    }

    String dbStatus = json['status']?.toString() ?? 'PENDING';
    String status = 'Not Started';
    if (dbStatus == 'IN_PROGRESS') {
      status = 'In Progress';
    } else if (dbStatus == 'COMPLETED') {
      status = 'Completed';
    } else if (dbStatus == 'ON_HOLD') {
      status = 'On Hold';
    } else if (dbStatus == 'PENDING') {
      status = 'Not Started';
    }

    String dbPriority = json['priority']?.toString() ?? 'MEDIUM';
    String priority = 'MEDIUM';
    if (dbPriority == 'URGENT' || dbPriority == 'HIGH') {
      priority = 'HIGH';
    } else if (dbPriority == 'LOW') {
      priority = 'LOW';
    }

    String location = json['location']?.toString() ?? '';
    if (location.isEmpty && json['client'] is Map) {
      location = json['client']['address']?.toString() ?? 'Mumbai, MH';
    }
    if (location.isEmpty) {
      location = 'Mumbai, MH';
    }

    return TaskModel(
      id: '#T-${json['id']?.toString() ?? ''}',
      employeeId: json['employeeId']?.toString() ?? json['assignedEmployeeId']?.toString() ?? '',
      client: clientName,
      location: location,
      dueDate: DateTime.tryParse(json['dueDate']?.toString() ?? '') ?? DateTime.now(),
      priority: priority,
      status: status,
      hasBonus: json['hasBonus'] ?? false,
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      progress: (json['progress'] as num?)?.toDouble() ?? 0.0,
      notes: json['notes']?.toString(),
      completedAt: DateTime.tryParse(json['completedAt']?.toString() ?? ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employeeId': employeeId,
      'client': client,
      'location': location,
      'dueDate': dueDate.toIso8601String(),
      'priority': priority,
      'status': status,
      'hasBonus': hasBonus,
      'title': title,
      'description': description,
      'progress': progress,
      'notes': notes,
      'completedAt': completedAt?.toIso8601String(),
    };
  }

  TaskModel copyWith({
    String? employeeId,
    String? client,
    String? location,
    DateTime? dueDate,
    String? priority,
    String? status,
    bool? hasBonus,
    String? title,
    String? description,
    double? progress,
    String? notes,
    DateTime? completedAt,
  }) {
    return TaskModel(
      id: id,
      employeeId: employeeId ?? this.employeeId,
      client: client ?? this.client,
      location: location ?? this.location,
      dueDate: dueDate ?? this.dueDate,
      priority: priority ?? this.priority,
      status: status ?? this.status,
      hasBonus: hasBonus ?? this.hasBonus,
      title: title ?? this.title,
      description: description ?? this.description,
      progress: progress ?? this.progress,
      notes: notes ?? this.notes,
      completedAt: completedAt ?? this.completedAt,
    );
  }
}
