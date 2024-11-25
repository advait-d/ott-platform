import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError, mergeMap, finalize } from 'rxjs/operators';
import { Router } from '@angular/router';

interface AuthResponse {
  data: {
    access_token: string;
    refresh_token: string;
    expires: number;
  };
}

interface User {
  email: string;
  password: string;
  first_name?: string;
}

interface Bookmark {
  id: string;
  user_id: string;
  movie_id?: string;
  tv_show_id?: string;
}

interface BookmarkCreatePayload {
  user_id: string;
  movie_id?: string;
  tv_show_id?: string;
}

interface DirectusResponse<T> {
  data: T[];
}

@Injectable({
  providedIn: 'root',
})
export class DirectusService {
  private readonly directusUrl = 'http://localhost:8055';
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  private readonly errorMessageSubject = new BehaviorSubject<string | null>(
    null
  );
  //private accessToken = 'cWk8gKmTBYYdnx0mN2ZpUJawW6ybEDt3'; // Replace with your Directus access token

  // Expose the token as an observable for components that need to react to auth state
  public accessToken$ = this.accessTokenSubject.asObservable();
  errorMessage: any;

  constructor(private http: HttpClient, private router: Router) {
    // Initialize token from localStorage if it exists
    const savedToken = localStorage.getItem('directus_token');
    if (savedToken) {
      this.accessTokenSubject.next(savedToken);
    }
  }

