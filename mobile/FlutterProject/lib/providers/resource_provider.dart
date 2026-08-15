import 'package:flutter/material.dart';
import '../models/resource.dart';
import '../services/api_service.dart';

class ResourceProvider with ChangeNotifier {
  final ApiService _api = ApiService.instance;

  List<Resource> _resources = [];
  bool _isLoading = false;
  String? _error;

  List<Resource> get resources => [..._resources];
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Carrega a lista de GET /api/resources (recursos de todos os
  /// usuários, persistidos no backend Spring Boot).
  Future<void> fetchResources() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _api.get('/resources');
      final content = response['content'] as List<dynamic>? ?? response as List<dynamic>;
      _resources = content.map((json) => Resource.fromJson(json)).toList();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Publica um novo recurso via POST /api/resources (exige login,
  /// o backend associa o dono a partir do token JWT).
  Future<void> addResource(Resource resource) async {
    final response = await _api.post('/resources', resource.toCreateJson(), auth: true);
    _resources.insert(0, Resource.fromJson(response));
    notifyListeners();
  }

  List<Resource> getResourcesByCategory(String category) {
    return _resources.where((r) => r.category == category).toList();
  }
}
