import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DirectusService } from '../services/directus.service';
import { IonicModule } from '@ionic/angular';
import { SafeUrlPipe } from '../pipes/safe-url.pipe';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';
import { Share } from '@capacitor/share';

interface MediaItem {
  id: string;
  status: string;
  sort: null;
  user_created: string;
  date_created: string;
  user_updated: string;
  date_updated: string;
  title: string;
  description: string;
  genre: string;
  thumbnail: string;
  mediaURL: string;
}

const COLLECTION_TYPES = {
  Movies: 'Movies',
  TV_Shows: 'TV_Shows',
} as const;

type CollectionType = (typeof COLLECTION_TYPES)[keyof typeof COLLECTION_TYPES];

@Component({
  selector: 'app-detail',
  templateUrl: './detail.page.html',
  styleUrls: ['./detail.page.scss'],
  standalone: true,
  imports: [IonicModule, SafeUrlPipe, CommonModule],
})
export class DetailPage implements OnInit, OnDestroy {
  mediaId!: string;
  mediaType!: CollectionType;
  mediaDetails: MediaItem | null = null;
  isCurrentlyBookmarked: boolean = false; // Track bookmark state
  private userId: string | null = null; // Store user ID
  error: string | null = null;
  loading = true;
  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private directus: DirectusService,
    private location: Location
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const type = this.route.snapshot.paramMap.get('type');

    if (!id) {
      this.error = 'No ID provided';
      this.loading = false;
      return;
    }

    if (!this.isValidCollectionType(type)) {
      this.error = 'Invalid media type';
      this.loading = false;
      return;
    }

    this.mediaId = id;
    this.mediaType = type;

    this.directus.getCurrentUser().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.checkBookmarkStatus();
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      },
    });

    this.loadContentDetails();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private checkBookmarkStatus() {
    if (!this.userId) return;

    this.directus
      .isItemBookmarked(this.mediaId, this.mediaType, this.userId)
      .subscribe({
        next: (isBookmarked) => {
          this.isCurrentlyBookmarked = isBookmarked;
        },
        error: (error) => {
          console.error('Error checking bookmark status:', error);
        },
      });
  }

  private isValidCollectionType(type: string | null): type is CollectionType {
    return type !== null && type in COLLECTION_TYPES;
  }

  async loadContentDetails() {
    this.loading = true;
    this.error = null;

    const collection = this.mediaType; // This will be 'Movies' or 'TV_Shows'

    this.subscription = this.directus
      .getItemById<MediaItem>(this.mediaType, this.mediaId)
      .subscribe({
        next: (data) => {
          this.mediaDetails = data;
          this.loading = false;
          console.log('Fetched media: ', this.mediaDetails);
        },
        error: (error) => {
          console.error('Error loading media details:', error);
          this.error = `Failed to load ${
            this.mediaType === 'Movies' ? 'movie' : 'TV show'
          } details`;
          this.loading = false;
        },
      });
  }

  /*
      const response = await this.directus.getItemById<MediaItem>(this.contentType, this.contentId);
      if (response?.data) {
        this.contentDetails = response;
        console.log('Fetched content: ', this.contentDetails);
      } else {
        console.error('No content found');
      }
    } catch (error: any) {
      console.error('Error loading content details:', error);
      if (error.status === 403) {
        console.error('Permission denied. Please check your access token and permissions.');
      }
    }
      */

  getYouTubeEmbedUrl(mediaURL: string): string {
    try {
      // Handle both youtube.com and youtu.be URLs
      let videoId = '';
      if (mediaURL.includes('youtu.be')) {
        videoId = mediaURL.split('youtu.be/')[1];
      } else {
        const url = new URL(mediaURL);
        videoId = url.searchParams.get('v') || '';
      }
      return `https://www.youtube.com/embed/${videoId}`;
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
      return '';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  async shareMedia() {
    if (this.mediaDetails) {
      try {
        await Share.share({
          title: this.mediaDetails.title,
          text: this.mediaDetails.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  }

  goBack() {
    this.location.back();
  }

  isBookmarked(): boolean {
    return this.isCurrentlyBookmarked;
  }

  // Handle favorite/unfavorite action
  favoriteMedia() {
    if (!this.mediaDetails || !this.userId) return;

    if (this.isCurrentlyBookmarked) {
      // Remove bookmark
      this.directus
        .removeBookmark(this.mediaId, this.userId, this.mediaType)
        .subscribe({
          next: () => {
            console.log('Bookmark removed');
            this.isCurrentlyBookmarked = false;
          },
          error: (error) => {
            console.error('Error removing bookmark:', error);
          },
        });
    } else {
      // Add bookmark
      this.directus
        .createBookmark(this.mediaId, this.mediaType, this.userId)
        .subscribe({
          next: () => {
            console.log('Bookmark added');
            this.isCurrentlyBookmarked = true;
          },
          error: (error) => {
            console.error('Error adding bookmark:', error);
          },
        });
    }
  }
}
