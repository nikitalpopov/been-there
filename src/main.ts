import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { enableProdMode, importProvidersFrom } from '@angular/core'
import { MatNativeDateModule } from '@angular/material/core'
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser'
import { provideAnimations } from '@angular/platform-browser/animations'
import { AppRoutingModule } from './app/app-routing.module'
import { AppComponent } from './app/app.component'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode()
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(AppRoutingModule, BrowserModule),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(MatNativeDateModule),
    provideAnimations(),
  ],
}).catch((err) => console.error(err))
