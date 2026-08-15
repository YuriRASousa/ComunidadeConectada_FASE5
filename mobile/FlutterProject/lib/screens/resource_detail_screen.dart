import 'package:flutter/material.dart';
import '../models/resource.dart';
import '../theme/app_theme.dart';
import 'chat_screen.dart';

class ResourceDetailScreen extends StatelessWidget {
  final Resource resource;

  const ResourceDetailScreen({super.key, required this.resource});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Detalhes do Recurso')),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              height: 250,
              width: double.infinity,
              color: Colors.grey[300],
              child: resource.imageUrl != null
                  ? Image.network(resource.imageUrl!, fit: BoxFit.cover)
                  : const Icon(Icons.inventory_2, size: 100, color: AppTheme.primaryBlue),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryBlue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          resource.category,
                          style: const TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold),
                        ),
                      ),
                      const Spacer(),
                      Text(
                        resource.condition,
                        style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    resource.title,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.person_pin, color: AppTheme.primaryBlue),
                      const SizedBox(width: 8),
                      Text(
                        'Ofertado por: ${resource.offerantName}',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  const Divider(height: 40),
                  const Text(
                    'Descrição',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    resource.description,
                    style: const TextStyle(fontSize: 16, height: 1.5, color: Color(0xFF475569)),
                  ),
                  const SizedBox(height: 100),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomSheet: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, -2))],
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatScreen(
                        resourceId: resource.id,
                        resourceTitle: resource.title,
                        offerantId: resource.offerantId,
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.secondaryGreen,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text('SOLICITAR RECURSO', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
