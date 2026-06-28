import 'dart:convert';
import 'api_client.dart';
import '../models/incentive_model.dart';

class IncentiveService {
  final ApiClient _apiClient = ApiClient();

  Future<IncentiveModel> getIncentives() async {
    final response = await _apiClient.get('/employee/incentives');
    final data = jsonDecode(response.body);
    return IncentiveModel.fromJson(data['data'] ?? data);
  }
}
