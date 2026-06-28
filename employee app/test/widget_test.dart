import 'package:flutter_test/flutter_test.dart';
import 'package:flutterappln1/main.dart';

void main() {
  testWidgets('FieldCore app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const FieldCoreApp());
    // Verify that the login screen renders
    expect(find.text('Welcome Back'), findsOneWidget);
  });
}
