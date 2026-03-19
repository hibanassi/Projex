import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent {
  constructor(private authService: AuthService,private projectService: ProjectService) { }
  invitationCount: number = 0;
  ngOnInit() {
  this.projectService.getInvitationsCount().subscribe(res => {
    this.invitationCount = res.total;
  });
}
  @Input() isOpen: boolean = false;
  @Output() closeSidebar = new EventEmitter<void>();
  onNavigate() {
    this.closeSidebar.emit();
  }
  logout() {
    this.authService.logout();
  }
}