class Message {
  final String id;
  final String senderId;
  final String content;
  final DateTime timestamp;
  final String? resourceId;
  final bool isFromMe;

  Message({
    required this.id,
    required this.senderId,
    required this.content,
    required this.timestamp,
    this.resourceId,
    this.isFromMe = true,
  });

  /// [currentUserId] é usado para decidir se a mensagem veio "de mim"
  /// ou do outro participante da conversa (a API não guarda isso, é
  /// relativo a quem está olhando a tela).
  factory Message.fromJson(Map<String, dynamic> json, {required String currentUserId}) {
    final senderId = json['senderId'].toString();
    return Message(
      id: json['id'].toString(),
      senderId: senderId,
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
      resourceId: json['resourceId']?.toString(),
      isFromMe: senderId == currentUserId,
    );
  }
}
