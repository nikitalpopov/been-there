import { Component } from '@angular/core'
import { MatButtonModule } from '@angular/material/button'
import { RouterModule } from '@angular/router'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'
import { faGithub } from '@fortawesome/free-brands-svg-icons'

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    RouterModule,
    FaIconComponent,
    MatButtonModule,
  ],
})
export class HeaderComponent {
  faGithub = faGithub
}
