import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-project-new',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './project-new.component.html',
  styleUrl: './project-new.component.css'
})
export class ProjectNewComponent {
  project = {
    name: '',
    description: ''
  };

  error = '';
  isLoading = false;

  constructor(
    private projectService: ProjectService,
    private router: Router
  ) { }

  onSubmit() {
    if (!this.project.name.trim()) {
      this.error = 'Le nom du projet est requis';
      return;
    }

    this.isLoading = true;
    this.error = '';

    this.projectService.createProject(this.project).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/dashboard']);
        } else {
          this.error = 'Erreur lors de la création du projet';
          this.isLoading = false;
        }
      },
      error: (err) => {
        this.error = err.error?.error || 'Erreur lors de la création du projet';
        this.isLoading = false;
        console.error('Error creating project:', err);
      }
    });
  }
}
