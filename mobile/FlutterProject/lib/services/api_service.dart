import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/// Erro retornado pela API do Smart HAS, já com a mensagem tratada
/// pelo @RestControllerAdvice do backend Spring Boot.
class ApiException implements Exception {
  final int statusCode;
  final String message;

  ApiException(this.statusCode, this.message);

  @override
  String toString() => message;
}

/// Cliente HTTP central para o backend Spring Boot (Parte 2 da atividade).
///
/// Resolve o host automaticamente: o emulador Android enxerga o
/// localhost da máquina host através do alias 10.0.2.2, então não dá
/// para usar "localhost" direto quando rodando em um emulador Android.
class ApiService {
  ApiService._internal();
  static final ApiService instance = ApiService._internal();

  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.0.2.2:8080/api';
    }
    return 'http://localhost:8080/api';
  }

  static const _tokenKey = 'smart_has_jwt_token';

  String? _cachedToken;

  Future<String?> get token async {
    if (_cachedToken != null) return _cachedToken;
    final prefs = await SharedPreferences.getInstance();
    _cachedToken = prefs.getString(_tokenKey);
    return _cachedToken;
  }

  Future<void> saveToken(String token) async {
    _cachedToken = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  Future<void> clearToken() async {
    _cachedToken = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
  }

  Future<Map<String, String>> _headers({bool auth = false}) async {
    final headers = {'Content-Type': 'application/json'};
    if (auth) {
      final t = await token;
      if (t != null) headers['Authorization'] = 'Bearer $t';
    }
    return headers;
  }

  dynamic _decode(http.Response response) {
    final isJson = response.headers['content-type']?.contains('application/json') ?? false;
    final body = isJson && response.body.isNotEmpty ? jsonDecode(response.body) : null;

    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }

    final message = (body is Map && body['message'] != null)
        ? body['message'].toString()
        : 'Erro de comunicação com o servidor (HTTP ${response.statusCode}).';
    throw ApiException(response.statusCode, message);
  }

  Future<dynamic> get(String path, {bool auth = false}) async {
    final response = await http
        .get(Uri.parse('$baseUrl$path'), headers: await _headers(auth: auth))
        .timeout(const Duration(seconds: 15));
    return _decode(response);
  }

  Future<dynamic> post(String path, Map<String, dynamic> body, {bool auth = false}) async {
    final response = await http
        .post(Uri.parse('$baseUrl$path'), headers: await _headers(auth: auth), body: jsonEncode(body))
        .timeout(const Duration(seconds: 15));
    return _decode(response);
  }

  Future<dynamic> put(String path, Map<String, dynamic> body, {bool auth = false}) async {
    final response = await http
        .put(Uri.parse('$baseUrl$path'), headers: await _headers(auth: auth), body: jsonEncode(body))
        .timeout(const Duration(seconds: 15));
    return _decode(response);
  }

  Future<dynamic> delete(String path, {bool auth = false}) async {
    final response = await http
        .delete(Uri.parse('$baseUrl$path'), headers: await _headers(auth: auth))
        .timeout(const Duration(seconds: 15));
    return _decode(response);
  }
}
