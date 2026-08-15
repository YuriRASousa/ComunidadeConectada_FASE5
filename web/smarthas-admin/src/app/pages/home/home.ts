import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NgIf],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(public authService: AuthService) {}
}
