import { NgModule } from '@angular/core';
import { ExtraOptions, RouterModule, Routes } from '@angular/router';
import { AboutComponent } from './components/about/about.component';
import { MapComponent } from './components/map/map.component';

const routes: Routes = [
  { path: 'about', component: AboutComponent },
  { path: '', component: MapComponent },
  { path: '*', redirectTo: '', pathMatch: 'prefix' }
];

const routerOptions: ExtraOptions = {
  useHash: false,
  anchorScrolling: 'enabled'
};

@NgModule({
  imports: [RouterModule.forRoot(routes, routerOptions)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
