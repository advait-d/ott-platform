import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

// Import standalone components directly

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.page').then(m => m.LoginPage), // Use loadComponent for lazy loading
  },
  {
    path: 'register',
    loadComponent: () => import('./register/register.page').then(m => m.RegisterPage),
  },
  {
    path: 'content',
    loadComponent: () => import('./content/content.page').then(m => m.ContentPage),
  },
  {
    path: 'bookmarks',
    loadComponent: () => import('./bookmarks/bookmarks.page').then(m => m.BookmarksPage),
  },
  {
    path: 'detail/:type/:id',
    loadComponent: () => import('./detail/detail.page').then(m => m.DetailPage),
  },
  {
    path: '**', // Wildcard route for 404
    redirectTo: 'login', // Redirect any undefined routes to login page
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes), HttpClientModule],  // Keep HttpClientModule here
  exports: [RouterModule],
})
export class AppRoutingModule {}
