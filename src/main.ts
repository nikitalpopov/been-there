import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http'
import { enableProdMode, importProvidersFrom } from '@angular/core'
import { MatNativeDateModule } from '@angular/material/core'
import { bootstrapApplication, BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule, provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter, withInMemoryScrolling } from '@angular/router'
import { AppComponent } from './app/app.component'
import { routes } from './app/app.routes'
import { environment } from './environments/environment'

if (environment.production) {
  enableProdMode()
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(BrowserModule),
    importProvidersFrom(BrowserAnimationsModule),
    importProvidersFrom(MatNativeDateModule),
  ],
}).catch((err) => console.error(err))
