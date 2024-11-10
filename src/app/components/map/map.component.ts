import { AfterViewInit, Component, inject, OnDestroy } from '@angular/core'
import { ReactiveFormsModule } from '@angular/forms'
import { MatIconButton } from '@angular/material/button'
import {
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker,
  MatEndDate,
  MatStartDate,
} from '@angular/material/datepicker'
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field'
import { FaIconComponent } from '@fortawesome/angular-fontawesome'
import { faMinus, faPlus } from '@fortawesome/free-solid-svg-icons'
import type { Selection, SubjectPosition } from 'd3'
import * as d3 from 'd3'
import { BehaviorSubject, Subject } from 'rxjs'
import { combineLatestWith, takeUntil } from 'rxjs/operators'
import { LocationService, TripInfo } from 'src/app/services/location.service'
import * as topojson from 'topojson-client'

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FaIconComponent,
    MatDatepickerToggle,
    MatDateRangeInput,
    MatDateRangePicker,
    MatStartDate,
    MatEndDate,
    MatFormField,
    MatIconButton,
    MatLabel,
    MatSuffix,
  ],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private service = inject(LocationService)

  faPlus = faPlus
  faMinus = faMinus

  range = this.service.range

  private height = document.body.getBoundingClientRect().height
  private width = document.body.getBoundingClientRect().width
  private radius = 250
  private resizeObserver = new ResizeObserver((entries) => {
    for (const entry of entries) {
      if (entry.contentBoxSize) {
        // Firefox implements `contentBoxSize` as a single content rect, rather than an array
        const contentBoxSize = Array.isArray(entry.contentBoxSize)
          ? entry.contentBoxSize[0]
          : entry.contentBoxSize

        this.width = contentBoxSize.inlineSize
        this.height = contentBoxSize.blockSize

        this.svg = d3
          .select<Element, unknown>('#map')
          .attr('width', this.width)
          .attr('height', this.height)
          .attr('viewbox', `0 0 ${this.width} ${this.height}`)

        this.projection.translate([this.width / 2, this.height / 2])
        this.drawProjection()
        this.svg!.select<SVGCircleElement>('circle')
          .attr('cx', this.width / 2)
          .attr('cy', this.height / 2)
      }
    }
  })

  private world?: any
  private countries?: any
  private locations: Array<TripInfo> = []

  private worldIsReady = new BehaviorSubject<boolean>(false)
  private destroyed = new Subject<boolean>()

  private svg?: Selection<Element, unknown, HTMLElement, any>
  private graticule = d3.geoGraticule10()
  private projection = d3
    .geoOrthographic()
    .scale(this.radius)
    .translate([this.width / 2, this.height / 2])
    .clipAngle(90)!

  private path = d3.geoPath(this.projection)
  private drag = d3
    .drag()
    .on('start', this.onDragStart.bind(this))
    .on('drag', this.onDrag.bind(this))
    .on('end', this.onDragEnd.bind(this)) as any

  private zoom = d3.zoom().scaleExtent([0.75, 10]).on('zoom', this.onZoom.bind(this))
  private gpos0: [number, number] | null = [0, 0]
  private o0: [number, number, number] = [-28.8394792245004, -35.40978980299912, 0]

  private locationPlaceholder = document.getElementById('location')

  ngAfterViewInit(): void {
    this.resizeObserver.observe(document.body)

    this.service.world.pipe(takeUntil(this.destroyed)).subscribe((world) => {
      this.world = world

      this.setData()
    })

    this.worldIsReady
      .pipe(
        combineLatestWith(this.service.countries, this.service.locations),
        takeUntil(this.destroyed),
      )
      .subscribe(([worldIsReady, countries, locations]) => {
        if (worldIsReady && countries?.features.length && locations.length) {
          this.countries = countries
          this.locations = locations

          this.drawVisitedCountries()
          this.drawVisitedLocations()
          this.drawProjection()
        }
      })
  }

  ngOnDestroy(): void {
    this.destroyed.next(true)
    this.destroyed.unsubscribe()
  }

  private setData() {
    this.svg = d3
      .select<Element, unknown>('#map')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('viewbox', `0 0 ${this.width} ${this.height}`)

    this.svg!.call(this.drag)
    this.svg!.call(this.zoom)

    d3.select('#zoomIn').on('click', this.onZoomIn.bind(this))
    d3.select('#zoomOut').on('click', this.onZoomOut.bind(this))

    this.projection.rotate(this.o0)

    this.drawGlobe()
    this.drawProjection()
  }

  private drawGlobe(): void {
    if (this.world) {
      const land = topojson.feature(this.world, this.world.objects.land)
      const borders = topojson.mesh(this.world, this.world.objects.countries, function (a, b) {
        return a !== b
      })

      this.svg!.append('circle')
        .attr('cx', this.width / 2)
        .attr('cy', this.height / 2)
        .attr('r', this.radius)
        .style('fill', 'none')
        .style('stroke', 'black')
        .style('stroke-width', 2)

      this.svg!.append('path')
        .datum(this.graticule)
        .attr('class', 'graticule')
        .attr('d', this.path)
        .style('fill', 'none')
        .style('stroke', 'rgba(0, 0, 0, 0.17)')

      this.svg!.append('path')
        .datum(land)
        .attr('class', 'land')
        .attr('d', this.path)
        .style('fill', 'rgba(0, 0, 0, 0.17)')
        .style('stroke', 'none')

      this.svg!.append('path')
        .datum(borders)
        .attr('class', 'border')
        .attr('d', this.path)
        .style('fill', 'none')
        .style('stroke', 'rgba(255, 255, 255, 0.7)')

      this.worldIsReady.next(true)
    }
  }

  private drawVisitedCountries(): void {
    if (this.countries) {
      this.svg!.selectAll('#countries').remove()

      this.svg!.append('g')
        .attr('id', 'countries')
        .selectAll('path')
        .data(this.countries.features)
        .join('path')
        .attr('class', 'country')
        .attr('d', this.path.projection(this.projection) as unknown as string)
        .style('stroke', 'none')
        .style('fill', 'rgba(108, 229, 178, 0.74)')
        .on('mouseover', this.onMouseOver.bind(this))
        .on('mouseleave', this.onMouseLeave.bind(this))
    }
  }

  private drawVisitedLocations(): void {
    this.svg!.selectAll('#locations').remove()

    const locations = {
      type: 'FeatureCollection',
      features: [] as unknown[],
    }
    locations.features = this.locations.map((l) => {
      const { coordinates, date, place } = l
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates },
        properties: { date, place },
      }
    })

    this.svg!.append('g')
      .attr('id', 'locations')
      .selectAll('path')
      .data(locations.features)
      .join('path')
      .attr('name', (feature: any) => feature.properties.place)
      .attr('class', 'location')
      .attr('d', this.path.projection(this.projection) as unknown as string)
      .style('cursor', 'pointer')
      .style('paint-order', 'stroke')
      .style('stroke', 'white')
      .style('fill', '#4abcc6')
      .on('mouseover', (event: MouseEvent) => {
        this.locationPlaceholder!.innerText =
          (event.target as HTMLElement).getAttribute('name') || ''
      })
      .on('mouseleave', (event: MouseEvent) => {
        this.locationPlaceholder!.innerText = ''
      })
  }

  private drawProjection(): void {
    this.svg!.selectAll('path').attr(
      'd',
      this.path.projection(this.projection) as unknown as string,
    )
  }

  private onDragStart(event: unknown & SubjectPosition, d?: unknown) {
    if (this.svg && this.projection && this.projection.invert && this.gpos0) {
      this.gpos0 = this.projection.invert([event.x, event.y])
      this.o0 = this.projection.rotate()
      this.drawProjection()
    }
  }

  private onDrag(event: unknown & SubjectPosition, d?: unknown) {
    if (this.svg && this.projection && this.projection.invert && this.gpos0) {
      const gpos1 = this.projection.invert([event.x, event.y])

      this.o0 = this.projection.rotate()

      try {
        if (gpos1) {
          const o1 = this.service.eulerAngles(this.gpos0, gpos1, this.o0)
          o1[2] = 0 // to keep North pole
          this.projection.rotate(o1)
          this.drawProjection()
        }
      } catch (e: any) {
        console.warn(e.message)
      }
    }
  }

  private onDragEnd(event: unknown & SubjectPosition, d?: unknown) {}

  private onZoom(event: any) {
    const zoom = event.transform.translate(this.projection).k
    this.projection.scale(zoom * this.radius)
    this.drawProjection()
    this.svg!.select<SVGCircleElement>('circle').attr('r', zoom * this.radius)
  }

  private onZoomIn(event: unknown) {
    this.zoom.scaleBy(this.svg!.transition().duration(750), 1.2)
  }

  private onZoomOut(event: unknown) {
    this.zoom.scaleBy(this.svg!.transition().duration(750), 0.8)
  }

  private onMouseOver(event: MouseEvent) {
    if (event.target) {
      const target = event.target as SVGPathElement
      target.style.fill = 'rgba(120, 200, 160, 1)'
    }
  }

  private onMouseLeave(event: MouseEvent) {
    if (event.target) {
      const target = event.target as SVGPathElement
      target.style.fill = 'rgba(108, 229, 178, 0.74)'
    }
  }
}
