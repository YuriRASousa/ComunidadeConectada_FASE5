class User {
  final String id;
  final String name;
  final String email;
  final String address;
  final String? profileImageUrl;
  final double reputation;
  final int totalTransactions;
  final bool isVerified;

  User({
    required this.id,
    required this.name,
    required this.email,
    required this.address,
    this.profileImageUrl,
    this.reputation = 0.0,
    this.totalTransactions = 0,
    this.isVerified = false,
  });

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      id: map['id'].toString(),
      name: map['name'],
      email: map['email'],
      address: map['address'] ?? '',
      profileImageUrl: map['profileImageUrl'],
      reputation: (map['reputation'] ?? 0.0).toDouble(),
      totalTransactions: map['totalTransactions'] ?? 0,
      isVerified: map['isVerified'] ?? false,
    );
  }

  User copyWith({String? name, String? address, String? profileImageUrl}) {
    return User(
      id: id,
      name: name ?? this.name,
      email: email,
      address: address ?? this.address,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      reputation: reputation,
      totalTransactions: totalTransactions,
      isVerified: isVerified,
    );
  }
}
