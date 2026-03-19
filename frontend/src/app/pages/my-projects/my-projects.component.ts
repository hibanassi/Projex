import { Component, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-my-projects',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './my-projects.component.html',
  styleUrls: ['./my-projects.component.css']

})

export class MyProjectsComponent implements OnInit {

  myProjects: any[] = [];
  loading = false;
  error = '';

  constructor(private projectService: ProjectService) {}

  ngOnInit() {
    this.loadMyProjects();
  }

  loadMyProjects() {
    this.loading = true;

    this.projectService.getMyProjects().subscribe({
      next: (res) => {
        this.myProjects = res;
        this.loading = false;
      },
      error: () => {
        this.error = "Erreur lors du chargement";
        this.loading = false;
      }
    });
  }
}