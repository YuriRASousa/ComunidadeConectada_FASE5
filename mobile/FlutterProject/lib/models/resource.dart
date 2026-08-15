/// Traduz entre os rótulos em português usados na UI e os enums do
/// backend Spring Boot (definidos em API_CONTRACT.md), nos dois sentidos.
class ResourceOptions {
  static const Map<String, String> categoryToApi = {
    'Ferramentas': 'FERRAMENTAS',
    'Saúde': 'SAUDE',
    'Educação': 'EDUCACAO',
    'Alimentos': 'ALIMENTOS',
    'Eletrônicos': 'ELETRONICOS',
    'Outros': 'OUTROS',
  };

  static const Map<String, String> conditionToApi = {
    'Novo': 'NOVO',
    'Excelente': 'EXCELENTE',
    'Boa': 'BOM',
    'Regular': 'REGULAR',
  };

  static const Map<String, String> typeToApi = {
    'Empréstimo': 'EMPRESTIMO',
    'Troca': 'TROCA',
    'Doação': 'DOACAO',
  };

  static const Map<String, String> availabilityToApi = {
    'Disponível': 'DISPONIVEL',
    'Reservado': 'RESERVADO',
    'Indisponível': 'INDISPONIVEL',
  };

  static final Map<String, String> categoryFromApi = categoryToApi.map((k, v) => MapEntry(v, k));
  static final Map<String, String> conditionFromApi = conditionToApi.map((k, v) => MapEntry(v, k));
  static final Map<String, String> typeFromApi = typeToApi.map((k, v) => MapEntry(v, k));
  static final Map<String, String> availabilityFromApi = availabilityToApi.map((k, v) => MapEntry(v, k));

  static List<String> get categories => categoryToApi.keys.toList();
  static List<String> get conditions => conditionToApi.keys.toList();
  static List<String> get types => typeToApi.keys.toList();
  static List<String> get availabilities => availabilityToApi.keys.toList();
}

class Resource {
  final String id;
  final String title;
  final String description;
  final String category;
  final String condition;
  final String offerantId;
  final String? imageUrl;
  final String availability;
  final String type;
  final double? latitude;
  final double? longitude;
  final String offerantName;

  Resource({
    required this.id,
    required this.title,
    required this.description,
    required this.category,
    required this.condition,
    required this.offerantId,
    this.imageUrl,
    required this.availability,
    required this.type,
    this.latitude,
    this.longitude,
    this.offerantName = "Usuário",
  });

  /// Constrói a partir do JSON retornado pela API Spring Boot
  /// (campos em maiúsculas para category/condition/type/availability).
  factory Resource.fromJson(Map<String, dynamic> json) {
    return Resource(
      id: json['id'].toString(),
      title: json['title'],
      description: json['description'],
      category: ResourceOptions.categoryFromApi[json['category']] ?? json['category'],
      condition: ResourceOptions.conditionFromApi[json['condition']] ?? json['condition'],
      offerantId: json['offerantId'].toString(),
      imageUrl: json['imageUrl'],
      availability: ResourceOptions.availabilityFromApi[json['availability']] ?? json['availability'],
      type: ResourceOptions.typeFromApi[json['type']] ?? json['type'],
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      offerantName: json['offerantName'] ?? 'Usuário',
    );
  }

  /// Corpo enviado em POST /api/resources (a API preenche offerantId
  /// a partir do usuário autenticado pelo JWT).
  Map<String, dynamic> toCreateJson() {
    return {
      'title': title,
      'description': description,
      'category': ResourceOptions.categoryToApi[category] ?? category,
      'condition': ResourceOptions.conditionToApi[condition] ?? condition,
      'availability': ResourceOptions.availabilityToApi[availability] ?? availability,
      'type': ResourceOptions.typeToApi[type] ?? type,
      if (imageUrl != null) 'imageUrl': imageUrl,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
    };
  }
}
