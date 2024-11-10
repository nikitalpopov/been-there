import { Routes } from '@angular/router'

export const routes: Routes = [
  {
    path: 'about',
    loadComponent: () => import('./components/about/about.component').then((m) => m.AboutComponent),
  },
  {
    path: '',
    loadComponent: () => import('./components/map/map.component').then((m) => m.MapComponent),
  },
  { path: '*', redirectTo: '', pathMatch: 'prefix' },
]
