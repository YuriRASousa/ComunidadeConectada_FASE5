import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page, User } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private http: HttpClient) {}

  list(page = 0, size = 20): Observable<Page<User>> {
    return this.http.get<Page<User>>(`${environment.apiUrl}/users`, {
      params: { page, size },
    });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`);
  }
}
