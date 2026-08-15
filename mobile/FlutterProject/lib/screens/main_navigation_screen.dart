import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/resource_provider.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';
import 'chat_list_screen.dart';
import 'offer_resource_screen.dart';
import 'map_screen.dart';
import 'profile_screen.dart';
import 'chatbot_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  const MainNavigationScreen({super.key});

  @override
  State<MainNavigationScreen> createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ResourceProvider>(context, listen: false).fetchResources();
    });
  }

  final List<Widget> _screens = [
    const HomeScreen(),
    const ChatListScreen(),
    const OfferResourceScreen(),
    const MapScreen(),
    const ProfileScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      floatingActionButton: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(30),
          gradient: const LinearGradient(
            colors: [AppTheme.primaryBlue, Color(0xFF38BDF8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primaryBlue.withOpacity(0.4),
              blurRadius: 15,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: FloatingActionButton(
          onPressed: () {
            showModalBottomSheet(
              context: context,
              isScrollControlled: true,
              backgroundColor: Colors.transparent,
              builder: (context) => const ChatbotScreen(),
            );
          },
          backgroundColor: Colors.transparent,
          elevation: 0,
          child: const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
        ),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        backgroundColor: AppTheme.primaryDark,
        selectedItemColor: AppTheme.primaryBlue,
        unselectedItemColor: const Color(0xFF94A3B8),
        type: BottomNavigationBarType.fixed,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_filled), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_rounded), label: 'Chats'),
          BottomNavigationBarItem(
            icon: CircleAvatar(
              backgroundColor: AppTheme.secondaryGreen,
              radius: 20,
              child: Icon(Icons.add, color: Colors.white, size: 28),
            ),
            label: 'Ofertar',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.map_rounded), label: 'Mapa'),
          BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Perfil'),
        ],
      ),
    );
  }
}
