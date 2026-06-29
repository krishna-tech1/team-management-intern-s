import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../core/app_config.dart';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  static const String _tokenKey = 'auth_token';
  
  // Callback when a 401 Unauthorized is detected
  void Function()? onUnauthorized;

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<Map<String, String>> _getHeaders() async {
    final token = await getToken();
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  http.Response _handleResponse(http.Response response) {
    final path = response.request?.url.path ?? '';
    
    String extractErrorMessage(Map body) {
      if (body.containsKey('message')) {
        return body['message'].toString();
      }
      if (body.containsKey('error') && body['error'] is Map) {
        final errorMap = body['error'] as Map;
        if (errorMap.containsKey('message')) {
          return errorMap['message'].toString();
        }
      }
      return '';
    }

    if (response.statusCode == 401) {
      if (path.endsWith('/auth/login')) {
        String errorMessage = 'Invalid credentials';
        try {
          final body = jsonDecode(response.body);
          if (body is Map) {
            final parsedMsg = extractErrorMessage(body);
            if (parsedMsg.isNotEmpty) {
              errorMessage = parsedMsg;
            }
          }
        } catch (_) {}
        throw HttpException(errorMessage);
      }
      clearToken();
      if (onUnauthorized != null) {
        onUnauthorized!();
      }
      throw HttpException('Session expired. Please log in again.');
    }
    
    if (response.statusCode >= 400) {
      String errorMessage = 'Server error (${response.statusCode})';
      try {
        final body = jsonDecode(response.body);
        if (body is Map) {
          final parsedMsg = extractErrorMessage(body);
          if (parsedMsg.isNotEmpty) {
            errorMessage = parsedMsg;
          }
        }
      } catch (_) {}
      throw HttpException(errorMessage);
    }
    
    return response;
  }

  Future<http.Response> get(String endpoint) async {
    try {
      final url = Uri.parse('${AppConfig.apiBaseUrl}$endpoint');
      final headers = await _getHeaders();
      final response = await http.get(url, headers: headers);
      return _handleResponse(response);
    } on SocketException {
      throw const SocketException('No internet connection. Please check your network.');
    }
  }

  Future<http.Response> post(String endpoint, {Object? body}) async {
    try {
      final url = Uri.parse('${AppConfig.apiBaseUrl}$endpoint');
      final headers = await _getHeaders();
      final response = await http.post(
        url,
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } on SocketException {
      throw const SocketException('No internet connection. Please check your network.');
    }
  }

  Future<http.Response> put(String endpoint, {Object? body}) async {
    try {
      final url = Uri.parse('${AppConfig.apiBaseUrl}$endpoint');
      final headers = await _getHeaders();
      final response = await http.put(
        url,
        headers: headers,
        body: body != null ? jsonEncode(body) : null,
      );
      return _handleResponse(response);
    } on SocketException {
      throw const SocketException('No internet connection. Please check your network.');
    }
  }

  Future<http.Response> delete(String endpoint) async {
    try {
      final url = Uri.parse('${AppConfig.apiBaseUrl}$endpoint');
      final headers = await _getHeaders();
      final response = await http.delete(url, headers: headers);
      return _handleResponse(response);
    } on SocketException {
      throw const SocketException('No internet connection. Please check your network.');
    }
  }
}
