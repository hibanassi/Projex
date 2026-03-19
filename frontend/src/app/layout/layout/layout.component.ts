import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule,RouterOutlet, SidebarComponent, TopbarComponent],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.css'
})
export class LayoutComponent {
isSidebarOpen = false;

closeSidebar() {
  this.isSidebarOpen = false;
}

toggleSidebar() {
  this.isSidebarOpen = !this.isSidebarOpen;
}
}
