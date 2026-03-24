import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  projects: any[] = [];
  filteredProjects: any[] = []; 
  selectedStatus: string = 'all'; 

  loading = true;
  error = '';
  username: string = '';
  showLogoutConfirm = false;
  userId: number = 0;

  constructor(
    private projectService: ProjectService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.username = localStorage.getItem('username') || 'Utilisateur';
    this.userId = Number(localStorage.getItem('userId'));
    this.loadProjects();
  }

  loadProjects() {
    this.loading = true;
    this.error = '';

    this.projectService.getProjects().subscribe({
      next: (data: any[]) => {
        this.projects = data;
        this.filteredProjects = [...this.projects]; 
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des projets';
        this.loading = false;
        console.error('Error loading projects:', err);
      }
    });
  }

  deleteProject(id: number) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      this.projectService.deleteProject(id).subscribe({
        next: () => this.loadProjects(),
        error: () => alert('Erreur lors de la suppression du projet')
      });
    }
  }
  collaborate(projectId: number) {
    this.projectService.collaborate(projectId).subscribe({
      next: () => {
        alert("Invitation envoyée !");
      },
      error: (err) => {
        alert(err.error?.error || "Erreur");
      }
    });
  }
  
  logoutWithConfirm() {
    this.showLogoutConfirm = true;
  }

  confirmLogout() {
    this.showLogoutConfirm = false;
    this.authService.logout();
  }

  
  getProjectStatus(project: any): string {
    if (!project.tasks || project.tasks.length === 0) {
      return 'À faire';
    }

    const statuses = project.tasks.map((t: any) => t.status);

    const allDone = statuses.every((s: string) => s === 'done');
    const allPending = statuses.every((s: string) => s === 'pending');

    if (allDone) {
      return 'Terminé';
    }

    if (allPending) {
      return 'À faire';
    }

   
    return 'En cours';
  }

 
  applyFilter() {
    if (this.selectedStatus === 'all') {
      this.filteredProjects = [...this.projects];
    } else {
      this.filteredProjects = this.projects.filter(
        project => this.getProjectStatus(project) === this.selectedStatus
      );
    }
  }

}
