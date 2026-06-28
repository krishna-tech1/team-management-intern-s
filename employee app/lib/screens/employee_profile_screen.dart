import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/employee_provider.dart';
import '../providers/auth_provider.dart';
import 'login_screen.dart';

class EmployeeProfileScreen extends StatelessWidget {
  const EmployeeProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: const Text(
          'FieldCore',
          style: TextStyle(color: Color(0xFF966314), fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search, color: AppColors.textPrimary), onPressed: () {}),
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: CircleAvatar(
              backgroundColor: AppColors.primary,
              radius: 17,
              child: const Icon(Icons.person, color: Colors.white, size: 18),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Consumer<EmployeeProvider>(
          builder: (context, employeeProvider, _) {
            final employee = employeeProvider.employee;
            
            return Column(
              children: [
                // Profile Section
                const SizedBox(height: 12),
                Stack(
                  alignment: Alignment.center,
                  children: [
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        color: const Color(0xFF2C3E50),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: employee?.profilePictureUrl != null
                          ? CachedNetworkImage(
                              imageUrl: employee!.profilePictureUrl!,
                              fit: BoxFit.cover,
                              placeholder: (context, url) => const Center(
                                child: CircularProgressIndicator(),
                              ),
                              errorWidget: (context, url, error) => Container(
                                color: const Color(0xFF2C3E50),
                                child: const Icon(Icons.person, size: 50, color: Colors.white),
                              ),
                            )
                          : Container(
                              color: const Color(0xFF2C3E50),
                              child: const Icon(Icons.person, size: 50, color: Colors.white),
                            ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                Text(
                  employee?.name ?? 'Employee',
                  style: AppTextStyles.displayMedium,
                ),
                const SizedBox(height: 4),
                Text(
                  'Employee ID: ${employee?.id ?? 'N/A'}',
                  style: AppTextStyles.bodyMedium,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(color: const Color(0xFFEBE1D5), borderRadius: BorderRadius.circular(8)),
                      child: Row(
                        children: [
                          const Icon(Icons.verified, size: 14, color: Color(0xFF966314)),
                          const SizedBox(width: 8),
                          Text(
                            employee?.role ?? 'Field Expert',
                            style: const TextStyle(fontSize: 10, color: Color(0xFF5A4325)),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(color: const Color(0xFFEBE1D5), borderRadius: BorderRadius.circular(8)),
                      child: Row(
                        children: const [
                          Icon(Icons.info_outline, size: 14, color: Color(0xFF5A4325)),
                          SizedBox(width: 8),
                          Text('Read-only\nprofile', style: TextStyle(fontSize: 10, color: Color(0xFF5A4325)), textAlign: TextAlign.center),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),

                // Department Card
                _InfoCard(
                  children: [
                    Text(
                      'DEPARTMENT',
                      style: AppTextStyles.labelLarge.copyWith(color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      employee?.department ?? 'N/A',
                      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Color(0xFFF39C12)),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
                        const SizedBox(width: 4),
                        Text(employee?.zone ?? 'N/A', style: AppTextStyles.bodyMedium),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Contact Information
                _InfoCard(
                  children: [
                    Text(
                      'CONTACT INFORMATION',
                      style: AppTextStyles.labelLarge.copyWith(color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.email_outlined, size: 18, color: Color(0xFF966314)),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            employee?.email ?? 'N/A',
                            style: AppTextStyles.bodyLarge,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Icon(Icons.phone_outlined, size: 18, color: Color(0xFF966314)),
                        const SizedBox(width: 10),
                        Text(employee?.phone ?? 'N/A', style: AppTextStyles.bodyLarge),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Logout Button
                Consumer<AuthProvider>(
                  builder: (context, authProvider, _) => GestureDetector(
                    onTap: authProvider.isLoading
                        ? null
                        : () async {
                            await authProvider.logout();
                            if (context.mounted) {
                              Navigator.of(context).pushAndRemoveUntil(
                                MaterialPageRoute(builder: (_) => const LoginScreen()),
                                (route) => false,
                              );
                            }
                          },
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      decoration: BoxDecoration(
                        color: AppColors.surface,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (authProvider.isLoading)
                            const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          else ...[
                            const Icon(Icons.logout, color: Color(0xFFD32F2F)),
                            const SizedBox(width: 8),
                            const Text('Logout', style: TextStyle(color: Color(0xFFD32F2F), fontWeight: FontWeight.bold)),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 20),

                // Footer
                const Text(
                  'FieldCore GST MCA v2.2.0-stable',
                  style: TextStyle(color: Color(0xFFD6C8B5), fontSize: 11),
                ),
                const SizedBox(height: 4),
                const Text(
                  '© 2024 Ministry of Corporate Affairs',
                  style: TextStyle(color: Color(0xFFD6C8B5), fontSize: 11),
                ),
                const SizedBox(height: 80),
              ],
            );
          },
        ),
      ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 4),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final List<Widget> children;
  const _InfoCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.divider, width: 0.8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: children,
      ),
    );
  }
}


