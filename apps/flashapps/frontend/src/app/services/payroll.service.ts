import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Payroll } from '../models/wagtail';

@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  private apiUrl = 'http://localhost:8000/api/v2/payroll/';

  constructor(private http: HttpClient) { }

  getPayrollRecords(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getSalaryStructure(mechanicId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}structures/${mechanicId}/`);
  }
}
