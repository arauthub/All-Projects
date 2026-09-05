import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventoryPart } from '../models/wagtail';

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private apiUrl = 'http://localhost:8000/api/v2/inventory/';

  constructor(private http: HttpClient) { }

  getParts(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getPart(id: number): Observable<InventoryPart> {
    return this.http.get<InventoryPart>(`${this.apiUrl}${id}/`);
  }

  updateStock(id: number, quantity: number, type: string): Observable<any> {
    return this.http.post(`${this.apiUrl}transactions/`, {
      part: id,
      quantity: quantity,
      transaction_type: type
    });
  }
}
