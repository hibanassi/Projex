import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.css']
})
export class TopbarComponent implements OnInit {

  username: string = '';

  @Output() menuClick = new EventEmitter<void>();

  ngOnInit() {
    this.username = localStorage.getItem('username') || 'Utilisateur';
  }

  toggleSidebar() {
    this.menuClick.emit();
  }
}