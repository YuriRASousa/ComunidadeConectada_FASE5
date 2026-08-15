import 'package:flutter/material.dart';
import '../models/resource.dart';
import '../theme/app_theme.dart';

class ResourceCard extends StatelessWidget {
  final Resource resource;
  final VoidCallback onTap;
  final VoidCallback onAction;

  const ResourceCard({
    super.key,
    required this.resource,
    required this.onTap,
    required this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryDark.withOpacity(0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: onTap,
          child: Column(
            children: [
              Stack(
                children: [
                  Hero(
                    tag: 'res_${resource.id}',
                    child: Container(
                      height: 160,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: AppTheme.scaffoldBg,
                      ),
                      child: resource.imageUrl != null
                          ? Image.network(resource.imageUrl!, fit: BoxFit.cover)
                          : const Icon(Icons.inventory_2_outlined, color: AppTheme.primaryBlue, size: 50),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    left: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: AppTheme.primaryBlue.withOpacity(0.85),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        resource.category.toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            resource.title,
                            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                          ),
                        ),
                        Text(
                          resource.type,
                          style: TextStyle(color: AppTheme.secondaryGreen, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      resource.description,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: AppTheme.slate600, fontSize: 14, height: 1.4),
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        CircleAvatar(
                          radius: 12,
                          backgroundColor: AppTheme.primaryBlue.withOpacity(0.1),
                          child: const Icon(Icons.person, size: 14, color: AppTheme.primaryBlue),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            resource.offerantName,
                            style: const TextStyle(fontSize: 13, color: AppTheme.textDark, fontWeight: FontWeight.w500),
                          ),
                        ),
                        ElevatedButton.icon(
                          onPressed: onAction,
                          icon: const Icon(Icons.chat_bubble_outline, size: 14),
                          label: const Text('CONVERSAR'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.primaryDark,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
