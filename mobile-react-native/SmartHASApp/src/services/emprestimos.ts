import { api } from '../config/api';

/**
 * Empréstimos (Fase 6).
 *
 * Cada função aqui termina em uma procedure ou function PL/SQL no Oracle:
 * o app não decide se o empréstimo é válido, só mostra a resposta que o
 * banco devolveu. Por isso as mensagens de erro exibidas na tela são as
 * mesmas escritas dentro das procedures.
 */

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
  status: string;
  daysLate: number;
}

export interface ResultadoProcedure {
  id: string | null;
  message: string;
}

export function emprestimoFromJson(json: any): Emprestimo {
  return {
    id: String(json.id),
    resourceId: String(json.resourceId),
    resourceTitle: json.resourceTitle,
    borrowerId: String(json.borrowerId),
    borrowerName: json.borrowerName,
    ownerName: json.ownerName,
    requestedAt: json.requestedAt ?? null,
    dueAt: json.dueAt ?? null,
    returnedAt: json.returnedAt ?? null,
    status: json.status,
    daysLate: Number(json.daysLate ?? 0),
  };
}

/** POST /api/emprestimos -> PRC_SH_REGISTRA_EMPRESTIMO */
export async function solicitarEmprestimo(resourceId: string, days = 7): Promise<ResultadoProcedure> {
  return api.post('/emprestimos', { resourceId, days }, true);
}

/** POST /api/emprestimos/{id}/devolucao -> PRC_SH_REGISTRA_DEVOLUCAO */
export async function registrarDevolucao(
  emprestimoId: string,
  rating?: number,
  comment?: string
): Promise<ResultadoProcedure> {
  return api.post(`/emprestimos/${emprestimoId}/devolucao`, { rating, comment }, true);
}

/** GET /api/emprestimos/meus */
export async function meusEmprestimos(): Promise<Emprestimo[]> {
  const resposta = await api.get('/emprestimos/meus', true);
  return (resposta ?? []).map(emprestimoFromJson);
}

/** GET /api/emprestimos/ficha/{id} -> FN_SH_FICHA_RECURSO */
export async function fichaDoRecurso(resourceId: string): Promise<string> {
  const resposta = await api.get(`/emprestimos/ficha/${resourceId}`, true);
  return resposta?.ficha ?? '';
}

/** GET /api/emprestimos/indice-circularidade -> FN_SH_INDICE_CIRCULARIDADE */
export async function indiceCircularidade(): Promise<{ anoMes: number; indiceCircularidade: number }> {
  return api.get('/emprestimos/indice-circularidade', true);
}

export function formatarData(iso: string | null): string {
  if (!iso) return '-';
  const data = new Date(iso);
  return data.toLocaleDateString('pt-BR');
}
