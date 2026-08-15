import 'package:flutter/material.dart';
import '../models/message.dart';
import '../services/api_service.dart';
import '../services/gemini_service.dart';

class ChatConversation {
  final String resourceId;
  final String resourceTitle;
  final String offerantId;
  final Message lastMessage;

  ChatConversation({
    required this.resourceId,
    required this.resourceTitle,
    required this.offerantId,
    required this.lastMessage,
  });
}

/// Conversas sobre recursos (negociação com o ofertante) agora são
/// persistidas de verdade via POST/GET /api/messages no backend
/// Spring Boot. A lista de conversas em si continua indexada por
/// recurso localmente na sessão do app — o backend agrupa mensagens
/// por usuário, não por recurso; reconciliar os dois modelos fica
/// como item de roadmap para a próxima fase.
class ChatProvider with ChangeNotifier {
  final ApiService _api = ApiService.instance;

  final Map<String, List<Message>> _resourceChats = {};
  final Map<String, String> _resourceTitles = {};
  final Map<String, String> _resourceOfferants = {};

  final List<Message> _botMessages = [
    Message(
      id: '1',
      senderId: 'bot',
      content: 'Olá! Eu sou o ConectaIA. Como posso ajudar você hoje?',
      timestamp: DateTime.now(),
      isFromMe: false,
    ),
  ];

  final GeminiService _geminiService = GeminiService();

  List<Message> get botMessages => [..._botMessages];

  List<ChatConversation> get activeConversations {
    return _resourceChats.entries.where((e) => e.value.isNotEmpty).map((e) {
      return ChatConversation(
        resourceId: e.key,
        resourceTitle: _resourceTitles[e.key] ?? 'Recurso',
        offerantId: _resourceOfferants[e.key] ?? '',
        lastMessage: e.value.last,
      );
    }).toList()
      ..sort((a, b) => b.lastMessage.timestamp.compareTo(a.lastMessage.timestamp));
  }

  List<Message> getMessagesForResource(String resourceId) {
    return _resourceChats[resourceId] ?? [];
  }

  /// Abre (ou inicia) a conversa sobre um recurso. Quando o usuário
  /// está autenticado de verdade, busca o histórico persistido em
  /// GET /api/messages/conversation/{offerantId}?resourceId=... e, se
  /// for a primeira vez, já envia a mensagem de interesse via API. No
  /// modo Visitante (sem conta no backend) cai para um aviso local.
  Future<void> startRequestFlow({
    required String currentUserId,
    required bool isGhost,
    required String resourceId,
    required String resourceTitle,
    required String offerantId,
  }) async {
    _resourceTitles[resourceId] = resourceTitle;
    _resourceOfferants[resourceId] = offerantId;

    if (_resourceChats.containsKey(resourceId)) return;

    if (isGhost) {
      _resourceChats[resourceId] = [
        Message(
          id: 'ghost_init',
          senderId: 'system',
          content: 'Crie uma conta para conversar sobre "$resourceTitle".',
          timestamp: DateTime.now(),
          resourceId: resourceId,
          isFromMe: true,
        )
      ];
      notifyListeners();
      return;
    }

    try {
      final response = await _api.get(
        '/messages/conversation/$offerantId?resourceId=$resourceId',
        auth: true,
      );
      final history = (response as List<dynamic>)
          .map((json) => Message.fromJson(json, currentUserId: currentUserId))
          .toList();

      if (history.isEmpty) {
        final initial = await _api.post(
          '/messages',
          {
            'receiverId': offerantId,
            'resourceId': resourceId,
            'content': 'Olá! Tenho interesse no recurso: $resourceTitle',
          },
          auth: true,
        );
        history.add(Message.fromJson(initial, currentUserId: currentUserId));
      }

      _resourceChats[resourceId] = history;
    } catch (e) {
      _resourceChats[resourceId] = [
        Message(
          id: 'error_init',
          senderId: 'system',
          content: 'Não foi possível carregar a conversa (${e.toString()}).',
          timestamp: DateTime.now(),
          resourceId: resourceId,
          isFromMe: true,
        )
      ];
    }
    notifyListeners();
  }

  /// Envia uma mensagem real via POST /api/messages. Lança
  /// [ApiException] em caso de erro para a tela tratar (SnackBar).
  Future<void> sendMessageToResource(String currentUserId, String resourceId, String content) async {
    final offerantId = _resourceOfferants[resourceId];
    if (offerantId == null) return;

    final response = await _api.post(
      '/messages',
      {
        'receiverId': offerantId,
        'resourceId': resourceId,
        'content': content,
      },
      auth: true,
    );
    final message = Message.fromJson(response, currentUserId: currentUserId);
    _resourceChats.putIfAbsent(resourceId, () => []).add(message);
    notifyListeners();
  }

  Future<void> sendMessageToBot(String content) async {
    final userMessage = Message(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      senderId: 'me',
      content: content,
      timestamp: DateTime.now(),
      isFromMe: true,
    );

    _botMessages.add(userMessage);
    notifyListeners();

    final response = await _geminiService.generateResponse(content);

    final botMessage = Message(
      id: (DateTime.now().millisecondsSinceEpoch + 1).toString(),
      senderId: 'bot',
      content: response,
      timestamp: DateTime.now(),
      isFromMe: false,
    );

    _botMessages.add(botMessage);
    notifyListeners();
  }
}
