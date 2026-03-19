import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasSession());

  constructor(private http: HttpClient, private router: Router) {}

  private hasSession(): boolean {
    return !!localStorage.getItem('userId');
  }

  get isAuthenticated$(): Observable<boolean> {
    return this.isAuthenticatedSubject.asObservable();
  }

register(user: {username: string, email: string, password: string}): Observable<any> {
  return this.http.post(`${this.apiUrl}/register`, user, { withCredentials: true }).pipe(
    tap((response: any) => {
      if (response.success) {
        localStorage.setItem('userId', response.user.id);
        localStorage.setItem('username', response.user.username);
      }
      this.isAuthenticatedSubject.next(true);
    })
  );
}

  login(credentials: {email: string, password: string}): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials, { withCredentials: true }).pipe(
      tap((response: any) => {
        if (response.success) {
          localStorage.setItem('userId', response.user.id);
          localStorage.setItem('username', response.user.username);
        }
        this.isAuthenticatedSubject.next(true);
      })
    );
  }

  logout(): void {
    this.http.get(`${this.apiUrl}/logout`, { withCredentials: true }).subscribe({
      next: () => {
        localStorage.removeItem('userId');
        localStorage.removeItem('username');

        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
      },
      error: () => {
        this.isAuthenticatedSubject.next(false);
        this.router.navigate(['/login']);
      }
    });
  }
}
