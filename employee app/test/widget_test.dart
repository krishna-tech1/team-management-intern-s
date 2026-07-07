import 'package:flutter_test/flutter_test.dart';
import 'package:flutterappln1/main.dart';

void main() {
  testWidgets('Traxa app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const TraxaApp());
    // Verify that the login screen renders
    expect(find.text('Welcome Back'), findsOneWidget);
  });
}
