import 'auth_user.dart';

class AuthResponse {
  final String token;
  final AuthUser user;

  AuthResponse({required this.token, required this.user});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    final payload = json['data'] is Map ? json['data'] : json;
    return AuthResponse(
      token: payload['token']?.toString() ?? '',
      user: AuthUser.fromJson(Map<String, dynamic>.from(payload['user'] ?? {})),
    );
  }
}
