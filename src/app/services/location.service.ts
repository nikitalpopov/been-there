/* eslint-disable camelcase */
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { FormControl, FormGroup } from '@angular/forms'
import * as d3 from 'd3'
import type { FeatureCollection } from 'geojson'
import { BehaviorSubject, Observable } from 'rxjs'
import { combineLatestWith, filter, map } from 'rxjs/operators'

interface NomadListResponse {
  success: boolean
  trips: Array<{
    country_code: string
    country: string
    date_start: string
    date_end: string
    epoch_start: number
    epoch_end: number
    latitude: number
    longitude: number
    place: string
  }>
}

export interface TripInfo {
  coordinates: [number, number]
  date: Date
  place: string
}

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private http = inject(HttpClient)

  private _countries = new BehaviorSubject<FeatureCollection | undefined>(undefined)
  public countries = this._countries.asObservable()

  private _locations = new BehaviorSubject<Array<TripInfo>>([])
  public locations = this._locations.asObservable()

  private _world = new BehaviorSubject(undefined)
  public world = this._world.asObservable()

  readonly minDate = new Date(Date.parse('1997-04-25'))
  readonly maxDate = new Date()
  readonly range = new FormGroup({
    start: new FormControl<Date>(this.minDate),
    end: new FormControl<Date>(this.maxDate),
  })


  private dateChanges$ = this.range.controls.start.valueChanges.pipe(
    combineLatestWith(this.range.controls.end.valueChanges),
    filter(([start, end]) => !!start && !!end)
  ) as Observable<[Date, Date]>

  private NOMAD_LIST_DATA?: NomadListResponse
  private COUNTRIES_GEOJSON?: FeatureCollection
  private TO_RADIANS = Math.PI / 180
  private TO_DEGREES = 180 / Math.PI

  constructor() {
    this.getVisitedCountries().subscribe(() => {
      this.loadData()
    })

    this.dateChanges$.subscribe(([startDate, endDate]: [Date, Date]) => {
      endDate.setHours(23, 59, 59, 999)
      this.sendInfo(startDate, endDate)
    })
  }

  private getVisitedCountries(): Observable<void> {
    return this.http.get<NomadListResponse>('https://nomadlist.com/@nikitalpopov.json').pipe(
      filter((response) => response.success),
      map((response) => {
        this.NOMAD_LIST_DATA = response
      }),
    )
  }

  private sendInfo(startDate = this.minDate, endDate = this.maxDate): void {
    const nomadListData = this.NOMAD_LIST_DATA
    const countries = { ...this.COUNTRIES_GEOJSON } as FeatureCollection

    const startDateEpoch = startDate.getTime() / 1000
    const endDateEpoch = endDate.getTime() / 1000
    const dateRangeTrips =
      nomadListData?.trips.filter(
        (trip) => trip.epoch_start >= startDateEpoch && trip.epoch_start <= endDateEpoch,
      ) ?? []

    const visitedCountries = [
      ...new Set(dateRangeTrips.map((trip) => trip.country_code.toLocaleUpperCase())),
    ]

    if (countries) {
      countries.features = countries.features.filter((c: any) =>
        visitedCountries.includes((c.properties.iso2 as string)?.toLocaleUpperCase()),
      )

      this._countries.next(countries)
    }

    const locations: TripInfo[] = dateRangeTrips.map(
      (trip) =>
        ({
          coordinates: [trip.longitude, trip.latitude],
          date: new Date(trip.date_start),
          place: trip.place,
        }),
    )

    if (locations) {
      this._locations.next(locations)
    }
  }

  private filterCountries(countries: any): any {
    countries.features = countries.features.map((f: any) => {
      const { name, iso_3166_1_alpha_2_codes, iso3 } = f.properties
      f.properties = { country: name, iso2: iso_3166_1_alpha_2_codes, iso3 }
      return f
    })

    return countries
  }

  private async loadData() {
    await Promise.all([
      d3.json('/assets/world-administrative-boundaries.geojson').then(
        (countries: any) => (this.COUNTRIES_GEOJSON = this.filterCountries(countries)),
        (error) => {
          if (error) throw error
        },
      ),

      d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json').then(
        (world: any) => this._world.next(world),
        (error) => {
          if (error) throw error
        },
      ),
    ])

    this.sendInfo()
  }

  // Helper function: cross product of two vectors v0&v1
  private cross(
    v0: [number, number, number],
    v1: [number, number, number],
  ): [number, number, number] {
    return [
      v0[1] * v1[2] - v0[2] * v1[1],
      v0[2] * v1[0] - v0[0] * v1[2],
      v0[0] * v1[1] - v0[1] * v1[0],
    ]
  }

  // Helper function: dot product of two vectors v0&v1
  private dot(v0: [number, number, number], v1: [number, number, number]) {
    let sum = 0
    for (let i = 0; v0.length > i; ++i) sum += v0[i] * v1[i]
    return sum
  }

  // Helper function:
  // This function converts a [lon, lat] coordinates into a [x, y, z] coordinate
  // the [x, y, z] is Cartesian, with origin at lon/lat (0,0) center of the earth
  private lonlat2xyz(coord: [number, number]): [number, number, number] {
    const lon = coord[0] * this.TO_RADIANS
    const lat = coord[1] * this.TO_RADIANS

    const x = Math.cos(lat) * Math.cos(lon)
    const y = Math.cos(lat) * Math.sin(lon)
    const z = Math.sin(lat)

    return [x, y, z]
  }

  // Helper function:
  // This function computes a quaternion representation for the rotation between to vectors
  // https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
  private quaternion(
    v0: [number, number, number],
    v1: [number, number, number],
  ): 0 | [number, number, number, number] | undefined {
    if (!v0 || !v1) return

    const w = this.cross(v0, v1) // vector perpendicular to v0 & v1
    const wLen = Math.sqrt(this.dot(w, w)) // length of w

    if (wLen === 0) return

    const theta = 0.5 * Math.acos(Math.max(-1, Math.min(1, this.dot(v0, v1))))
    const qi = (w[2] * Math.sin(theta)) / wLen
    const qj = (-w[1] * Math.sin(theta)) / wLen
    const qk = (w[0] * Math.sin(theta)) / wLen
    const qr = Math.cos(theta)

    return theta && [qr, qi, qj, qk]
  }

  // Helper function:
  // This functions converts euler angles to quaternion
  // https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
  private euler2quat(e: [number, number, number]): [number, number, number, number] | undefined {
    if (!e) return

    const roll = 0.5 * e[0] * this.TO_RADIANS
    const pitch = 0.5 * e[1] * this.TO_RADIANS
    const yaw = 0.5 * e[2] * this.TO_RADIANS
    const sr = Math.sin(roll)
    const cr = Math.cos(roll)
    const sp = Math.sin(pitch)
    const cp = Math.cos(pitch)
    const sy = Math.sin(yaw)
    const cy = Math.cos(yaw)
    const qi = sr * cp * cy - cr * sp * sy
    const qj = cr * sp * cy + sr * cp * sy
    const qk = cr * cp * sy - sr * sp * cy
    const qr = cr * cp * cy + sr * sp * sy

    return [qr, qi, qj, qk]
  }

  /**
   * This functions computes a quaternion multiply
   * Geometrically, it means combining two quant rotations
   * http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/arithmetic/index.htm
   */
  private quatMultiply(
    q1?: [number, number, number, number],
    q2?: 0 | [number, number, number, number],
  ): [number, number, number, number] | undefined {
    if (!q1 || !q2) return

    const a = q1[0]
    const b = q1[1]
    const c = q1[2]
    const d = q1[3]
    const e = q2[0]
    const f = q2[1]
    const g = q2[2]
    const h = q2[3]

    return [
      a * e - b * f - c * g - d * h,
      b * e + a * f + c * h - d * g,
      a * g - b * h + c * e + d * f,
      a * h + b * g - c * f + d * e,
    ]
  }

  /**
   * This function computes quaternion to euler angles
   * https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
   */
  private quat2euler(t?: [number, number, number, number]): [number, number, number] {
    if (!t) throw new Error('Quaternion angles are undefined!')

    return [
      Math.atan2(2 * (t[0] * t[1] + t[2] * t[3]), 1 - 2 * (t[1] * t[1] + t[2] * t[2])) *
        this.TO_DEGREES,
      Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) * this.TO_DEGREES,
      Math.atan2(2 * (t[0] * t[3] + t[1] * t[2]), 1 - 2 * (t[2] * t[2] + t[3] * t[3])) *
        this.TO_DEGREES,
    ]
  }

  /**
   * This function computes the euler angles when given two vectors, and a rotation
   * This is really the only math function called with d3 code.
   * @param v0 - starting pos in lon/lat, commonly obtained by projection.invert
   * @param v1 - ending pos in lon/lat, commonly obtained by projection.invert
   * @param o0 - the projection rotation in euler angles at starting pos (v0), commonly obtained by projection.rotate
   */
  public eulerAngles(
    v0: [number, number],
    v1: [number, number],
    o0: [number, number, number],
  ): [number, number, number] {
    /*
      The math behind this:
      - first calculate the quaternion rotation between the two vectors, v0 & v1
      - then multiply this rotation onto the original rotation at v0
      - finally convert the resulted quat angle back to euler angles for d3 to rotate
    */

    const t = this.quatMultiply(
      this.euler2quat(o0),
      this.quaternion(this.lonlat2xyz(v0), this.lonlat2xyz(v1)),
    )
    return this.quat2euler(t)
  }
}
