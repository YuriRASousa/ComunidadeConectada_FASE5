import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/resource_provider.dart';
import '../widgets/resource_card.dart';
import '../theme/app_theme.dart';
import 'chat_screen.dart';
import 'resource_detail_screen.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.currentUser;
    final firstName = user?.name.split(' ')[0] ?? 'Visitante';

    return Scaffold(
      backgroundColor: AppTheme.scaffoldBg,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 180.0,
            floating: false,
            pinned: true,
            backgroundColor: AppTheme.primaryDark,
            elevation: 0,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppTheme.primaryDark, Color(0xFF1E293B)],
                  ),
                ),
                child: Padding(
                  padding: const EdgeInsets.only(left: 20, top: 60),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Olá, $firstName!',
                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'O que você precisa hoje?',
                        style: TextStyle(color: Colors.blueGrey[100], fontSize: 16),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(40),
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                height: 50,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 10, offset: const Offset(0, 5))
                  ],
                ),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: 'Buscar recursos ou ajuda...',
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon: const Icon(Icons.search, color: AppTheme.primaryBlue),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 15),
                  ),
                ),
              ),
            ),
          ),
          const SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.fromLTRB(16, 24, 16, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Destaques na Região',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  Text(
                    'Ver todos',
                    style: TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ),
          ),
          Consumer<ResourceProvider>(
            builder: (context, provider, child) {
              if (provider.isLoading && provider.resources.isEmpty) {
                return const SliverToBoxAdapter(
                  child: Padding(
                    padding: EdgeInsets.only(top: 40),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                );
              }

              if (provider.error != null && provider.resources.isEmpty) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                    child: Column(
                      children: [
                        Icon(Icons.wifi_off_rounded, size: 48, color: Colors.grey[400]),
                        const SizedBox(height: 12),
                        Text(
                          'Não foi possível carregar os recursos.\n${provider.error}',
                          textAlign: TextAlign.center,
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                        const SizedBox(height: 12),
                        TextButton(
                          onPressed: () => provider.fetchResources(),
                          child: const Text('Tentar novamente'),
                        ),
                      ],
                    ),
                  ),
                );
              }

              if (provider.resources.isEmpty) {
                return SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 40),
                    child: Center(
                      child: Text('Nenhum recurso disponível ainda.', style: TextStyle(color: Colors.grey[600])),
                    ),
                  ),
                );
              }

              return SliverPadding(
                padding: const EdgeInsets.only(bottom: 80),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final resource = provider.resources[index];
                      return ResourceCard(
                        resource: resource,
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ResourceDetailScreen(resource: resource),
                            ),
                          );
                        },
                        onAction: () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) => ChatScreen(
                                resourceId: resource.id,
                                resourceTitle: resource.title,
                                offerantId: resource.offerantId,
                              ),
                            ),
                          );
                        },
                      );
                    },
                    childCount: provider.resources.length,
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
