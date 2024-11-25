import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { DirectusService } from '../services/directus.service'; // Custom service to interact with Directus
import { HttpClientModule, HttpHeaders } from '@angular/common/http';

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
  tvShows: any[] = [];
  movies: any[] = [];
  bookmarks: Set<string> = new Set();
  isLoading = false;
  error: string | null = null;

  constructor(private directus: DirectusService, private router: Router) {}

  ngOnInit() {
    this.loadContent();
  }

  async loadContent() {
    this.loadTvShows();
    this.loadMovies();
    this.loadBookmarks();
  }

  private loadTvShows() {
    this.isLoading = true;
    this.error = null;

    this.directus.getItems('TV_Shows').subscribe({
      next: (shows) => {
        this.tvShows = shows;
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

    this.directus.getItems('Movies').subscribe({
      next: (movies) => {
        this.movies = movies;
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

  toggleBookmark(event: Event, item: any) {
    event.stopPropagation();
    this.directus.getCurrentUser().subscribe(
      (user) => {
        const type = this.tvShows.includes(item) ? 'TV_Shows' : 'Movies';
        if (this.bookmarks.has(item.id)) {
          this.directus.removeBookmark(item.id, user.id, type).subscribe(
            () => {
              this.bookmarks.delete(item.id);
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

  isBookmarked(item: any): boolean {
    return this.bookmarks.has(item.id);
  }

  getThumbnailUrl(fileId: string): string {
    // Consider moving this to an environment configuration
    const apiToken = 'cWk8gKmTBYYdnx0mN2ZpUJawW6ybEDt3';
    return `http://localhost:8055/assets/${fileId}?access_token=${apiToken}`;
  }

  openDetail(item: MediaItem, type: 'Movies' | 'TV_Shows') {
    this.router.navigate(['/detail', type, item.id]);
  }

  goToBookmarks() {
    this.router.navigate(['bookmarks']);
  }

  logout() {
    this.directus.logout();
    this.router.navigate(['login']);
  }
}
