import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../theme/app_theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  final _addressController = TextEditingController();
  bool _isRegistering = false;

  Future<void> _handleSubmit() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);

    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('E-mail e senha são obrigatórios.')),
      );
      return;
    }

    try {
      if (_isRegistering) {
        if (_nameController.text.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Por favor, preencha seu nome.')),
          );
          return;
        }
        await authProvider.register(
          _nameController.text,
          _emailController.text,
          _addressController.text,
          _passwordController.text,
        );
      } else {
        await authProvider.login(_emailController.text, _passwordController.text);
      }
      if (!mounted) return;
      Navigator.of(context).pushReplacementNamed('/main');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 30),
          child: Column(
            children: [
              const SizedBox(height: 60),
              const Icon(Icons.hub_outlined, size: 80, color: AppTheme.primaryBlue),
              const SizedBox(height: 16),
              Text(
                _isRegistering ? 'Criar Conta' : 'Bem-vindo de volta',
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
              ),
              const SizedBox(height: 32),
              
              if (_isRegistering) ...[
                _buildTextField(_nameController, 'Nome Completo', Icons.person_outline),
                const SizedBox(height: 16),
              ],
              
              _buildTextField(_emailController, 'E-mail', Icons.email_outlined),
              const SizedBox(height: 16),
              
              _buildTextField(_passwordController, 'Senha', Icons.lock_outline, isPassword: true),
              const SizedBox(height: 16),
              
              if (_isRegistering) ...[
                _buildTextField(_addressController, 'Endereço (Cidade/Estado)', Icons.location_on_outlined),
                const SizedBox(height: 16),
              ],
              
              const SizedBox(height: 16),
              
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: authProvider.isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryBlue,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: authProvider.isLoading
                      ? const SizedBox(
                          width: 22,
                          height: 22,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : Text(
                          _isRegistering ? 'CADASTRAR' : 'ENTRAR',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              TextButton(
                onPressed: () {
                  setState(() => _isRegistering = !_isRegistering);
                },
                child: Text(
                  _isRegistering 
                    ? 'Já tem uma conta? Entre aqui' 
                    : 'Não tem conta? Cadastre-se agora',
                  style: const TextStyle(color: AppTheme.primaryBlue),
                ),
              ),
              
              const Divider(height: 40),
              
              OutlinedButton.icon(
                onPressed: () {
                  authProvider.loginAsGhost();
                  Navigator.of(context).pushReplacementNamed('/main');
                },
                icon: const Icon(Icons.visibility_off_outlined),
                label: const Text('ENTRAR COMO VISITANTE'),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 50),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField(TextEditingController controller, String label, IconData icon, {bool isPassword = false}) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, color: AppTheme.primaryBlue),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        filled: true,
        fillColor: Colors.grey[50],
        contentPadding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
      ),
    );
  }
}
