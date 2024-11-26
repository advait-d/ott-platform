import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { DirectusService } from '../services/directus.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
  registerForm: FormGroup;
  showPassword = false;
  isLoading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private directusService: DirectusService
  ) {
    this.registerForm = this.fb.group({
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  onRegister() {
    if (this.registerForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.directusService.register(this.registerForm.value)
        .pipe(finalize(() => this.isLoading = false))
        .subscribe({
          next: () => {
            // After successful registration, log in automatically
            const { email, password } = this.registerForm.value;
            this.directusService.login(email, password).subscribe({
              next: () => {
                this.router.navigate(['/content']);
              },
              error: () => {
                this.errorMessage = 'Registration successful but login failed. Please log in manually.';
              }
            });
          },
          error: (error) => {
            this.errorMessage = error.message || 'Registration failed. Please try again.';
          }
        });
    }
  }

  loginToAccount() {
    this.router.navigate(['/login'])
  }
}
