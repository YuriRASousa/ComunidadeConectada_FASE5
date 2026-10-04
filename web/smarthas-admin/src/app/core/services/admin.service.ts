import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStats, Alerta, Emprestimo, ResumoUsuario, RotinaResultado } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`);
  }

  /** Emprestimos solicitados ou ativos, ordenados pelo vencimento. */
  getEmprestimos(): Observable<Emprestimo[]> {
    return this.http.get<Emprestimo[]>(`${environment.apiUrl}/admin/emprestimos`);
  }

  /** Alertas abertos por PRC_SH_DETECTA_ATRASOS. */
  getAlertas(): Observable<Alerta[]> {
    return this.http.get<Alerta[]>(`${environment.apiUrl}/admin/alertas`);
  }

  resolverAlerta(id: string): Observable<void> {
    return this.http.post<void>(`${environment.apiUrl}/admin/alertas/${id}/resolver`, {});
  }

  /** Dispara a rotina de vigilancia (CURSOR sobre os emprestimos vencidos). */
  detectarAtrasos(): Observable<RotinaResultado> {
    return this.http.post<RotinaResultado>(
      `${environment.apiUrl}/admin/rotinas/detectar-atrasos`,
      {}
    );
  }

  /** Recarrega a tabela de resumo do mes (BULK COLLECT + FORALL). */
  gerarResumoMensal(anoMes?: number): Observable<RotinaResultado> {
    const params = anoMes ? new HttpParams().set('anoMes', anoMes) : undefined;
    return this.http.post<RotinaResultado>(
      `${environment.apiUrl}/admin/rotinas/resumo-mensal`,
      {},
      { params }
    );
  }

  getResumoMensal(anoMes?: number): Observable<ResumoUsuario[]> {
    const params = anoMes ? new HttpParams().set('anoMes', anoMes) : undefined;
    return this.http.get<ResumoUsuario[]>(`${environment.apiUrl}/admin/resumo-mensal`, { params });
  }
}
