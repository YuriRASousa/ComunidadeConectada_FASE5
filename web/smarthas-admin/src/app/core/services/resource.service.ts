import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NewResource, Page, Resource } from '../models/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ResourceService {
  constructor(private http: HttpClient) {}

  list(page = 0, size = 20): Observable<Page<Resource>> {
    return this.http.get<Page<Resource>>(`${environment.apiUrl}/resources`, {
      params: { page, size },
    });
  }

  create(resource: NewResource): Observable<Resource> {
    return this.http.post<Resource>(`${environment.apiUrl}/resources`, resource);
  }

  update(id: string, resource: Partial<NewResource>): Observable<Resource> {
    return this.http.put<Resource>(`${environment.apiUrl}/resources/${id}`, resource);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/resources/${id}`);
  }
}
