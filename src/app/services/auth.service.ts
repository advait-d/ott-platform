import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8055'; // Replace with your Directus API URL

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    const payload = {
      email,
      password,
    };
    return this.http.post(`${this.apiUrl}/auth/login`, payload);
  }

  register(user: { email: string; password: string; first_name: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users`, user);
  }
}
