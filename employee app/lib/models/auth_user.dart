class AuthUser {
  final String uid;
  final String email;
  final String? name;

  AuthUser({
    required this.uid,
    required this.email,
    this.name,
  });

  factory AuthUser.fromJson(Map<String, dynamic> json) {
    return AuthUser(
      uid: json['uid']?.toString() ?? json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      name: json['name']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'name': name,
    };
  }
}