  getCurrentUser(): Observable<any> {
    return this.http
      .get<{ data: any }>(`${this.directusUrl}/users/me`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error('Error fetching current user:', error);
          return throwError(() => new Error('Failed to fetch current user'));
        })
      );
  }

  // Auth Methods
  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.directusUrl}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response) => {
          const token = response.data.access_token;
          this.setAccessToken(token);
        }),
        catchError((error) => {
          console.error('Login error:', error);
          return throwError(() => new Error('Login failed'));
        })
      );
  }

  logout() {
    // Return the observable so the caller can handle it
    return this.http.post<void>(`${this.directusUrl}/auth/logout`, null).pipe(
      tap(() => {
        // Clear auth state
        this.accessTokenSubject.next(null);
        localStorage.removeItem('accessToken');

        // Clear any stored user data
        this.clearUserData();
      }),
      catchError((error) => {
        // Log the error but proceed with local cleanup
        console.error('Logout API error:', error);

        // Still clear local state even if API call fails
        this.accessTokenSubject.next(null);
        localStorage.removeItem('accessToken');
        this.clearUserData();

        throw error;
      }),
      finalize(() => {
        // Always navigate away, regardless of API success/failure
        this.router.navigate(['/login']);
      })
    );
  }

  private clearUserData() {
    localStorage.removeItem('userData');
    this.errorMessageSubject.next(null);
  }

  register(user: User): Observable<any> {
    return this.http
      .post(`${this.directusUrl}/users`, {
        email: user.email,
        password: user.password,
        first_name: user.first_name,
        role: 'f9e46dbd-ef75-4284-882b-663e64e368bc',
      })
      .pipe(
        catchError((error) => {
          console.error('Registration error:', error);
          return throwError(
            () =>
              new Error(
                error.error?.errors?.[0]?.message || 'Registration failed'
              )
          );
        })
      );
  }

  /**
   * Token Management
   * Set the access token for authentication.
   * @param token Directus API access token
   */
  private setAccessToken(token: string): void {
    localStorage.setItem('directus_token', token);
    this.accessTokenSubject.next(token);
  }

  /**
   * Get headers for Directus API requests.
   */
  private getHeaders(): HttpHeaders {
    const token = this.accessTokenSubject.value;
    let headers = new HttpHeaders().set('Content-Type', 'application/json');

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  // Fetch a single item from a collection by ID
  async getItem(collection: string, id: string): Promise<any> {
    const url = `${this.directusUrl}/items/${collection}/${id}`;
    const headers = this.getHeaders();

    try {
      return await this.http.get(url, { headers }).toPromise();
    } catch (error) {
      console.error('Error fetching item:', error);
      throw error;
    }
  }

  // CRUD Operations
  getItems<T>(collection: string): Observable<T[]> {
    return this.http
      .get<{ data: T[] }>(`${this.directusUrl}/items/${collection}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error fetching ${collection}:`, error);
          return throwError(() => new Error(`Failed to fetch ${collection}`));
        })
      );
  }

  /*
   * Fetch all items from a Directus collection
   * @param collection The name of the Directus collection
   * @returns Observable containing the list of items
   */
  getCollectionItems(collection: string) {
    const headers = this.getHeaders();

    return this.http.get(`${this.directusUrl}/items/${collection}`, {
      headers,
    });
  }

  /**
   * Fetch items from a Directus collection.
   * @param collection The name of the Directus collection
   * @returns Observable containing the list of items
   */
  fetchItems(collection: string): Promise<any[]> {
    const url = `${this.directusUrl}/items/${collection}`;
    return this.http
      .get<any>(url, { headers: this.getHeaders() })
      .toPromise()
      .then((response) => response.data);
  }

  /**
   * Fetch a single item by ID from a Directus collection.
   * @param collection The name of the Directus collection
   * @param id The ID of the item
   * @returns Observable containing the item data
   */
  getItemById<T>(collection: string, id: string): Observable<T> {
    return this.http
      .get<{ data: T }>(`${this.directusUrl}/items/${collection}/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error fetching ${collection} item:`, error);
          return throwError(
            () => new Error(`Failed to fetch ${collection} item`)
          );
        })
      );
  }

  /**
   * Add a new item to a Directus collection.
   * @param collection The name of the Directus collection
   * @param data The data to be added
   * @returns Observable containing the created item data
   */

  createItem<T>(collection: string, data: Partial<T>): Observable<T> {
    return this.http
      .post<{ data: T }>(`${this.directusUrl}/items/${collection}`, data, {
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error creating ${collection} item:`, error);
          return throwError(
            () => new Error(`Failed to create ${collection} item`)
          );
        })
      );
  }

  updateItem<T>(
    collection: string,
    id: string,
    data: Partial<T>
  ): Observable<T> {
    return this.http
      .patch<{ data: T }>(
        `${this.directusUrl}/items/${collection}/${id}`,
        data,
        { headers: this.getHeaders() }
      )
      .pipe(
        map((response) => response.data),
        catchError((error) => {
          console.error(`Error updating ${collection} item:`, error);
          return throwError(
            () => new Error(`Failed to update ${collection} item`)
          );
        })
      );
  }

  deleteItem(collection: string, id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.directusUrl}/items/${collection}/${id}`, {
        headers: this.getHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(`Error deleting ${collection} item:`, error);
          return throwError(
            () => new Error(`Failed to delete ${collection} item`)
          );
        })
      );
  }

  // Add method to get user's bookmarks
  getUserBookmarks(
    userId: string,
    type: 'Movies' | 'TV_Shows'
  ): Observable<Bookmark[]> {
    const filter = {
      user_id: { _eq: userId },
      ...(type === 'Movies'
        ? { movie_id: { _nnull: true } }
        : { tv_show_id: { _nnull: true } }),
    };

    const params = new HttpParams().set('filter', JSON.stringify(filter));

    return this.http
      .get<DirectusResponse<Bookmark>>(`${this.directusUrl}/items/Bookmarks`, {
        params,
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => response.data || []),
        catchError((error) => {
          console.error('Error fetching bookmarks:', error);
          return throwError(() => new Error('Failed to fetch bookmarks'));
        })
      );
  }

  // Add method to create bookmark
  createBookmark(
    mediaId: string,
    mediaType: 'Movies' | 'TV_Shows',
    userId: string
  ): Observable<any> {
    const payload: BookmarkCreatePayload = {
      user_id: userId,
      ...(mediaType === 'Movies'
        ? { movie_id: mediaId }
        : { tv_show_id: mediaId }),
    };

    console.log('Creating bookmark with payload', payload);

    return this.http.post(`${this.directusUrl}/items/Bookmarks`, payload, {
      headers: this.getHeaders(),
    });
  }

  // Remove a bookmark
  removeBookmark(
    itemId: string,
    userId: string,
    type: 'Movies' | 'TV_Shows'
  ): Observable<any> {
    // Construct the filter based on type
    const filter = {
      user_id: { _eq: userId },
      ...(type === 'Movies'
        ? { movie_id: { _eq: itemId } }
        : { tv_show_id: { _eq: itemId } }),
    };

    const params = new HttpParams().set('filter', JSON.stringify(filter));

    return this.http
      .get<any>(`${this.directusUrl}/items/Bookmarks`, {
        params,
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => {
          const bookmarks = response.data || [];
          if (bookmarks.length > 0) {
            return this.http
              .delete(
                `${this.directusUrl}/items/Bookmarks/${bookmarks[0].id}`,
                { headers: this.getHeaders() }
              )
              .pipe(
                catchError((error) => {
                  console.error('Error deleting bookmark:', error);
                  return throwError(
                    () => new Error('Failed to delete bookmark')
                  );
                })
              );
          }
          return throwError(() => new Error('No bookmark found'));
        }),
        catchError((error) => {
          console.error('Error finding bookmark:', error);
          return throwError(() => new Error('Failed to find bookmark'));
        }),
        mergeMap((response) => response) // Flatten the nested Observable
      );
  }

  // Add method to check if item is bookmarked
  isItemBookmarked(
    mediaId: string,
    type: 'Movies' | 'TV_Shows',
    userId: string
  ): Observable<boolean> {
    const filter = {
      user_id: { _eq: userId },
      ...(type === 'Movies'
        ? { movie_id: { _eq: mediaId } }
        : { tv_show_id: { _eq: mediaId } }),
    };

    const params = new HttpParams().set('filter', JSON.stringify(filter));

    return this.http
      .get<DirectusResponse<Bookmark>>(`${this.directusUrl}/items/Bookmarks`, {
        params,
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => (response.data || []).length > 0),
        catchError((error) => {
          console.error('Error checking bookmark status:', error);
          return throwError(() => new Error('Failed to check bookmark status'));
        })
      );
  }

  // Get all bookmarked items for a user
  getBookmarkedItems(
    userId: string,
    type: 'Movies' | 'TV_Shows'
  ): Observable<string[]> {
    const filter = {
      user_id: { _eq: userId },
      ...(type === 'Movies'
        ? { movie_id: { _nnull: true } }
        : { tv_show_id: { _nnull: true } }),
    };

    const params = new HttpParams().set('filter', JSON.stringify(filter));

    return this.http
      .get<DirectusResponse<Bookmark>>(`${this.directusUrl}/items/Bookmarks`, {
        params,
        headers: this.getHeaders(),
      })
      .pipe(
        map((response) => {
          const bookmarks = response.data || [];
          return bookmarks.map((bookmark: Bookmark) =>
            type === 'Movies' ? bookmark.movie_id! : bookmark.tv_show_id!
          );
        }),
        catchError((error) => {
          console.error('Error fetching bookmarked items:', error);
          return throwError(
            () => new Error('Failed to fetch bookmarked items')
          );
        })
      );
  }

  getAssetUrl(fileId: string): string {
    return `${this.directusUrl}/assets/${fileId}`;
  }
}
