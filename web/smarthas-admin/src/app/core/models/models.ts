export type UserRole = 'USER' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  address: string;
  profileImageUrl?: string | null;
  reputation: number;
  totalTransactions: number;
  isVerified: boolean;
  role: UserRole;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export type ResourceCategory =
  | 'FERRAMENTAS'
  | 'SAUDE'
  | 'EDUCACAO'
  | 'ALIMENTOS'
  | 'ELETRONICOS'
  | 'OUTROS';

export type ResourceCondition = 'NOVO' | 'EXCELENTE' | 'BOM' | 'REGULAR';

export type ResourceType = 'EMPRESTIMO' | 'TROCA' | 'DOACAO';

export type ResourceAvailability = 'DISPONIVEL' | 'RESERVADO' | 'INDISPONIVEL';

export interface Resource {
  id: string;
  title: string;
  description: string;
  category: ResourceCategory;
  condition: ResourceCondition;
  type: ResourceType;
  availability: ResourceAvailability;
  imageUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  offerantId: string;
  offerantName: string;
  createdAt: string;
  updatedAt: string;
}

export interface NewResource {
  title: string;
  description: string;
  category: ResourceCategory;
  condition: ResourceCondition;
  type: ResourceType;
}

export interface AdminStats {
  totalUsers: number;
  totalResources: number;
  totalMessages: number;
  resourcesByCategory: Record<string, number>;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
}

// ---------------------------------------------------------------------
// Fase 6: tudo abaixo e alimentado pelas procedures e functions PL/SQL.
// O painel nao calcula nada disso, apenas le o que o Oracle gravou.
// ---------------------------------------------------------------------

export type LoanStatus = 'SOLICITADO' | 'ATIVO' | 'DEVOLVIDO' | 'CANCELADO';

export interface Emprestimo {
  id: string;
  resourceId: string;
  resourceTitle: string;
  borrowerId: string;
  borrowerName: string;
  ownerName: string;
  requestedAt: string | null;
  dueAt: string | null;
  returnedAt: string | null;
  status: LoanStatus;
  daysLate: number;
}

export interface Alerta {
  id: string;
  type: string;
  referenceId: string | null;
  severity: 'BAIXA' | 'MEDIA' | 'ALTA';
  message: string;
  createdAt: string | null;
  resolved: boolean;
}

export interface ResumoUsuario {
  userId: string;
  userName: string;
  yearMonth: number;
  publishedResources: number;
  lentOut: number;
  borrowed: number;
  lateReturns: number;
  circularityIndex: number;
  reputation: number;
}

export interface RotinaResultado {
  routine: string;
  affectedRows: number;
  message: string;
}
