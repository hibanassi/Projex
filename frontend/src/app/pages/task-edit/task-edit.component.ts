import { Component } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ProjectService } from '../../services/project.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Task } from '../../models/task';

@Component({
  selector: 'app-task-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './task-edit.component.html',
  styleUrl: './task-edit.component.css'
})
export class TaskEditComponent {
  task: any = {
    id: 0,
    title: '',
    description: '',
    status: 'pending',
    project_id: 0
  };

  taskId: number = 0;
  isLoading = true;
  isSaving = false;
  error = '';
  saveError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private projectService: ProjectService
  ) { }

  ngOnInit() {
    this.taskId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadTask();
  }

  loadTask() {
    this.isLoading = true;
    this.error = '';

    this.projectService.getTask(this.taskId).subscribe({
      next: (response) => {
        this.task = response.task;
        this.isLoading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement de la tâche';
        this.isLoading = false;
        console.error('Error loading task:', err);
      }
    });
  }

  onSubmit() {
    if (!this.task.title.trim()) {
      this.saveError = 'Le titre est requis';
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    this.projectService.updateTask(this.taskId, {
      title: this.task.title,
      description: this.task.description,
      status: this.task.status,
      project_id: this.task.project_id
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.router.navigate(['/projects', this.task.project_id]);
        } else {
          this.saveError = 'Erreur lors de la modification de la tâche';
          this.isSaving = false;
        }
      },
      error: (err) => {
        this.saveError = err.error?.error || 'Erreur lors de la modification de la tâche';
        this.isSaving = false;
        console.error('Error updating task:', err);
      }
    });
  }
}
