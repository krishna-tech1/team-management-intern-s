/// The Employee model represents the profile and details of an employee
/// within the GST MCA Operations System.
class Employee {
  final String id; // Unique employee ID (e.g. FC-GST-9842)
  final String name; // Full name of the employee
  final String email; // Professional email address
  final String role; // Role of the employee (e.g. Verified Field Expert)
  final String department; // Department (e.g. GST MCA Operations)
  final String zone; // Zone of operations (e.g. South Zone - Bangalore)
  final String phone; // Contact phone number
  final String? profilePictureUrl; // Optional profile picture URL hosted by backend storage
  final bool isOnboarded; // Flag indicating if the admin-created employee completed onboarding
  final DateTime createdAt; // Date and time when the employee record was created
  final int performanceScore; // Performance score based on on-time task completion

  Employee({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.department,
    required this.zone,
    required this.phone,
    this.profilePictureUrl,
    required this.isOnboarded,
    required this.createdAt,
    this.performanceScore = 0,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    String name = json['name']?.toString() ?? '';
    if (name.isEmpty && json.containsKey('firstName')) {
      name = '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim();
    }
    String role = json['role']?.toString() ?? json['designation']?.toString() ?? '';
    String profilePictureUrl = json['profilePictureUrl']?.toString() ?? json['profilePhotoUrl']?.toString() ?? '';

    return Employee(
      id: json['id']?.toString() ?? json['uid']?.toString() ?? json['employeeCode']?.toString() ?? '',
      name: name,
      email: json['email']?.toString() ?? json['userEmail']?.toString() ?? '',
      role: role,
      department: json['department']?.toString() ?? '',
      zone: json['zone']?.toString() ?? 'Default Zone',
      phone: json['phone']?.toString() ?? '',
      profilePictureUrl: profilePictureUrl.isNotEmpty ? profilePictureUrl : null,
      isOnboarded: json['isOnboarded'] ?? true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      performanceScore: json['performanceScore'] is num ? (json['performanceScore'] as num).toInt() : 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      'role': role,
      'department': department,
      'zone': zone,
      'phone': phone,
      'profilePictureUrl': profilePictureUrl,
      'isOnboarded': isOnboarded,
      'createdAt': createdAt.toIso8601String(),
      'performanceScore': performanceScore,
    };
  }

  Employee copyWith({
    String? name,
    String? email,
    String? role,
    String? department,
    String? zone,
    String? phone,
    String? profilePictureUrl,
    bool? isOnboarded,
    DateTime? createdAt,
    int? performanceScore,
  }) {
    return Employee(
      id: id,
      name: name ?? this.name,
      email: email ?? this.email,
      role: role ?? this.role,
      department: department ?? this.department,
      zone: zone ?? this.zone,
      phone: phone ?? this.phone,
      profilePictureUrl: profilePictureUrl ?? this.profilePictureUrl,
      isOnboarded: isOnboarded ?? this.isOnboarded,
      createdAt: createdAt ?? this.createdAt,
      performanceScore: performanceScore ?? this.performanceScore,
    );
  }
}
