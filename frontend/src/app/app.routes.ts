import { Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout/layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProjectDetailComponent } from './pages/project-detail/project-detail.component';
import { ProjectNewComponent } from './pages/project-new/project-new.component';
import { ProjectEditComponent } from './pages/project-edit/project-edit.component';
import { TaskEditComponent } from './pages/task-edit/task-edit.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { CollaborationsComponent } from './pages/collaborations/collaborations.component';
import { InvitationsComponent } from './pages/invitations/invitations.component';
import { MyProjectsComponent } from './pages/my-projects/my-projects.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Routes publiques
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Routes protégées avec Layout
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard], // protège toutes les pages enfants
    children: [
      { path: 'dashboard', component: DashboardComponent },
      { path: 'projects/new', component: ProjectNewComponent },
      { path: 'projects/:id', component: ProjectDetailComponent },
      { path: 'projects/:id/edit', component: ProjectEditComponent },
      { path: 'tasks/:id/edit', component: TaskEditComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // redirige vers dashboard
      {path: 'collaborations',component: CollaborationsComponent},
      {path: 'invitations',component: InvitationsComponent},
      { path: 'my-projects', component: MyProjectsComponent },
    ]
  },

  // fallback pour toute route inconnue
  { path: '**', redirectTo: '/login' }
];