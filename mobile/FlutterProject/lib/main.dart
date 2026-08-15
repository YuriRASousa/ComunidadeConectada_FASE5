import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/resource_provider.dart';
import 'providers/chat_provider.dart';
import 'screens/onboarding_screen.dart';
import 'screens/login_screen.dart';
import 'screens/main_navigation_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(const SmartHASApp());
}

class SmartHASApp extends StatelessWidget {
  const SmartHASApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => ResourceProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: MaterialApp(
        title: 'Smart HAS',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const OnboardingScreen(),
        routes: {
          '/login': (context) => const LoginScreen(),
          '/main': (context) => const MainNavigationScreen(),
        },
      ),
    );
  }
}
