import { DID } from "@agentic-profile/common";

export interface Geocoordinates {
    latitude: number,
    longitude: number
}

export interface LocationQuery {
    withinMeters: number    // meters
    maxAge: number          // minutes
}

export interface NearbyAgent {
    did: DID,
    distance: number    // meters
    updated: Date
}

export interface AgenticLocationUpdate {
    broadcast?: boolean
    coords: Geocoordinates
    query?: LocationQuery
}

export interface AgenticEventsUpdate {
    broadcast?: boolean
    eventUrls: string[]
}

export interface PresenceUpdate {
    location?: AgenticLocationUpdate,
    events?: AgenticEventsUpdate
}