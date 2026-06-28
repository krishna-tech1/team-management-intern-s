import 'package:flutter/material.dart';
import '../models/incentive_model.dart';
import '../services/incentive_service.dart';

class IncentiveProvider extends ChangeNotifier {
  final IncentiveService _incentiveService = IncentiveService();
  IncentiveModel? _incentive;
  String? _error;
  bool _isLoading = false;

  IncentiveProvider();

  IncentiveModel? get incentive => _incentive;
  String? get error => _error;
  bool get isLoading => _isLoading;

  Future<void> loadIncentives() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _incentive = await _incentiveService.getIncentives();
    } catch (e) {
      _error = e.toString().replaceAll('HttpException: ', '');
      _incentive = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
