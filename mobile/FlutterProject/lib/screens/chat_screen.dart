import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/chat_provider.dart';
import '../theme/app_theme.dart';

class ChatScreen extends StatefulWidget {
  final String resourceId;
  final String resourceTitle;
  final String offerantId;

  const ChatScreen({
    super.key,
    required this.resourceId,
    required this.resourceTitle,
    required this.offerantId,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoadingHistory = true;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadConversation());
  }

  Future<void> _loadConversation() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final chatProvider = Provider.of<ChatProvider>(context, listen: false);
    await chatProvider.startRequestFlow(
      currentUserId: authProvider.currentUser!.id,
      isGhost: authProvider.isGhost,
      resourceId: widget.resourceId,
      resourceTitle: widget.resourceTitle,
      offerantId: widget.offerantId,
    );
    if (mounted) setState(() => _isLoadingHistory = false);
  }

  Future<void> _handleSend() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isSending) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.isGhost) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Crie uma conta para enviar mensagens.')),
      );
      return;
    }

    setState(() => _isSending = true);
    try {
      await Provider.of<ChatProvider>(context, listen: false).sendMessageToResource(
        authProvider.currentUser!.id,
        widget.resourceId,
        text,
      );
      _controller.clear();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Não foi possível enviar: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.jumpTo(_scrollController.position.maxScrollExtent);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.scaffoldBg,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.resourceTitle, style: const TextStyle(fontSize: 16)),
            const Text('Conversa sobre o recurso', style: TextStyle(fontSize: 12, fontWeight: FontWeight.normal)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoadingHistory
                ? const Center(child: CircularProgressIndicator())
                : Consumer<ChatProvider>(
                    builder: (context, chatProvider, child) {
                      final messages = chatProvider.getMessagesForResource(widget.resourceId);
                      _scrollToBottom();
                      return ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: messages.length,
                        itemBuilder: (context, index) {
                          final message = messages[index];
                          final isMe = message.isFromMe;
                          final isSystem = message.senderId == 'system';

                          if (isSystem) {
                            return Container(
                              margin: const EdgeInsets.symmetric(vertical: 16),
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: AppTheme.primaryBlue.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppTheme.primaryBlue.withOpacity(0.2)),
                              ),
                              child: Text(
                                message.content,
                                textAlign: TextAlign.center,
                                style: const TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold),
                              ),
                            );
                          }

                          return Align(
                            alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                            child: Container(
                              margin: const EdgeInsets.symmetric(vertical: 4),
                              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: isMe ? AppTheme.primaryBlue : Colors.white,
                                borderRadius: BorderRadius.only(
                                  topLeft: const Radius.circular(16),
                                  topRight: const Radius.circular(16),
                                  bottomLeft: Radius.circular(isMe ? 16 : 0),
                                  bottomRight: Radius.circular(isMe ? 0 : 16),
                                ),
                                boxShadow: [
                                  if (!isMe) BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 2)
                                ],
                              ),
                              child: Text(
                                message.content,
                                style: TextStyle(color: isMe ? Colors.white : AppTheme.textDark),
                              ),
                            ),
                          );
                        },
                      );
                    },
                  ),
          ),
          _buildInputArea(),
        ],
      ),
    );
  }

  Widget _buildInputArea() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(color: Colors.white),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _controller,
                decoration: InputDecoration(
                  hintText: 'Pergunte sobre o item...',
                  filled: true,
                  fillColor: AppTheme.scaffoldBg,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(24),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                ),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              backgroundColor: AppTheme.primaryBlue,
              child: _isSending
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 20),
                      onPressed: _handleSend,
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
