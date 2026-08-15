import 'dart:convert';
import 'dart:async';
import 'package:http/http.dart' as http;

class GeminiService {
  // Configurações do OpenRouter — defina sua própria chave via
  // --dart-define=OPENROUTER_API_KEY=... ao rodar/buildar o app.
  final String _apiKey = String.fromEnvironment('OPENROUTER_API_KEY');
  final String _baseUrl = "https://openrouter.ai/api/v1/chat/completions";
  final String _model = "baidu/cobuddy:free";

  /// Método principal de geração de texto
  /// [isTechnical] define se a resposta deve ser apenas o resultado sem conversa.
  Future<String> generateResponse(String prompt, {bool isTechnical = false}) async {
    try {
      final response = await http.post(
        Uri.parse(_baseUrl),
        headers: {
          'Authorization': 'Bearer $_apiKey',
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://comunidadeconectada.com', // Requisito do OpenRouter
          'X-Title': 'Comunidade Conectada',
        },
        body: jsonEncode({
          "model": _model,
          "messages": [
            if (isTechnical)
              {
                "role": "system",
                "content": "Você é um assistente técnico. Sua tarefa é realizar a tarefa solicitada e retornar APENAS o resultado final. Proibido usar saudações, introduções ou qualquer texto explicativo."
              },
            {
              "role": "user",
              "content": prompt
            }
          ],
          "route": "fallback"
        }),
      ).timeout(const Duration(seconds: 45));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['choices'] != null && data['choices'].isNotEmpty) {
          final content = data['choices'][0]['message']['content'];
          return content.toString().trim();
        }
        return "IA sem resposta no momento.";
      } else if (response.statusCode == 429) {
        return "Muitas requisições! O modelo gratuito está congestionado. Tente novamente em alguns segundos.";
      } else if (response.statusCode >= 500) {
        return "O serviço de IA está instável ou em manutenção (Erro ${response.statusCode}). Tente novamente.";
      } else {
        print("Erro OpenRouter (${response.statusCode}): ${response.body}");
        return "Desculpe, a IA encontrou um problema técnico (${response.statusCode}).";
      }
    } on TimeoutException {
      return "A resposta demorou muito para chegar. O modelo gratuito pode estar lento agora.";
    } catch (e) {
      print("Erro de Conexão OpenRouter: $e");
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
