import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { importProvidersFrom, NgModule } from '@angular/core'
import { MatNativeDateModule } from '@angular/material/core'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { AboutComponent } from './components/about/about.component'
import { HeaderComponent } from './components/header/header.component'
import { MapComponent } from './components/map/map.component'

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    AboutComponent,
    HeaderComponent,
    MapComponent,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi()), importProvidersFrom(MatNativeDateModule),],
})
export class AppModule {}
