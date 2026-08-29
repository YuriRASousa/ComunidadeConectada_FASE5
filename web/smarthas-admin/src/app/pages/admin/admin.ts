import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  LucideShieldCheck,
  LucideLayoutDashboard,
  LucideUsers,
  LucidePackage,
  LucidePlus,
  LucideLogOut,
  LucideTrash2,
  LucideCheckCircle2,
  LucideXCircle,
  LucideLoaderCircle,
  LucideArrowRight,
} from '@lucide/angular';

import { AuthService } from '../../core/services/auth.service';
import { AdminService } from '../../core/services/admin.service';
import { UserService } from '../../core/services/user.service';
import { ResourceService } from '../../core/services/resource.service';
import {
  AdminStats,
  ApiError,
  NewResource,
  Resource,
  ResourceCategory,
  ResourceCondition,
  ResourceType,
  User,
} from '../../core/models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    LucideShieldCheck,
    LucideLayoutDashboard,
    LucideUsers,
    LucidePackage,
    LucidePlus,
    LucideLogOut,
    LucideTrash2,
    LucideCheckCircle2,
    LucideXCircle,
    LucideLoaderCircle,
    LucideArrowRight,
  ],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit {
  // --- stats ---
  stats: AdminStats | null = null;
  statsLoading = false;
  statsError = '';

  // --- users ---
  users: User[] = [];
  usersLoading = false;
  usersError = '';

  // --- resources ---
  resources: Resource[] = [];
  resourcesLoading = false;
  resourcesError = '';

  // --- create resource form ---
  readonly categories: ResourceCategory[] = [
    'FERRAMENTAS',
    'SAUDE',
    'EDUCACAO',
    'ALIMENTOS',
    'ELETRONICOS',
    'OUTROS',
  ];
  readonly conditions: ResourceCondition[] = ['NOVO', 'EXCELENTE', 'BOM', 'REGULAR'];
  readonly types: ResourceType[] = ['EMPRESTIMO', 'TROCA', 'DOACAO'];

  newResource: NewResource = {
    title: '',
    description: '',
    category: 'FERRAMENTAS',
    condition: 'NOVO',
    type: 'EMPRESTIMO',
  };
  createLoading = false;
  createError = '';
  createSuccess = '';

  constructor(
    public authService: AuthService,
    private adminService: AdminService,
    private userService: UserService,
    private resourceService: ResourceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
    this.loadResources();
  }

  loadStats(): void {
    this.statsLoading = true;
    this.statsError = '';
    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats = stats;
        this.statsLoading = false;
      },
      error: (err) => {
        this.statsError = this.extractError(err, 'Não foi possível carregar as estatísticas.');
        this.statsLoading = false;
      },
    });
  }

  loadUsers(): void {
    this.usersLoading = true;
    this.usersError = '';
    this.userService.list().subscribe({
      next: (page) => {
        this.users = page.content ?? [];
        this.usersLoading = false;
      },
      error: (err) => {
        this.usersError = this.extractError(err, 'Não foi possível carregar os usuários.');
        this.usersLoading = false;
      },
    });
  }

  loadResources(): void {
    this.resourcesLoading = true;
    this.resourcesError = '';
    this.resourceService.list().subscribe({
      next: (page) => {
        this.resources = page.content ?? [];
        this.resourcesLoading = false;
      },
      error: (err) => {
        this.resourcesError = this.extractError(err, 'Não foi possível carregar os recursos.');
        this.resourcesLoading = false;
      },
    });
  }

  deleteUser(user: User): void {
    if (!confirm(`Excluir o usuário "${user.name}"?`)) {
      return;
    }
    this.userService.delete(user.id).subscribe({
      next: () => {
        this.users = this.users.filter((u) => u.id !== user.id);
      },
      error: (err) => {
        this.usersError = this.extractError(err, 'Não foi possível excluir o usuário.');
      },
    });
  }

  deleteResource(resource: Resource): void {
    if (!confirm(`Excluir o recurso "${resource.title}"?`)) {
      return;
    }
    this.resourceService.delete(resource.id).subscribe({
      next: () => {
        this.resources = this.resources.filter((r) => r.id !== resource.id);
      },
      error: (err) => {
        this.resourcesError = this.extractError(err, 'Não foi possível excluir o recurso.');
      },
    });
  }

  createResource(): void {
    this.createError = '';
    this.createSuccess = '';
    this.createLoading = true;

    this.resourceService.create(this.newResource).subscribe({
      next: (resource) => {
        this.createLoading = false;
        this.createSuccess = `Recurso "${resource.title}" criado com sucesso.`;
        this.newResource = {
          title: '',
          description: '',
          category: 'FERRAMENTAS',
          condition: 'NOVO',
          type: 'EMPRESTIMO',
        };
        this.loadResources();
      },
      error: (err) => {
        this.createLoading = false;
        this.createError = this.extractError(err, 'Não foi possível criar o recurso.');
      },
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  categoryEntries(map: Record<string, number> | undefined): Array<{ key: string; value: number }> {
    if (!map) {
      return [];
    }
    return Object.entries(map).map(([key, value]) => ({ key, value }));
  }

  private extractError(err: HttpErrorResponse, fallback: string): string {
    const apiError = err.error as ApiError | undefined;
    return apiError?.message || fallback;
  }
}
