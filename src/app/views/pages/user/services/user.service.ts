import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { LocalstorageService } from '../../auth/services/localstorage.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private _http: HttpClient,
    private _localstorageService: LocalstorageService,
  ) { }

  getUser(): Observable<any> {
    return this._http.get<any>(`${environment.api}v1/auth/profile`);
  }

  // Add updateUser method
  updateUser(userId: number, userData: any): Observable<any> {
    const token = this._localstorageService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this._http.put<any>(`${environment.api}v1/users/${userId}`, userData, { headers });
  }
}