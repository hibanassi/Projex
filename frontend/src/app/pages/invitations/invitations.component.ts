import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-invitations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './invitations.component.html',
  styleUrls: ['./invitations.component.css']
})
export class InvitationsComponent implements OnInit {

  invitations: any[] = [];
  sentInvitations: any[] = [];

  constructor(private projectService: ProjectService) {}

  ngOnInit(): void {
    this.loadInvitations();
    this.loadSentInvitations();
  }

  loadInvitations() {
    this.projectService.getInvitations().subscribe(data => {
      this.invitations = data;
    });
  }

  loadSentInvitations() {
    this.projectService.getSentInvitations().subscribe(data => {
      this.sentInvitations = data;
    });
  }

  respond(inviteId: number, status: 'accepted' | 'rejected') {
    this.projectService.respondInvitation(inviteId, status).subscribe(() => {
      this.loadInvitations(); // recharge les invitations après action
    });
  }

}