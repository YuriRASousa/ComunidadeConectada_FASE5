import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _api = ApiService.instance;

  User? _currentUser;
  bool _isGhost = false;
  bool _isLoading = false;
  String? _error;

  User? get currentUser => _currentUser;
  bool get isGhost => _isGhost;
  bool get isAuthenticated => _currentUser != null || _isGhost;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Autentica contra POST /api/auth/login. Lança [ApiException] em
  /// caso de erro (tratado nas telas com try/catch).
  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _api.post('/auth/login', {
        'email': email,
        'password': password,
      });
      await _applyAuthResponse(response);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Cria a conta em POST /api/auth/register e já autentica o usuário
  /// com o token retornado (evita um segundo passo de login).
  Future<void> register(String name, String email, String address, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _api.post('/auth/register', {
        'name': name,
        'email': email,
        'address': address,
        'password': password,
      });
      await _applyAuthResponse(response);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _applyAuthResponse(Map<String, dynamic> response) async {
    await _api.saveToken(response['token']);
    _currentUser = User.fromMap(response['user']);
    _isGhost = false;
  }

  /// Modo "Visitante": navega pelo app sem conta e sem chamadas à API
  /// (ofertar recursos e enviar mensagens ficam bloqueados nas telas).
  void loginAsGhost() {
    _currentUser = User(
      id: 'ghost_${DateTime.now().millisecondsSinceEpoch}',
      name: 'Visitante (Ghost)',
      email: 'ghost@conectada.com',
      address: 'Não informado',
      reputation: 0.0,
      totalTransactions: 0,
      isVerified: false,
    );
    _isGhost = true;
    notifyListeners();
  }

  Future<void> logout() async {
    await _api.clearToken();
    _currentUser = null;
    _isGhost = false;
    notifyListeners();
  }

  /// Atualiza o perfil via PUT /api/users/me. Não tem efeito no modo
  /// visitante, já que a conta não existe no backend.
  Future<void> updateUser({String? name, String? address, String? profileImageUrl}) async {
    if (_currentUser == null || _isGhost) return;
    final response = await _api.put(
      '/users/me',
      {
        if (name != null) 'name': name,
        if (address != null) 'address': address,
        if (profileImageUrl != null) 'profileImageUrl': profileImageUrl,
      },
      auth: true,
    );
    _currentUser = User.fromMap(response);
    notifyListeners();
  }
}
