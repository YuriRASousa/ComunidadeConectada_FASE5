import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../providers/resource_provider.dart';
import '../theme/app_theme.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  late GoogleMapController _mapController;
  final LatLng _center = const LatLng(-23.5631, -46.6544);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mapa da Comunidade'),
      ),
      body: Consumer<ResourceProvider>(
        builder: (context, provider, child) {
          final Set<Marker> markers = provider.resources
              .where((r) => r.latitude != null && r.longitude != null)
              .map((r) {
            return Marker(
              markerId: MarkerId(r.id ?? r.title),
              position: LatLng(r.latitude!, r.longitude!),
              infoWindow: InfoWindow(
                title: r.title,
                snippet: r.category,
                onTap: () {
                  showModalBottomSheet(
                    context: context,
                    builder: (context) => Container(
                      padding: const EdgeInsets.all(16),
                      height: 150,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(r.title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 8),
                          Text(r.category, style: TextStyle(color: Colors.grey[600])),
                          const Spacer(),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('FECHAR'),
                          )
                        ],
                      ),
                    ),
                  );
                },
              ),
              icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
            );
          }).toSet();

          return GoogleMap(
            onMapCreated: (controller) => _mapController = controller,
            initialCameraPosition: CameraPosition(
              target: _center,
              zoom: 13.0,
            ),
            markers: markers,
            myLocationEnabled: true,
            myLocationButtonEnabled: true,
          );
        },
      ),
    );
  }
}
