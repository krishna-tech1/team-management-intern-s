import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../core/app_config.dart';
import 'api_client.dart';
import 'api_endpoints.dart';

class DocumentUploadService {
  final ApiClient _apiClient = ApiClient();

  Future<List<Map<String, dynamic>>> getDocumentsHistory() async {
    final response = await _apiClient.get(ApiEndpoints.employeeDocuments);
    final data = jsonDecode(response.body);
    final payload = data['data'] ?? data;
    final List list = payload is List ? payload : (payload['documents'] ?? payload['logs'] ?? []);
    return List<Map<String, dynamic>>.from(list);
  }

  Future<void> uploadProgressDocument({
    required File file,
    required String fileName,
    required int fileSize,
    int? taskId,
    String? remarks,
    required Function(double progress) onProgress,
    required Function(String? fileUrl, String? error) onComplete,
  }) async {
    try {
      final token = await _apiClient.getToken();
      final uri = Uri.parse('${AppConfig.apiBaseUrl}/upload?type=employees/documents');
      
      final request = http.MultipartRequest('POST', uri);
      if (token != null && token.isNotEmpty) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.headers['Accept'] = 'application/json';

      final fileStream = http.ByteStream(file.openRead());
      final totalByteLength = file.lengthSync();

      int byteCount = 0;
      final progressStream = fileStream.transform(
        StreamTransformer.fromHandlers(
          handleData: (data, sink) {
            byteCount += data.length;
            final progress = byteCount / totalByteLength;
            onProgress(progress);
            sink.add(data);
          },
          handleDone: (sink) {
            sink.close();
          },
        ),
      ).cast<List<int>>();

      final multipartFile = http.MultipartFile(
        'file',
        progressStream,
        totalByteLength,
        filename: fileName,
      );
      request.files.add(multipartFile);

      final response = await request.send();
      final responseBody = await response.stream.bytesToString();
      final decoded = jsonDecode(responseBody);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final secureUrl = decoded['data']?['secure_url'] ?? decoded['secure_url'];
        if (secureUrl != null) {
          // Now save the document metadata to the DB
          final metaResponse = await _apiClient.post(
            ApiEndpoints.progressUpload,
            body: {
              'taskId': ?taskId,
              'fileUrl': secureUrl.toString(),
              'fileName': fileName,
              'fileSize': fileSize,
              if (remarks != null && remarks.isNotEmpty) 'remarks': remarks,
              'uploadedAt': DateTime.now().toIso8601String(),
            },
          );
          
          if (metaResponse.statusCode >= 200 && metaResponse.statusCode < 300) {
            onComplete(secureUrl.toString(), null);
          } else {
            final metaDecoded = jsonDecode(metaResponse.body);
            onComplete(null, metaDecoded['message'] ?? 'Failed to save document details');
          }
        } else {
          onComplete(null, 'Upload succeeded but file URL not returned');
        }
      } else {
        onComplete(null, decoded['message'] ?? 'Upload failed with status ${response.statusCode}');
      }
    } catch (e) {
      onComplete(null, e.toString());
    }
  }
}
