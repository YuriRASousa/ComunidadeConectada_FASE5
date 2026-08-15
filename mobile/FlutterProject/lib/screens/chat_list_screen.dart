import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../theme/app_theme.dart';
import 'chat_screen.dart';
import 'package:intl/intl.dart';

class ChatListScreen extends StatelessWidget {
  const ChatListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Conversas'),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_vert),
            onPressed: () {},
          ),
        ],
      ),
      body: Consumer<ChatProvider>(
        builder: (context, chatProvider, child) {
          final conversations = chatProvider.activeConversations;

          if (conversations.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.chat_bubble_outline, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text(
                    'Nenhuma conversa ainda',
                    style: TextStyle(color: Colors.grey[600], fontSize: 18),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Suas conversas com ofertantes aparecerão aqui.',
                    style: TextStyle(color: Colors.grey[500]),
                  ),
                ],
              ),
            );
          }

          return ListView.separated(
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: conversations.length,
            separatorBuilder: (context, index) => const Divider(height: 1, indent: 80),
            itemBuilder: (context, index) {
              final chat = conversations[index];
              final time = DateFormat('HH:mm').format(chat.lastMessage.timestamp);

              return ListTile(
                leading: CircleAvatar(
                  radius: 28,
                  backgroundColor: AppTheme.primaryBlue.withOpacity(0.1),
                  child: const Icon(Icons.inventory_2_outlined, color: AppTheme.primaryBlue),
                ),
                title: Text(
                  chat.resourceTitle,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                subtitle: Text(
                  chat.lastMessage.content,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(color: Colors.grey[600]),
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(time, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                    const SizedBox(height: 4),
                    if (chat.lastMessage.isFromMe == false)
                      const CircleAvatar(radius: 4, backgroundColor: AppTheme.primaryBlue),
                  ],
                ),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(
                        resourceId: chat.resourceId,
                        resourceTitle: chat.resourceTitle,
                        offerantId: chat.offerantId,
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}
