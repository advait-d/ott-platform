import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { DirectusService } from '../services/directus.service';
import { HttpClientModule } from '@angular/common/http';
import { BehaviorSubject, combineLatest, Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface MediaItem {
  id: string;
  title: string;
  thumbnail: string;
  // Add other properties as needed
}

@Component({
  selector: 'app-content',
  templateUrl: './content.page.html',
  styleUrls: ['./content.page.scss'],
  standalone: true,
  imports: [IonicModule, HttpClientModule, CommonModule, FormsModule],
})
export class ContentPage implements OnInit {
  tvShows: MediaItem[] = [];
  movies: MediaItem[] = [];
  bookmarks: Set<string> = new Set();
  isLoading = false;
  error: string | null = null;
  searchQuery = '';

  private tvShowsSubject = new BehaviorSubject<MediaItem[]>([]);
  private moviesSubject = new BehaviorSubject<MediaItem[]>([]);
  private searchQuerySubject = new BehaviorSubject<string>('');

  filteredTvShows$ = combineLatest([
    this.tvShowsSubject,
    this.searchQuerySubject
  ]).pipe(
    map(([tvShows, query]) => this.filterItems(tvShows, query))
  );

  filteredMovies$ = combineLatest([
    this.moviesSubject,
    this.searchQuerySubject
  ]).pipe(
    map(([movies, query]) => this.filterItems(movies, query))
  );

  constructor(private directus: DirectusService, private router: Router) {}

  ngOnInit() {
    this.loadContent();
  }

  async loadContent() {
    this.loadTvShows();
    this.loadMovies();
    this.loadBookmarks();
  }

  handleSearch(event: CustomEvent) {
    const query = (event.target as HTMLIonSearchbarElement).value?.toLowerCase().trim() ?? '';
    this.searchQuerySubject.next(query);
  }

  private filterItems(items: MediaItem[], query: string): MediaItem[] {
    return items.filter(item => 
      item.title.toLowerCase().includes(query)
    );
  }
  
  private loadTvShows() {
    this.isLoading = true;
    this.error = null;

    this.directus.getItems<MediaItem>('TV_Shows').subscribe({
      next: (shows) => {
        this.tvShows = shows;
        this.tvShowsSubject.next(shows);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load TV shows. Please try again later.';
        this.isLoading = false;
        console.error('Error loading TV shows:', error);
      },
    });
  }

  private loadMovies() {
    this.isLoading = true;
    this.error = null;

    this.directus.getItems<MediaItem>('Movies').subscribe({
      next: (movies) => {
        this.movies = movies;
        this.moviesSubject.next(movies);
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load Movies. Please try again later.';
        this.isLoading = false;
        console.error('Error loading Movies:', error);
      },
    });
  }

  private loadBookmarks() {
    this.directus.getCurrentUser().subscribe(
      (user) => {
        this.directus.getBookmarkedItems(user.id, 'Movies').subscribe(
          (movieBookmarks) => {
            movieBookmarks.forEach((id) => this.bookmarks.add(id));
          },
          (error) => {
            console.error('Error loading movie bookmarks:', error);
          }
        );

        this.directus.getBookmarkedItems(user.id, 'TV_Shows').subscribe(
          (tvShowBookmarks) => {
            tvShowBookmarks.forEach((id) => this.bookmarks.add(id));
          },
          (error) => {
            console.error('Error loading TV show bookmarks:', error);
          }
        );
      },
      (error) => {
        console.error('Error getting current user:', error);
      }
    );
  }

  toggleBookmark(event: Event, item: MediaItem) {
    event.stopPropagation();
    this.directus.getCurrentUser().subscribe(
      (user) => {
        const type = this.tvShows.includes(item) ? 'TV_Shows' : 'Movies';
        if (this.bookmarks.has(item.id)) {
          this.directus.removeBookmark(item.id, user.id, type).subscribe(
            () => {
              this.bookmarks.delete(item.id);
              console.log('Bookmark Removed');
            },
            (error) => {
              console.error('Error removing bookmark:', error);
            }
          );
        } else {
          this.directus.createBookmark(item.id, type, user.id).subscribe(
            () => {
              this.bookmarks.add(item.id);
            },
            (error) => {
              console.error('Error creating bookmark:', error);
            }
          );
        }
      },
      (error) => {
        console.error('Error getting current user:', error);
      }
    );
  }

  isBookmarked(item: MediaItem): boolean {
    return this.bookmarks.has(item.id);
  }

  getThumbnailUrl(fileId: string): string {
    return this.directus.getAssetUrl(fileId);
  }

  openDetail(item: MediaItem, type: 'Movies' | 'TV_Shows') {
    this.router.navigate(['/detail', type, item.id]);
  }

  goToBookmarks() {
    this.router.navigate(['bookmarks']);
  }

  goToProfile() {
    this.router.navigate(['profile']);
  }

  logout() {
    this.directus.logout().subscribe(
      () => {
        this.router.navigate(['login']);
      },
      (error) => {
        console.error('Error during logout:', error);
      }
    );
  }
}
