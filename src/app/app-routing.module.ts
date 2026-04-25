import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CorrelationLessonComponent } from './correlation-lesson/correlation-lesson.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'correlation', component: CorrelationLessonComponent },
  { path: '**', redirectTo: '' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
