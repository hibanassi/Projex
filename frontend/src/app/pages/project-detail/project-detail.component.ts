import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.css'
})
export class ProjectDetailComponent {
  @ViewChild('taskForm') taskForm!: NgForm;
  project: any = null;
  tasks: any[] = [];
  isLoading = true;
  error = '';
  projectId!: number;
  isAuthorized: boolean = false;
  newTask = {
    title: '',
    description: ''
  };
  isAddingTask = false;
  collaborators: any[] = [];
  isOwner: boolean = false;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) { }

  userId: number = 0;
  ngOnInit() {
    this.userId = Number(localStorage.getItem('userId'));
    this.projectId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadProject();
    this.loadCollaborators();
    this.projectService.getCollaborators(this.projectId).subscribe(res => {
    this.collaborators = res.collaborators;
    this.isOwner = res.isOwner;
});
  }

loadProject() {
  this.isLoading = true;
  this.error = '';

  const projectId = Number(this.route.snapshot.paramMap.get('id'));

  this.projectService.getProject(projectId).subscribe({
    next: (response: any) => {
      this.project = response.project;
      this.tasks = response.tasks;
      this.isAuthorized =
        this.project.owner_id == this.userId || response.isCollaborator;

      this.isLoading = false;
    },
    error: (err) => {
      this.error = 'Erreur lors du chargement du projet';
      this.isLoading = false;
    }
  });
}

loadCollaborators() {
  this.projectService.getCollaborators(this.projectId).subscribe(res => {
    this.collaborators = res.collaborators;
    this.isOwner = res.isOwner;
  });
}

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'À faire';
      case 'in_progress': return 'En cours';
      case 'done': return 'Terminée';
      default: return status;
    }
  }

  addTask() {
    if (!this.newTask.title.trim() || !this.project) return;

    this.isAddingTask = true;

    this.projectService.addTask({
      title: this.newTask.title,
      description: this.newTask.description,
      project_id: this.project.id
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.tasks.push(response.task);
          this.newTask = { title: '', description: '' };
          this.taskForm.resetForm();
        }
        this.isAddingTask = false;
      },
      error: (err) => {
        console.error('Error adding task:', err);
        this.isAddingTask = false;
        alert('Erreur lors de l\'ajout de la tâche');
      }
    });
  }

  updateTaskStatus(taskId: number, status: string) {
    if (!this.project) return;

    this.projectService.updateTaskStatus(taskId, status, this.project.id).subscribe({
      next: (response) => {
        if (response.success) {
          const task = this.tasks.find(t => t.id === taskId);
          if (task) {
            task.status = status;
          }
        }
      },
      error: (err) => {
        console.error('Error updating task status:', err);
        alert('Erreur lors de la mise à jour du statut');
      }
    });
  }

  deleteTask(taskId: number, projectId: number) {
    if (confirm('Supprimer cette tâche ?')) {
      this.projectService.deleteTask(taskId, projectId).subscribe({
        next: (response) => {
          if (response.success) {
            this.tasks = this.tasks.filter(t => t.id !== taskId);
          }
        },
        error: (err) => {
          console.error('Error deleting task:', err);
          alert('Erreur lors de la suppression de la tâche');
        }
      });
    }
  }

  deleteProject() {
    if (!this.project) return;

    if (confirm('Supprimer ce projet ? Toutes les tâches associées seront également supprimées.')) {
      this.projectService.deleteProject(this.project.id).subscribe({
        next: (response) => {
          if (response.success) {
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          console.error('Error deleting project:', err);
          alert('Erreur lors de la suppression du projet');
        }
      });
    }
  }
  
  removeCollaborator(userId: number) {
  if (!confirm('Supprimer ce collaborateur ?')) return;

  this.projectService.removeCollaborator(this.projectId, userId)
    .subscribe(() => {
      this.collaborators = this.collaborators.filter(u => u.id !== userId);
    });
}
}
