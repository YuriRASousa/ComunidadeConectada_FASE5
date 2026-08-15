import 'package:flutter/material.dart';
import 'dart:io';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../services/gemini_service.dart';
import '../models/resource.dart';
import '../providers/auth_provider.dart';
import '../providers/resource_provider.dart';

class OfferResourceScreen extends StatefulWidget {
  const OfferResourceScreen({super.key});

  @override
  State<OfferResourceScreen> createState() => _OfferResourceScreenState();
}

class _OfferResourceScreenState extends State<OfferResourceScreen> {
  final _formKey = GlobalKey<FormState>();
  final _descriptionController = TextEditingController();
  final _titleController = TextEditingController();
  final _geminiService = GeminiService();
  bool _isImproving = false;
  bool _isPublishing = false;
  File? _image;
  final ImagePicker _picker = ImagePicker();

  String _category = ResourceOptions.categories.first;
  String _condition = ResourceOptions.conditions.first;
  String _type = ResourceOptions.types.first;

  Future<void> _pickImage() async {
    final XFile? pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile != null) {
      setState(() {
        _image = File(pickedFile.path);
      });
    }
  }

  Future<void> _improveWithAI() async {
    if (_descriptionController.text.isEmpty) return;

    setState(() => _isImproving = true);
    try {
      final improved = await _geminiService.improveDescription(_descriptionController.text);
      setState(() {
        _descriptionController.text = improved;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Descrição aprimorada pelo ConectaIA! ✨')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Erro ao conectar com a IA.')),
      );
    } finally {
      setState(() => _isImproving = false);
    }
  }

  Future<void> _publish() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    if (authProvider.isGhost) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Crie uma conta para ofertar um recurso.')),
      );
      return;
    }
    if (_titleController.text.trim().isEmpty || _descriptionController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Preencha título e descrição.')),
      );
      return;
    }

    setState(() => _isPublishing = true);
    try {
      final resourceProvider = Provider.of<ResourceProvider>(context, listen: false);
      await resourceProvider.addResource(Resource(
        id: '',
        title: _titleController.text.trim(),
        description: _descriptionController.text.trim(),
        category: _category,
        condition: _condition,
        type: _type,
        availability: 'Disponível',
        offerantId: authProvider.currentUser!.id,
        offerantName: authProvider.currentUser!.name,
      ));
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Oferta publicada com sucesso!')),
      );
      Navigator.of(context).pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Não foi possível publicar: $e')),
      );
    } finally {
      if (mounted) setState(() => _isPublishing = false);
    }
  }

  Widget _buildDropdown(String label, String value, List<String> options, ValueChanged<String> onChanged) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildLabel(label),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.grey[200]!),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: value,
              isExpanded: true,
              items: options
                  .map((o) => DropdownMenuItem(value: o, child: Text(o)))
                  .toList(),
              onChanged: (v) {
                if (v != null) onChanged(v);
              },
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Ofertar Recurso'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'O que você deseja compartilhar?',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 8),
              Text(
                'Sua oferta ajudará alguém na comunidade.',
                style: TextStyle(color: Colors.grey[600]),
              ),
              const SizedBox(height: 24),

              _buildLabel('Título do Recurso'),
              _buildTextField(_titleController, 'Ex: Cadeira de Rodas, Doação de Alimentos...'),

              const SizedBox(height: 20),

              Row(
                children: [
                  Expanded(
                    child: _buildDropdown('Categoria', _category, ResourceOptions.categories, (v) => setState(() => _category = v)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildDropdown('Tipo de Oferta', _type, ResourceOptions.types, (v) => setState(() => _type = v)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildDropdown('Condição', _condition, ResourceOptions.conditions, (v) => setState(() => _condition = v)),

              const SizedBox(height: 20),

              _buildLabel('Imagem do Produto'),
              GestureDetector(
                onTap: _pickImage,
                child: Container(
                  width: double.infinity,
                  height: 180,
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: _image != null
                      ? ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: Image.file(_image!, fit: BoxFit.cover),
                        )
                      : Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.add_a_photo_outlined, size: 40, color: Colors.grey[400]),
                            const SizedBox(height: 8),
                            Text('Adicionar Foto', style: TextStyle(color: Colors.grey[500])),
                          ],
                        ),
                ),
              ),

              const SizedBox(height: 20),

              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildLabel('Descrição Detalhada'),
                  TextButton.icon(
                    onPressed: _isImproving ? null : _improveWithAI,
                    icon: _isImproving
                      ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                      : const Icon(Icons.auto_awesome, size: 16),
                    label: Text(_isImproving ? 'Melhorando...' : 'Melhorar com IA'),
                    style: TextButton.styleFrom(foregroundColor: AppTheme.primaryBlue),
                  ),
                ],
              ),
              _buildTextField(_descriptionController, 'Descreva o estado, condições e como retirar...', maxLines: 4),

              const SizedBox(height: 32),

              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: _isPublishing ? null : _publish,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.secondaryGreen,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isPublishing
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text(
                          'PUBLICAR OFERTA',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String hint, {int maxLines = 1}) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[200]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[200]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppTheme.primaryBlue, width: 2),
        ),
      ),
    );
  }
}
