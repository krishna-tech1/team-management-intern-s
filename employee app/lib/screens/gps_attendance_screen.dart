import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:geolocator/geolocator.dart';
import '../utils/app_theme.dart';
import '../widgets/fieldcore_bottom_nav.dart';
import '../providers/attendance_provider.dart';
import '../providers/auth_provider.dart';
import '../models/attendance_model.dart';

class GpsAttendanceScreen extends StatefulWidget {
  const GpsAttendanceScreen({super.key});

  @override
  State<GpsAttendanceScreen> createState() => _GpsAttendanceScreenState();
}

class _GpsAttendanceScreenState extends State<GpsAttendanceScreen> {
  Timer? _clockTimer;
  DateTime _currentDateTime = DateTime.now();
  Position? _currentPosition;
  String _currentAddress = 'Fetching current location...';
  String _permissionStatusText = 'Checking location permission...';
  bool _isLocating = false;

  @override
  void initState() {
    super.initState();
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _currentDateTime = DateTime.now();
        });
      }
    });
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final auth = context.read<AuthProvider>();
        final employeeId = auth.currentUser?.uid ?? '';
        context.read<AttendanceProvider>().initializeAttendance(employeeId);
        _handleLocationPermission();
      }
    });
  }

  @override
  void dispose() {
    _clockTimer?.cancel();
    super.dispose();
  }

  Future<void> _handleLocationPermission() async {
    bool serviceEnabled;
    LocationPermission permission;

    setState(() {
      _isLocating = true;
      _permissionStatusText = 'Checking location permission...';
    });

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      setState(() {
        _isLocating = false;
        _permissionStatusText = 'Location services are disabled.';
      });
      if (mounted) {
        _showEnableLocationDialog();
      }
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        setState(() {
          _isLocating = false;
          _permissionStatusText = 'Location permission denied.';
        });
        if (mounted) {
          _showPermissionDeniedDialog(false);
        }
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      setState(() {
        _isLocating = false;
        _permissionStatusText = 'Location permission permanently denied.';
      });
      if (mounted) {
        _showPermissionDeniedDialog(true);
      }
      return;
    }

    setState(() {
      _permissionStatusText = 'Location permission granted.';
    });

    await _getCurrentLocation();
  }

  Future<void> _getCurrentLocation() async {
    try {
      setState(() {
        _isLocating = true;
      });
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      setState(() {
        _currentPosition = position;
        _currentAddress = 'Latitude: ${position.latitude.toStringAsFixed(6)}\nLongitude: ${position.longitude.toStringAsFixed(6)}';
        _isLocating = false;
      });
    } catch (e) {
      setState(() {
        _isLocating = false;
        _currentAddress = 'Failed to get location: $e';
      });
    }
  }

  void _showEnableLocationDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('GPS Disabled'),
          content: const Text('Please enable GPS / Location services to check-in/out.'),
          actions: <Widget>[
            TextButton(
              child: const Text('Settings'),
              onPressed: () {
                Navigator.of(context).pop();
                Geolocator.openLocationSettings();
              },
            ),
            TextButton(
              child: const Text('OK'),
              onPressed: () {
                Navigator.of(context).pop();
                _handleLocationPermission();
              },
            ),
          ],
        );
      },
    );
  }

  void _showPermissionDeniedDialog(bool permanently) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Location Permission Required'),
          content: Text(
            permanently
                ? 'Location permission is permanently denied. Please enable it in the app settings to proceed.'
                : 'This app requires location permission to verify your check-in and check-out location.',
          ),
          actions: <Widget>[
            if (permanently)
              TextButton(
                child: const Text('Open Settings'),
                onPressed: () {
                  Navigator.of(context).pop();
                  Geolocator.openAppSettings();
                },
              )
            else
              TextButton(
                child: const Text('Grant Permission'),
                onPressed: () {
                  Navigator.of(context).pop();
                  _handleLocationPermission();
                },
              ),
            TextButton(
              child: const Text('Cancel'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final attProvider = context.watch<AttendanceProvider>();
    final auth = context.watch<AuthProvider>();
    final employeeId = auth.currentUser?.uid ?? '';
    
    final hasCheckIn = attProvider.todayAttendance?.checkInTime != null;
    final hasCheckOut = attProvider.todayAttendance?.checkOutTime != null;
    final formatter = DateFormat('hh:mm a');
    
    final String checkInText = hasCheckIn ? formatter.format(attProvider.todayAttendance!.checkInTime!.toLocal()) : '--';
    final String checkOutText = hasCheckOut ? formatter.format(attProvider.todayAttendance!.checkOutTime!.toLocal()) : '--';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.all(8),
          child: CircleAvatar(
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.person, color: Colors.white, size: 20),
          ),
        ),
        title: const Text(
          'Traxa',
          style: TextStyle(color: AppColors.accent, fontSize: 20, fontWeight: FontWeight.w700),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.refresh, color: AppColors.textPrimary), onPressed: _handleLocationPermission),
        ],
      ),
      body: attProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              child: Column(
                children: [
                  // Current Location Info Card (Replaces the map)
                  Container(
                    width: double.infinity,
                    margin: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [Color(0xFF1E3A8A), Color(0xFF3B82F6)],
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF3B82F6).withOpacity(0.3),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'LOCATION VERIFICATION',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 1.5,
                              ),
                            ),
                            Icon(Icons.gps_fixed, color: Colors.white70, size: 16),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.white24,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(
                                Icons.my_location,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _permissionStatusText,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 15,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    _currentPosition != null
                                        ? 'Accuracy: ${_currentPosition!.accuracy.toStringAsFixed(1)}m'
                                        : 'Waiting for coordinates...',
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        const Divider(color: Colors.white24, height: 1),
                        const SizedBox(height: 16),
                        const Text(
                          'CURRENT ADDRESS',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 10,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1.0,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          _currentAddress,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 13,
                            height: 1.4,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        if (_isLocating) ...[
                          const SizedBox(height: 12),
                          const LinearProgressIndicator(
                            backgroundColor: Colors.white12,
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.white70),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        // Location Verified Card
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(color: AppColors.divider, width: 0.8),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text('Location Verified', style: AppTextStyles.headlineLarge),
                                  const Spacer(),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                    decoration: BoxDecoration(
                                      color: AppColors.accent,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Row(
                                      children: [
                                        Icon(Icons.location_on, size: 12, color: Colors.white),
                                        SizedBox(width: 4),
                                        Text('ACTIVE', style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w700)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.check_circle_outline, size: 14, color: AppColors.accent),
                                  const SizedBox(width: 4),
                                  Text(
                                    _currentPosition != null && _currentPosition!.accuracy < 20
                                        ? 'GPS High Accuracy'
                                        : 'GPS Location Ready',
                                    style: const TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: AppColors.background,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.access_time, size: 18, color: AppColors.textSecondary),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'Today\'s Date & Time',
                                            style: TextStyle(fontSize: 11, color: AppColors.textSecondary),
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            DateFormat('EEEE, MMM dd • hh:mm:ss a').format(_currentDateTime),
                                            style: const TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.textPrimary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  const Icon(Icons.place_outlined, size: 14, color: AppColors.textSecondary),
                                  const SizedBox(width: 4),
                                  Expanded(
                                    child: Text(
                                      _currentPosition != null
                                          ? 'Lat: ${_currentPosition!.latitude.toStringAsFixed(4)}, Lon: ${_currentPosition!.longitude.toStringAsFixed(4)}'
                                          : 'GPS Coordinates not resolved',
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        // Check In / Check Out Buttons
                        Row(
                          children: [
                            Expanded(
                              child: ElevatedButton.icon(
                                onPressed: hasCheckIn
                                    ? null
                                    : () async {
                                        if (_isLocating) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Fetching current GPS coordinates, please wait...'), backgroundColor: Colors.amber),
                                          );
                                          return;
                                        }
                                        await _getCurrentLocation();
                                        if (_currentPosition == null) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Failed to determine location. Please ensure GPS is enabled.'), backgroundColor: Colors.red),
                                          );
                                          return;
                                        }

                                        final now = DateTime.now();
                                        final record = AttendanceModel(
                                          id: 'att-$employeeId-${now.millisecondsSinceEpoch}',
                                          employeeId: employeeId,
                                          date: now.toIso8601String().split('T').first,
                                          checkInTime: now,
                                          status: 'PRESENT',
                                          duration: '0h 0m',
                                          checkInLatitude: _currentPosition!.latitude,
                                          checkInLongitude: _currentPosition!.longitude,
                                          locationAccuracy: _currentPosition!.accuracy,
                                          checkInAddress: 'Latitude: ${_currentPosition!.latitude}, Longitude: ${_currentPosition!.longitude}',
                                        );
                                        final success = await attProvider.clockIn(record);
                                        if (success && context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Checked In successfully!'), backgroundColor: AppColors.primary),
                                          );
                                        } else if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text(attProvider.error ?? 'Failed to Check In'), backgroundColor: Colors.red),
                                          );
                                        }
                                      },
                                icon: const Icon(Icons.login, color: Colors.white),
                                label: const Text('Check-In', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.primary,
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: OutlinedButton.icon(
                                onPressed: (hasCheckIn && !hasCheckOut)
                                    ? () async {
                                        if (_isLocating) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Fetching current GPS coordinates, please wait...'), backgroundColor: Colors.amber),
                                          );
                                          return;
                                        }
                                        await _getCurrentLocation();
                                        if (_currentPosition == null) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Failed to determine location. Please ensure GPS is enabled.'), backgroundColor: Colors.red),
                                          );
                                          return;
                                        }

                                        // Calculate checkout distance
                                        final checkInLat = attProvider.todayAttendance?.checkInLatitude;
                                        final checkInLon = attProvider.todayAttendance?.checkInLongitude;
                                        if (checkInLat != null && checkInLon != null) {
                                          final distance = Geolocator.distanceBetween(
                                            checkInLat,
                                            checkInLon,
                                            _currentPosition!.latitude,
                                            _currentPosition!.longitude,
                                          );
                                          if (distance > 100) {
                                            if (context.mounted) {
                                              showDialog(
                                                context: context,
                                                builder: (ctx) => AlertDialog(
                                                  title: const Text('Checkout Failed'),
                                                  content: Text('Checkout failed. You are too far from your check-in location.\nDistance: ${distance.toStringAsFixed(1)} meters (Max allowed: 100 meters)'),
                                                  actions: [
                                                    TextButton(
                                                      child: const Text('OK'),
                                                      onPressed: () => Navigator.of(ctx).pop(),
                                                    ),
                                                  ],
                                                ),
                                              );
                                            }
                                            return;
                                          }
                                        }

                                        final todayAttId = attProvider.todayAttendance?.id ?? '';
                                        if (todayAttId.isEmpty) return;
                                        
                                        final success = await attProvider.clockOut(todayAttId, {
                                          'duration': '8h 43m',
                                          'checkOutLatitude': _currentPosition!.latitude,
                                          'checkOutLongitude': _currentPosition!.longitude,
                                          'checkOutAddress': 'Latitude: ${_currentPosition!.latitude}, Longitude: ${_currentPosition!.longitude}',
                                        });
                                        if (success && context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            const SnackBar(content: Text('Checked Out successfully!'), backgroundColor: AppColors.primary),
                                          );
                                        } else if (context.mounted) {
                                          ScaffoldMessenger.of(context).showSnackBar(
                                            SnackBar(content: Text(attProvider.error ?? 'Failed to Check Out'), backgroundColor: Colors.red),
                                          );
                                        }
                                      }
                                    : null,
                                icon: const Icon(Icons.logout, color: AppColors.primary),
                                label: const Text('Check-Out', style: TextStyle(color: AppColors.primary, fontSize: 16, fontWeight: FontWeight.w600)),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 18),
                                  side: const BorderSide(color: AppColors.primary, width: 1.5),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (hasCheckIn)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: AppColors.divider),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                Text('Check-in: $checkInText', style: AppTextStyles.bodyMedium),
                                Text('Check-out: $checkOutText', style: AppTextStyles.bodyMedium),
                              ],
                            ),
                          ),
                        const SizedBox(height: 20),
                        // Recent Logs
                        Row(
                          children: [
                            const Text('Recent Logs', style: AppTextStyles.headlineMedium),
                            const Spacer(),
                            GestureDetector(
                              onTap: () {},
                              child: const Text(
                                'VIEW ALL',
                                style: TextStyle(fontSize: 12, color: AppColors.accent, fontWeight: FontWeight.w600, letterSpacing: 0.5),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        if (attProvider.attendanceHistory.isEmpty)
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 20),
                            child: Text('No attendance logs found.', style: AppTextStyles.bodyMedium),
                          )
                        else
                          ...attProvider.attendanceHistory.map((log) => _AttendanceLogItem(log: log)),
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ],
              ),
            ),
      bottomNavigationBar: const FieldCoreBottomNav(currentIndex: 2),
    );
  }
}

class _AttendanceLogItem extends StatelessWidget {
  final AttendanceModel log;
  const _AttendanceLogItem({required this.log});

  @override
  Widget build(BuildContext context) {
    final isIn = log.checkOutTime == null;
    final isVerified = log.status == 'VERIFIED' || log.status == 'PRESENT' || log.status == 'LATE';
    final formatter = DateFormat('MMM dd • hh:mm a');
    final String displayDate = log.checkInTime != null ? formatter.format(log.checkInTime!.toLocal()) : log.date;
    final String logType = log.checkOutTime != null ? 'Clock Out' : 'Clock In';

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.divider, width: 0.8),
      ),
      child: Row(
        children: [
          Container(
            width: 38,
            height: 38,
            decoration: BoxDecoration(color: AppColors.iconBg, borderRadius: BorderRadius.circular(10)),
            child: Icon(isIn ? Icons.login : Icons.logout, size: 18, color: AppColors.primary),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(logType, style: AppTextStyles.titleLarge),
                Text(displayDate, style: AppTextStyles.bodySmall),
              ],
            ),
          ),
          if (isVerified)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(6)),
              child: Text(log.status, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w700)),
            )
          else
            Text(log.status, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: AppColors.textPrimary)),
        ],
      ),
    );
  }
}
