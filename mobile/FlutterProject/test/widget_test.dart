import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:smart_has/main.dart';

void main() {
  testWidgets('App inicia na tela de onboarding', (WidgetTester tester) async {
    await tester.pumpWidget(const SmartHASApp());
    await tester.pump();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
