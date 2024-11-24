import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { DirectusService } from '../services/directus.service';
import { Router } from '@angular/router';

interface BookmarkedItem {
  id: string;
  title: string;
  thumbnail: string;
  type: 'Movies' | 'TV_Shows';
}

@Component({
  selector: 'app-bookmarks',
  templateUrl: './bookmarks.page.html',
  styleUrls: ['./bookmarks.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class BookmarksPage implements OnInit {
  bookmarkedItems: BookmarkedItem[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private directus: DirectusService, private router: Router) {}

  ngOnInit() {
    this.loadBookmarks();
  }

  async loadBookmarks() {
    this.isLoading = true;
    this.error = null;

    try {
      const userId = await this.directus.getCurrentUser().toPromise().then(user => user.id);
      const movieBookmarks = await this.directus.getBookmarkedItems(userId, 'Movies').toPromise() || [];
      const tvShowBookmarks = await this.directus.getBookmarkedItems(userId, 'TV_Shows').toPromise() || [];

      const movieItems = await this.fetchBookmarkedItems(movieBookmarks, 'Movies');
      const tvShowItems = await this.fetchBookmarkedItems(tvShowBookmarks, 'TV_Shows');

      this.bookmarkedItems = [...movieItems, ...tvShowItems];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.error = 'Failed to load bookmarks. Please try again later.';
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchBookmarkedItems(ids: string[], type: 'Movies' | 'TV_Shows'): Promise<BookmarkedItem[]> {
    const items = await Promise.all(
      ids.map(id => this.directus.getItemById(type, id).toPromise())
    );
    return items.map(item => {
      if (item && typeof item === 'object' && 'id' in item && 'title' in item && 'thumbnail' in item) {
        return {
          id: item.id as string,
          title: item.title as string,
          thumbnail: item.thumbnail as string,
          type: type
        };
      } else {
        console.error('Invalid item structure:', item);
        return null;
      }
    }).filter((item): item is BookmarkedItem => item !== null);
  }

  removeBookmark(item: BookmarkedItem) {
    this.directus.getCurrentUser().subscribe(
      async (user) => {
        try {
          await this.directus.removeBookmark(item.id, user.id, item.type).toPromise();
          this.bookmarkedItems = this.bookmarkedItems.filter(i => i.id !== item.id);
        } catch (error) {
          console.error('Error removing bookmark:', error);
          // Optionally, show an error message to the user
        }
      },
      (error) => {
        console.error('Error getting current user:', error);
        // Optionally, show an error message to the user
      }
    );
  }

  openDetail(item: BookmarkedItem) {
    this.router.navigate(['/detail', item.type, item.id]);
  }

  getThumbnailUrl(fileId: string): string {
    return this.directus.getAssetUrl(fileId);
  }

  goToContent() {
    this.router.navigate(['content'])
  }
}