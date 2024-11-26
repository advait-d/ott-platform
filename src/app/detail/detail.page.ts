import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DirectusService } from '../services/directus.service';
import { IonicModule } from '@ionic/angular';
import { SafeUrlPipe } from '../pipes/safe-url.pipe';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { Location } from '@angular/common';

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
  isCurrentlyBookmarked: boolean = false;
  private userId: string | null = null;
  error: string | null = null;
  loading = true;
  private subscription: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private directus: DirectusService,
    private location: Location,
    private router: Router
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      const id = params['id'];
      const type = params['type'];

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

      this.loadContentDetails();
      this.loadUserData();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadUserData() {
    this.directus.getCurrentUser().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.checkBookmarkStatus();
      },
      error: (error) => {
        console.error('Error getting current user:', error);
      },
    });
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

  loadContentDetails() {
    this.loading = true;
    this.error = null;

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

  getYouTubeEmbedUrl(mediaURL: string): string {
    try {
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

  goBack() {
    this.router.navigate(['content'])
    //this.location.back();
  }

  isBookmarked(): boolean {
    return this.isCurrentlyBookmarked;
  }

  favoriteMedia() {
    if (!this.mediaDetails || !this.userId) return;

    if (this.isCurrentlyBookmarked) {
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

  logout() {
    this.directus.logout();
    this.router.navigate(['login']);
  }
}
