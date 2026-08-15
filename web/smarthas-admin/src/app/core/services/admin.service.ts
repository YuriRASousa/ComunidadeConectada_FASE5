import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdminStats } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private http: HttpClient) {}

  getStats(): Observable<AdminStats> {
    return this.http.get<AdminStats>(`${environment.apiUrl}/admin/stats`);
  }
}
