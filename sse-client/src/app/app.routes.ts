import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/sse-demo', pathMatch: 'full' },
  { path: 'sse-demo', loadComponent: () => import('./components/sse-demo/sse-demo.component').then(m => m.SseDemoComponent) }
];
