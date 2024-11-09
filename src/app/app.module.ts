import { HttpClientModule } from '@angular/common/http'
import { NgModule } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatNativeDateModule } from '@angular/material/core'
import { MatDatepickerModule } from '@angular/material/datepicker'
import { MatIconModule } from '@angular/material/icon'
import { MatLegacyButtonModule } from '@angular/material/legacy-button'
import { MatLegacyFormFieldModule } from '@angular/material/legacy-form-field'
import { BrowserModule } from '@angular/platform-browser'
import { BrowserAnimationsModule } from '@angular/platform-browser/animations'
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'
import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { AboutComponent } from './components/about/about.component'
import { HeaderComponent } from './components/header/header.component'
import { MapComponent } from './components/map/map.component'
import { AnchorDirective } from './directives/anchor.directive'

@NgModule({
  declarations: [AppComponent, AboutComponent, MapComponent, HeaderComponent, AnchorDirective],
  imports: [
    AppRoutingModule,
    BrowserModule,
    BrowserAnimationsModule,
    FontAwesomeModule,
    HttpClientModule,
    MatLegacyButtonModule,
    MatDatepickerModule,
    MatLegacyFormFieldModule,
    MatIconModule,
    MatNativeDateModule,
    ReactiveFormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
