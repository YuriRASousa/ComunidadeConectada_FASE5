import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../providers/auth_provider.dart';
import '../providers/resource_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/resource_card.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final ImagePicker _picker = ImagePicker();

  Future<void> _changePhoto(AuthProvider authProvider) async {
    final XFile? pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      await authProvider.updateUser(profileImageUrl: pickedFile.path);
    }
  }

  void _showEditDialog(BuildContext context, AuthProvider authProvider) {
    final nameController = TextEditingController(text: authProvider.currentUser?.name);
    final addressController = TextEditingController(text: authProvider.currentUser?.address);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Editar Perfil'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(
                labelText: 'Nome Completo',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: addressController,
              decoration: const InputDecoration(
                labelText: 'Endereço',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () async {
              final navigator = Navigator.of(context);
              final messenger = ScaffoldMessenger.of(context);
              try {
                await authProvider.updateUser(
                  name: nameController.text,
                  address: addressController.text,
                );
                navigator.pop();
                messenger.showSnackBar(
                  const SnackBar(content: Text('Perfil atualizado!')),
                );
              } catch (e) {
                messenger.showSnackBar(
                  SnackBar(content: Text('Não foi possível atualizar: $e')),
                );
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primaryBlue),
            child: const Text('Salvar'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final resourceProvider = Provider.of<ResourceProvider>(context);
    final user = authProvider.currentUser;

    if (user == null) {
      return const Scaffold(
        body: Center(child: Text('Usuário não logado.')),
      );
    }

    final myItems = resourceProvider.resources.where((r) => r.offerantId == user.id).toList();

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBg,
      appBar: AppBar(
        title: const Text('Minha Conta'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              // Menu de configurações
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header do Perfil
            Container(
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
              ),
              child: Column(
                children: [
                  Stack(
                    children: [
                      CircleAvatar(
                        radius: 55,
                        backgroundColor: AppTheme.primaryBlue.withOpacity(0.1),
                        backgroundImage: user.profileImageUrl != null
                            ? (user.profileImageUrl!.startsWith('http')
                                ? NetworkImage(user.profileImageUrl!)
                                : FileImage(File(user.profileImageUrl!)) as ImageProvider)
                            : null,
                        child: user.profileImageUrl == null
                            ? const Icon(Icons.person, size: 60, color: AppTheme.primaryBlue)
                            : null,
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: GestureDetector(
                          onTap: () => _changePhoto(authProvider),
                          child: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: AppTheme.primaryBlue,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user.name,
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user.email,
                    style: TextStyle(color: Colors.grey[600], fontSize: 16),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _buildStatItem('Reputação', user.reputation.toString(), Icons.star, Colors.amber),
                      const SizedBox(width: 24),
                      _buildStatItem('Trocas', user.totalTransactions.toString(), Icons.swap_horiz, AppTheme.secondaryGreen),
                    ],
                  ),
                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () => _showEditDialog(context, authProvider),
                      icon: const Icon(Icons.edit_outlined, size: 18),
                      label: const Text('EDITAR PERFIL'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Meus Itens Ofertados',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  const SizedBox(height: 16),
                  if (myItems.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(32),
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Column(
                        children: [
                          Icon(Icons.inventory_2_outlined, size: 48, color: Colors.grey[300]),
                          const SizedBox(height: 12),
                          const Text(
                            'Você ainda não ofertou nada.',
                            style: TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  else
                    ...myItems.map((item) => ResourceCard(
                          resource: item,
                          onTap: () {},
                          onAction: () {},
                        )),
                  
                  const SizedBox(height: 24),
                  const Text(
                    'Configurações',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  const SizedBox(height: 16),
                  _buildOptionTile(Icons.notifications_none, 'Notificações', 'Sons e alertas de mensagens'),
                  _buildOptionTile(Icons.location_on_outlined, 'Meu Endereço', user.address),
                  _buildOptionTile(Icons.privacy_tip_outlined, 'Privacidade', 'Gerenciar visibilidade e dados'),
                  _buildOptionTile(Icons.help_outline, 'Ajuda e Suporte', 'FAQ e contato'),
                  
                  const SizedBox(height: 24),
                  ListTile(
                    leading: const Icon(Icons.logout, color: Colors.red),
                    title: const Text('Sair da Conta', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                    onTap: () {
                      authProvider.logout();
                      Navigator.of(context).pushReplacementNamed('/');
                    },
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Row(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 4),
            Text(value, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          ],
        ),
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ],
    );
  }

  Widget _buildOptionTile(IconData icon, String title, String subtitle) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppTheme.scaffoldBg,
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppTheme.primaryBlue, size: 22),
        ),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12), maxLines: 1, overflow: TextOverflow.ellipsis),
        trailing: const Icon(Icons.chevron_right, size: 20),
        onTap: () {},
      ),
    );
  }
}
