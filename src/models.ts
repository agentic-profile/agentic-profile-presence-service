export interface Geocoordinates {
    latitude: number,
    longitude: number
}

export interface AgenticLocationUpdate {
    broadcast?: boolean
    coords: Geocoordinates
}

export interface AgenticEventUpdate {
    broadcast?: boolean
    eventUrl: string
}