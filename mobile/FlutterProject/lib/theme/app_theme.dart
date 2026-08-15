import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppTheme {
  static const Color primaryBlue = Color(0xFF0EA5E9); // Azul Sky 500 (mais moderno)
  static const Color secondaryGreen = Color(0xFF10B981); // Esmeralda
  static const Color primaryDark = Color(0xFF0F172A); // Slate 900
  static const Color textDark = Color(0xFF1E293B);    // Slate 800
  static const Color slate600 = Color(0xFF475569);
  static const Color scaffoldBg = Color(0xFFF8FAFC);  // Slate 50 (mais limpo)

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: primaryBlue,
        primary: primaryBlue,
        secondary: secondaryGreen,
        surface: Colors.white,
        onBackground: textDark,
      ),
      scaffoldBackgroundColor: scaffoldBg,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: false,
        iconTheme: IconThemeData(color: primaryDark),
        titleTextStyle: TextStyle(
          color: primaryDark,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: primaryDark,
        selectedItemColor: primaryBlue,
        unselectedItemColor: Color(0xFF94A3B8), // Slate 400
        type: BottomNavigationBarType.fixed,
        elevation: 8,
      ),
      textTheme: GoogleFonts.interTextTheme().copyWith(
        titleLarge: GoogleFonts.inter(color: primaryDark, fontWeight: FontWeight.bold),
        bodyLarge: GoogleFonts.inter(color: textDark),
        bodyMedium: GoogleFonts.inter(color: slate600),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primaryBlue,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          textStyle: const TextStyle(fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
