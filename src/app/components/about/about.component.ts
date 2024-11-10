import { Component } from '@angular/core';
import { AnchorDirective } from 'src/app/directives/anchor.directive';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss'],
  standalone: true,
  imports: [AnchorDirective],
})
export class AboutComponent {}
