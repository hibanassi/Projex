import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-edit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-edit.component.html',
  styleUrl: './project-edit.component.css'
})
export class ProjectEditComponent {
project: any = {
    name: '',
    description: ''
  };

  projectId: number = 0;
  isLoading = true;
  isSaving = false;
  error = '';
  saveError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) {}

  ngOnInit() {
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
  }

  loadProject() {
    this.isLoading = true;
    this.error = '';

    this.projectService.getProject(this.projectId).subscribe({
      next: (response) => {
        this.project = response.project;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du projet';
        this.isLoading = false;
        console.error('Error loading project:', err);
      }
    });
  }

  onSubmit() {
    if (!this.project.name.trim()) {
      this.saveError = 'Le nom du projet est requis';
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    this.projectService.updateProject(this.projectId, {
      name: this.project.name,
      description: this.project.description
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/projects', this.projectId]);
        } else {
          this.saveError = 'Erreur lors de la modification du projet';
          this.isSaving = false;
        }
      },
      error: (err) => {
        this.saveError = err.error?.error || 'Erreur lors de la modification du projet';
        this.isSaving = false;
        console.error('Error updating project:', err);
      }
    });
  }
}
