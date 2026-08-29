import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;

class GeminiService {
  // Chave gratuita gerada em https://aistudio.google.com/apikey — defina
  // via --dart-define=GEMINI_API_KEY=... ao rodar/buildar o app.
  final String _apiKey = String.fromEnvironment('GEMINI_API_KEY');
  final String _model = "gemini-3.6-flash";
  String get _baseUrl =>
      "https://generativelanguage.googleapis.com/v1beta/models/$_model:generateContent";

  static const _technicalInstruction =
      "Você é um assistente técnico. Sua tarefa é realizar a tarefa solicitada e retornar APENAS o resultado final. Proibido usar saudações, introduções ou qualquer texto explicativo.";

  /// Método principal de geração de texto
  /// [isTechnical] define se a resposta deve ser apenas o resultado sem conversa.
  Future<String> generateResponse(String prompt, {bool isTechnical = false}) async {
    if (_apiKey.isEmpty) {
      return "IA não configurada: defina GEMINI_API_KEY (veja README).";
    }
    try {
      final response = await http.post(
        Uri.parse("$_baseUrl?key=$_apiKey"),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          "contents": [
            {
              "role": "user",
              "parts": [
                {"text": prompt}
              ]
            }
          ],
          if (isTechnical)
            "systemInstruction": {
              "role": "system",
              "parts": [
                {"text": _technicalInstruction}
              ]
            },
        }),
      ).timeout(const Duration(seconds: 45));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final text = data['candidates']?[0]?['content']?['parts']?[0]?['text'];
        return text != null ? text.toString().trim() : "IA sem resposta no momento.";
      } else if (response.statusCode == 429) {
        return "Muitas requisições! O modelo gratuito está congestionado. Tente novamente em alguns segundos.";
      } else if (response.statusCode >= 500) {
        return "O serviço de IA está instável ou em manutenção (Erro ${response.statusCode}). Tente novamente.";
      } else {
        print("Erro Gemini (${response.statusCode}): ${response.body}");
        return "Desculpe, a IA encontrou um problema técnico (${response.statusCode}).";
      }
    } on TimeoutException {
      return "A resposta demorou muito para chegar. Tente novamente.";
    } catch (e) {
      print("Erro de Conexão Gemini: $e");
      return "Sem conexão com o serviço de IA. Verifique sua internet.";
    }
  }

  // Mantendo os métodos de utilidade para o resto do app continuar funcionando
  Future<String> improveDescription(String description) async {
    final prompt = "Melhore a seguinte descrição de doação para torná-la clara e atrativa: $description";
    // Usamos o modo técnico para evitar conversas
    return await generateResponse(prompt, isTechnical: true);
  }

  Future<List<String>> suggestCategories(String description) async {
    final prompt = "Sugira 3 categorias curtas para o item: $description. Retorne apenas os nomes separados por vírgula.";
    // Usamos o modo técnico para obter apenas a lista
    final res = await generateResponse(prompt, isTechnical: true);
    if (res.contains("Erro") || res.length > 100 || !res.contains(",")) return ["Outros"];
    return res.split(',').map((e) => e.trim()).toList();
  }
}
