import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { WagtailPage } from '../models/wagtail';

@Injectable({
  providedIn: 'root',
})
export class WagtailService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8000/api/v2/';

  getPage(id: number | string): Observable<WagtailPage> {
    return this.http.get<WagtailPage>(`${this.apiUrl}pages/${id}/?format=json`);
  }

  getPages(): Observable<any> {
    return this.http.get(`${this.apiUrl}pages/`);
  }

  getSnippet(id: number | string): Observable<any> {
    return this.http.get(`${this.apiUrl}snippets/${id}/?format=json`);
  }

  getSnippets(): Observable<any> {
    return this.http.get(`${this.apiUrl}snippets/?format=json`);
  }
}
