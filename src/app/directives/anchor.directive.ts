import { Directive, ElementRef, HostListener, inject, Input } from '@angular/core'
import { Router } from '@angular/router'

@Directive({
  selector: '[anchor]',
  standalone: true,
})
export class AnchorDirective {
  private el = inject(ElementRef)
  private router = inject(Router)

  // eslint-disable-next-line accessor-pairs
  @Input() set anchor(value: string) {
    if (this.element) {
      this.element.id = value
      this.element.classList.toggle('anchor', true)
      this.link = window.location.origin + this.router.url.split('#')[0] + '#' + value
    }
  }

  @HostListener('click') onClick() {
    if (this.link) {
      navigator.clipboard.writeText(this.link)
      window.location.assign(this.link)
    }
  }

  element: HTMLElement | null = null

  private link?: string

  constructor() {
    this.appendAnchorStyle()

    this.element = this.el.nativeElement
  }

  private appendAnchorStyle(text: string = '#️⃣'): void {
    if (document.head.querySelector('#anchor-style') === null) {
      const anchorStyle = document.createElement('style')
      anchorStyle.id = 'anchor-style'
      anchorStyle.innerHTML = `
        .anchor {
          cursor: pointer;
        }

        .anchor:hover::after,
        .anchor:focus::after {
          content: '${text}';
          font-size: medium;
          margin-left: 8px;
        }
      `
      document.head.appendChild(anchorStyle)
    }
  }
}
