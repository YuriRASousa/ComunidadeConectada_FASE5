import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import {
  LucideShieldCheck,
  LucideHandshake,
  LucideRepeat2,
  LucideGift,
  LucideArrowRight,
} from '@lucide/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    NgIf,
    LucideShieldCheck,
    LucideHandshake,
    LucideRepeat2,
    LucideGift,
    LucideArrowRight,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(public authService: AuthService) {}
}
