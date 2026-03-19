import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Project } from '../models/project';
import { Task } from '../models/task';
import { request } from 'express';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) { }

  // Get all projects for dashboard
  getProjects(): Observable<Project[]> {
    return this.http.get<Project[]>(`${this.apiUrl}/projects`, { withCredentials: true });
  }

  // Get single project with tasks
  getProject(id: number): Observable<{ project: Project, tasks: Task[] }> {
    return this.http.get<{ project: Project, tasks: Task[] }>(`${this.apiUrl}/projects/${id}`, { withCredentials: true });
  }

getMyProjects(): Observable<Project[]> {
  return this.http.get<Project[]>(`${this.apiUrl}/projects/my-projects`, { withCredentials: true });
}

  // Create new project
  createProject(project: { name: string, description: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects/new`, project, { withCredentials: true });
  }

  // Update project
  updateProject(id: number, project: { name: string, description: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/projects/${id}`, project, { withCredentials: true });
  }

  //  Delete project
  deleteProject(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/projects/${id}`, { withCredentials: true });
  }

  collaborate(projectId: number) {
    return this.http.post(`${this.apiUrl}/collaborations/request`, {
      project_id: projectId
    }, { withCredentials: true });
  }

  // Récupérer les invitations reçues
  getInvitations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/collaborations/invitations`, { withCredentials: true });
  }

  getInvitationsCount() {
    return this.http.get<any>(
      'http://localhost:3000/invitations/count',
      { withCredentials: true }
    );
  }

  // Répondre à une invitation (accepter/refuser)
  respondInvitation(inviteId: number, status: 'accepted' | 'rejected'): Observable<any> {
    return this.http.put(`${this.apiUrl}/collaborations/respond/${inviteId}`, { status }, { withCredentials: true });
  }

  getSentInvitations() {
    return this.http.get<any[]>('http://localhost:3000/invitations/sent', { withCredentials: true });
  }

  // Récupérer les projets collaborés
  getCollaboratedProjects() {
    return this.http.get<any[]>(`${this.apiUrl}/collaborations/my-projects`, { withCredentials: true });
  }

  // Add task
  addTask(task: { title: string, description: string, project_id: number }): Observable<any> {
    return this.http.post(`${this.apiUrl}/tasks`, task, { withCredentials: true });
  }

  // Update task
  updateTask(taskId: number, task: { title: string, description: string, status: string, project_id: number }): Observable<any> {
    return this.http.put(`${this.apiUrl}/tasks/${taskId}`, task, { withCredentials: true });
  }

  // Update task status
  updateTaskStatus(taskId: number, status: string, projectId: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/tasks/${taskId}/status`, {
      task_id: taskId,
      status: status,
      project_id: projectId
    }, { withCredentials: true });
  }

  // Delete task
  deleteTask(taskId: number, projectId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/tasks/${taskId}`, {
      body: { project_id: projectId },
      withCredentials: true
    });
  }

  // Get single task for editing
  getTask(taskId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/tasks/${taskId}`, { withCredentials: true });
  }
  // Récupérer les collaborateurs d’un projet
getCollaborators(projectId: number): Observable<any> {
  return this.http.get(
    `${this.apiUrl}/projects/${projectId}/collaborators`,
    { withCredentials: true }
  );
}

// Supprimer un collaborateur (owner seulement)
removeCollaborator(projectId: number, userId: number): Observable<any> {
  return this.http.delete(
    `${this.apiUrl}/projects/${projectId}/collaborators/${userId}`,
    { withCredentials: true }
  );
}
}


