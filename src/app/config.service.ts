import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface AppConfig {
  apiUrl: string;
  stripePublicKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config: AppConfig | null = null;

  constructor(private http: HttpClient) {}

  loadConfig(): Observable<AppConfig> {
    if (this.config) {
      return of(this.config);
    }

    return this.http.get<AppConfig>('/assets/config.json').pipe(
      tap(config => this.config = config),
      catchError(error => {
        console.error('Failed to load config, using defaults:', error);
        // Return default configuration
        this.config = {
          apiUrl: '/api/',
          stripePublicKey: 'pk_test_51SuRgi2KcqO1GUZP8kxeFzorQlkClPbvh1c8AJpJn9Uer3IAGCr88ZjX7ukVTL1KMIBGyn7XGsuBreuacb1FdjuF00PDencxcz'
        };
        return of(this.config);
      })
    );
  }

  getConfig(): AppConfig | null {
    return this.config;
  }

  getApiUrl(): string {
    return this.config?.apiUrl || '/api/';
  }

  getStripePublicKey(): string {
    return this.config?.stripePublicKey || 'pk_test_51SuRgi2KcqO1GUZP8kxeFzorQlkClPbvh1c8AJpJn9Uer3IAGCr88ZjX7ukVTL1KMIBGyn7XGsuBreuacb1FdjuF00PDencxcz';
  }
}