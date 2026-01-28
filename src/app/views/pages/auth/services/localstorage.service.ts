import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
const TOKEN = 'jwtToken';

@Injectable({
  providedIn: 'root'
})
export class LocalstorageService {
  token$: BehaviorSubject<string | null> = new BehaviorSubject(this.getToken());

  constructor() { }
  setToken(data: any) {
    localStorage.setItem(TOKEN, data);
    this.token$.next(data);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN);
  }

  removeToken() {
    localStorage.removeItem(TOKEN);
    this.token$.next(null);
  }
}
