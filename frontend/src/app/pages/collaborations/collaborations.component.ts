import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-collaborations',
  standalone: true,
  templateUrl: './collaborations.component.html',
  styleUrls: ['./collaborations.component.css'],
  imports: [CommonModule, RouterModule]
})
export class CollaborationsComponent implements OnInit {

  invitations: any[] = [];
  collaboratedProjects: any[] = [];

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadCollaborations();
  }


  loadCollaborations() {
    this.projectService.getCollaboratedProjects().subscribe(data => {
      this.collaboratedProjects = data;
    });
  }

  
}