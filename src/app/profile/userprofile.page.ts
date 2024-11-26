import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DirectusService } from '../services/directus.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-userprofile',
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule],
  templateUrl: './userprofile.page.html',
  styleUrls: ['./userprofile.page.scss'],
})
export class UserProfilePage implements OnInit {
  // User profile properties
  userData: any = {};

  // Loading and error states
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // Edit mode toggle
  isEditMode: boolean = false;

  // Editable user fields
  editableUserData: any = {};

  // Additional user data fields
  userFields: { label: string; value: string; key: string }[] = [];

  constructor(
    private directusService: DirectusService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    this.isLoading = true;

    this.directusService.getCurrentUser().subscribe({
      next: (user) => {
        this.userData = user;
        this.processUserData();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Profile loading error:', error);
        this.errorMessage = 'Failed to load profile data';
        this.isLoading = false;
      },
    });
  }

  processUserData() {
    // Convert user data to displayable fields
    this.userFields = Object.entries(this.userData)
      .filter(
        ([key, value]) =>
          // Exclude certain fields and null/undefined values
          ![
            'id',
            'role',
            'last_page',
            'avatar',
            'provider',
            'external_identifier',
            'token',
            'status',
            'theme',
            'last_access',
            'email_notifications'
          ].includes(key) &&
          value !== null &&
          value !== undefined
      )
      .map(([key, value]) => ({
        label: this.formatLabel(key),
        value: this.formatValue(value),
        key: key
      }));
  }

  // Toggle edit mode
  toggleEditMode() {
    if (this.isEditMode) {
      // Save changes
      this.saveUserProfile();
    } else {
      // Prepare for editing
      this.editableUserData = { ...this.userData };
      this.isEditMode = true;
    }
  }

  // Save user profile changes
  saveUserProfile() {
    // Prepare the update payload
    const updatePayload: any = {};

    // Only include changed fields
    this.userFields.forEach(field => {
      if (this.editableUserData[field.key] !== this.userData[field.key]) {
        updatePayload[field.key] = this.editableUserData[field.key];
      }
    });

    if (Object.keys(updatePayload).length > 0) {
      this.directusService.updateUserItem(this.userData.id, updatePayload)
        .subscribe({
          next: (updatedUser) => {
            this.userData = updatedUser;
            this.processUserData();
            this.isEditMode = false;
          },
          error: (error) => {
            console.error('Profile update error:', error);
            alert('Failed to update profile. Please try again.');
          }
        });
    } else {
      this.isEditMode = false;
    }
  }

  // Existing helper methods
  private formatLabel(key: string): string {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private formatValue(value: any): string {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    return String(value);
  }

  // Other existing methods...
  getUserAvatar(): string {
    if (this.userData.avatar) {
      return this.directusService.getAssetUrl(this.userData.avatar);
    }
    return 'assets/icon/avatar.png';
  }

  navigateToBookmarks() {
    this.router.navigate(['/bookmarks']);
  }

  goBack() {
    this.router.navigate(['content']);
  }

  logout() {
    this.directusService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout failed', error);
      },
    });
  }
}