// Traduz entre os rótulos em português usados na UI e os enums do backend
// Spring Boot (definidos em API_CONTRACT.md), nos dois sentidos. Mesma
// abordagem de lib/models/resource.dart no app Flutter original.
export const categoryToApi: Record<string, string> = {
  Ferramentas: 'FERRAMENTAS',
  Saúde: 'SAUDE',
  Educação: 'EDUCACAO',
  Alimentos: 'ALIMENTOS',
  Eletrônicos: 'ELETRONICOS',
  Outros: 'OUTROS',
};

export const conditionToApi: Record<string, string> = {
  Novo: 'NOVO',
  Excelente: 'EXCELENTE',
  Boa: 'BOM',
  Regular: 'REGULAR',
};

export const typeToApi: Record<string, string> = {
  Empréstimo: 'EMPRESTIMO',
  Troca: 'TROCA',
  Doação: 'DOACAO',
};

export const availabilityToApi: Record<string, string> = {
  Disponível: 'DISPONIVEL',
  Reservado: 'RESERVADO',
  Indisponível: 'INDISPONIVEL',
};

function invert(m: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(m).forEach(([k, v]) => (out[v] = k));
  return out;
}

export const categoryFromApi = invert(categoryToApi);
export const conditionFromApi = invert(conditionToApi);
export const typeFromApi = invert(typeToApi);
export const availabilityFromApi = invert(availabilityToApi);

export const categories = Object.keys(categoryToApi);
export const conditions = Object.keys(conditionToApi);
export const types = Object.keys(typeToApi);
export const availabilities = Object.keys(availabilityToApi);

export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  profileImageUrl?: string | null;
  reputation: number;
  totalTransactions: number;
  isVerified: boolean;
}

export function userFromMap(map: any): User {
  return {
    id: String(map.id),
    name: map.name,
    email: map.email,
    address: map.address ?? '',
    profileImageUrl: map.profileImageUrl ?? null,
    reputation: Number(map.reputation ?? 0),
    totalTransactions: Number(map.totalTransactions ?? 0),
    isVerified: Boolean(map.verified ?? map.isVerified ?? false),
  };
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: string; // rótulo PT-BR na UI
  condition: string;
  offerantId: string;
  imageUrl?: string | null;
  availability: string;
  type: string;
  latitude?: number | null;
  longitude?: number | null;
  offerantName: string;
}

export function resourceFromJson(json: any): Resource {
  return {
    id: String(json.id),
    title: json.title,
    description: json.description,
    category: categoryFromApi[json.category] ?? json.category,
    condition: conditionFromApi[json.condition] ?? json.condition,
    offerantId: String(json.offerantId),
    imageUrl: json.imageUrl ?? null,
    availability: availabilityFromApi[json.availability] ?? json.availability,
    type: typeFromApi[json.type] ?? json.type,
    latitude: json.latitude != null ? Number(json.latitude) : null,
    longitude: json.longitude != null ? Number(json.longitude) : null,
    offerantName: json.offerantName ?? 'Usuário',
  };
}

// Corpo enviado em POST /api/resources (a API preenche offerantId a
// partir do usuário autenticado pelo JWT).
export function resourceToCreateJson(r: Partial<Resource>): Record<string, any> {
  const body: Record<string, any> = {
    title: r.title,
    description: r.description,
    category: categoryToApi[r.category ?? ''] ?? r.category,
    condition: conditionToApi[r.condition ?? ''] ?? r.condition,
    availability: availabilityToApi[r.availability ?? 'Disponível'] ?? 'DISPONIVEL',
    type: typeToApi[r.type ?? ''] ?? r.type,
  };
  if (r.imageUrl) body.imageUrl = r.imageUrl;
  if (r.latitude != null) body.latitude = r.latitude;
  if (r.longitude != null) body.longitude = r.longitude;
  return body;
}

export interface Message {
  id: string;
  senderId: string;
  content: string;
  timestamp: string; // ISO
  resourceId?: string | null;
  isFromMe: boolean;
}

export function messageFromJson(json: any, currentUserId: string): Message {
  const senderId = String(json.senderId);
  return {
    id: String(json.id),
    senderId,
    content: json.content,
    timestamp: json.timestamp,
    resourceId: json.resourceId != null ? String(json.resourceId) : null,
    isFromMe: senderId === currentUserId,
  };
}
