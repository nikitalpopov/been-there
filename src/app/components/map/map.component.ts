import { AfterViewInit, Component } from '@angular/core';
import * as d3 from 'd3';
import { SubjectPosition } from 'd3';
import { LocationService } from 'src/app/services/location.service';
import * as topojson from 'topojson-client';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private height = 600;
  private width = 600;
  private radius = 250;

  private world?: any;
  private countries?: any;

  private svg?: any;
  private graticule = d3.geoGraticule10();
  private projection = d3.geoOrthographic()
      .scale(this.radius)
      .translate([this.width / 2, this.height / 2])
      .clipAngle(90)!;
  private path = d3.geoPath(this.projection);
  private drag = d3.drag()
      .on("start", this.onDragStart.bind(this))
      .on("drag", this.onDrag.bind(this))
      .on("end", this.onDragEnd.bind(this)) as any;
  private gpos0: [number, number] | null = [0, 0];
  private o0: [number, number, number] = [-28.8394792245004, -35.40978980299912, 0];

  constructor(private service: LocationService) {
    this.setData = this.setData.bind(this);
    this.onDragStart = this.onDragStart.bind(this);
    this.onDrag = this.onDrag.bind(this);
    this.onDragEnd = this.onDragEnd.bind(this);
  }

  ngAfterViewInit(): void {
    // d3.json("https://pkgstore.datahub.io/core/geo-countries/countries/archive/23f420f929e0e09c39d916b8aaa166fb/countries.geojson")
    d3.json("./assets/countries.10m.geojson")
      .then((countries: any) => this.countries = this.service.filterCountries(countries))
      .then(() =>
        d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(
          this.setData,
          (error) => { if (error) throw error; }
        )
      );
  }

  private setData(world: any) {
    this.world = world;

    this.svg = d3.select("#map")
      .attr("width", this.width)
      .attr("height", this.height);

    this.svg.call(this.drag);

    this.projection.rotate(this.o0);

    this.drawGlobe();
    this.drawProjection();
  }

  private drawGlobe(): void {
    const land = topojson.feature(this.world, this.world.objects.land);
    const borders = topojson.mesh(this.world, this.world.objects.countries, function (a, b) { return a !== b; });

    this.svg.append("circle")
      .attr("cx", this.width / 2)
      .attr("cy", this.height / 2)
      .attr("r", this.radius)
      .style("fill", "none")
      .style("stroke", "black")
      .style("stroke-width", 2);

    this.svg.append("path")
      .datum(this.graticule)
      .attr("class", "graticule")
      .attr("d", this.path)
      .style("fill", "none")
      .style("stroke", "rgba(0, 0, 0, 0.17)");

    this.svg.append("path")
      .datum(land)
      .attr("class", "land")
      .attr("d", this.path)
      .style("fill", "rgba(0, 0, 0, 0.17)")
      .style("stroke", "none");

    this.svg.append("g")
      .selectAll("path")
      .data(this.countries.features)
      .join("path")
      .attr("class", "land")
      .attr("d", this.path.projection(this.projection))
      .attr("title", (feature: any) => (feature.ADMIN))
      .style("stroke", "none")
      .style("fill", "rgb(108, 229, 178, 0.74)");
      // .on("mouseover", this.onMouseOver)
      // .on("mouseleave", this.onMouseLeave);

    this.svg.append("path")
      .datum(borders)
      .attr("class", "border")
      .attr("d", this.path)
      .style("fill", "none")
      .style("stroke", "rgba(255, 255, 255, 0.7)");
  }

  private drawProjection(): void {
    this.svg.selectAll("path")
      .attr("d", this.path.projection(this.projection));
  }

  private onDragStart(event: unknown & SubjectPosition, d: unknown) {
    if (this.svg && this.projection && this.projection.invert && this.gpos0) {;
      this.gpos0 = this.projection.invert([event.x, event.y]);
      this.o0 = this.projection.rotate();
      this.drawProjection();
    }
  }

  private onDrag(event: unknown & SubjectPosition, d: unknown) {
    if (this.svg && this.projection && this.projection.invert && this.gpos0) {
      const gpos1 = this.projection.invert([event.x, event.y]);

      this.o0 = this.projection.rotate();

      try {
        if (gpos1) {
          const o1 = this.service.eulerAngles(this.gpos0, gpos1, this.o0);
          o1[2] = 0; // to keep North pole
          this.projection.rotate(o1);
          this.drawProjection();
        }
      } catch (e: any) {
        console.warn(e.message);
      }
    }
  }

  private onDragEnd(event: unknown & SubjectPosition, d: unknown) {}

  // private onMouseOver(event: MouseEvent) {
  //   if (event.target) {
  //     (event.target as HTMLElement).style.fill = "rgba(0, 0, 0, 0.67)";
  //   }
  // }

  // private onMouseLeave(event: MouseEvent) {
  //   console.log('onMouseLeave', event);
  //   if (event.target) {
  //     (event.target as HTMLElement).style.fill = "rgba(0, 0, 0, 0.17)";
  //   }
  // }
}
