import {
    AgenticProfile,
    DID
} from "@agentic-profile/common";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates
} from "@agentic-profile/auth";

import {
    UnifiedStore,
    VerificationMethodRecord
} from "./models.js";
import {
    EventAttendee,
    EventAttendeeUpdate,
    EventListing,
    EventListingUpdate,
    Geocoordinates,
    LocationQuery,
    NearbyAgent
} from "../models.js";

let nextSessionId = 1;
const clientSessionMap = new Map<number,ClientAgentSession>();

interface EventRecord {
    listing: EventListing,
    attendees: Map<DID,EventAttendee>
}

interface LocationRecord {
    coords: Geocoordinates,
    created: Date
}

const verificationMethodMap = new Map<string,VerificationMethodRecord>();
const agentLocationMap = new Map<string,LocationRecord>();
const eventRecordMap = new Map<string,EventRecord>();
const profileMap = new Map<string,AgenticProfile>();

function mapToObject<K extends PropertyKey, V>(map: Map<K, V>): Record<K, V> {
    return Object.fromEntries(map) as Record<K, V>;
}

export class InMemoryStore implements UnifiedStore {

    async dump() {
        return {
            database: 'Memory',
            clientSessions: mapToObject( clientSessionMap ),
            verificationMethods: mapToObject( verificationMethodMap ),
            agentLocations: mapToObject( agentLocationMap ),
            eventRecords: mapToObject( eventRecordMap ),
            profileCache: mapToObject( profileMap )
        }
    }

    async addVerificationMethod( method: VerificationMethodRecord ) {
        verificationMethodMap.set( method.id, method );
    }

    async listVerificationMethods() {
        return Array.from( verificationMethodMap.values() );
    }

    async removeVerificationMethod( id:string ) {
        verificationMethodMap.delete( id );
    }

    //
    // Locations
    //

    async updateAgentLocation( did: DID, coords: Geocoordinates ) {
        agentLocationMap.set( did, { coords, created: new Date() } );
    }

    async findNearbyAgents( coords: Geocoordinates, query: LocationQuery ): Promise<NearbyAgent[]> {
        const { maxAge, withinMeters } = query;  // maxAge in minutes
        return [...agentLocationMap.entries()]
            .map(([key,e])=>({
                did: key,
                updated: e.created,
                distance: isTooOld( e.created, maxAge ) ? -1 : getDistanceInMeters( coords, e.coords )
            }))
            .filter(e=>e.distance !== -1 && e.distance <= withinMeters); 
    }

    //
    // Events
    //
 
    async updateEventAttendee( eventUrl: string, update: EventAttendeeUpdate ) {
        const record = ensureEventRecord( eventUrl, eventRecordMap );
        const { did, rsvp } = update;
        record.attendees.set( did, { did, rsvp, updated: new Date() } );
    }

    async listEventAttendees( eventUrl: string ) {
        const attendees = eventRecordMap.get( eventUrl )?.attendees?.values();
        return attendees ? [...attendees] : [];
    }
    
    async removeEventAttendee( eventUrl: string, did: DID ) {
        eventRecordMap.get( eventUrl )?.attendees?.delete( did );
    }

    async updateEventListing( eventUrl: string, update: EventListingUpdate ) {
        const record = ensureEventRecord( eventUrl, eventRecordMap );
        record.listing = { ...record.listing, ...update, updated: new Date() };   
    }

    //
    // Sessions
    //

    async createClientAgentSession( challenge: string ) {
        const id = nextSessionId++;
        clientSessionMap.set( id, { id, challenge, created: new Date() } as ClientAgentSession );
        return id;
    }

    async fetchClientAgentSession( id:number ) {
        return clientSessionMap.get( id );  
    }

    async updateClientAgentSession( id:number, updates:ClientAgentSessionUpdates ) {
        const session = clientSessionMap.get( id );
        if( !session )
            throw new Error("Failed to find client session by id: " + id );
        else
            clientSessionMap.set( id, { ...session, ...updates } );
    }

    //
    // Agentic Profile Cache
    //

    async saveAgenticProfile( profile: AgenticProfile ) { 
        profileMap.set( profile.id, profile )
    }

    async loadAgenticProfile( did: DID ) {
        return profileMap.get( did )
    }
}

function ensureEventRecord( eventUrl: string, eventRecordMap: Map<DID,EventRecord> ) {
    let record = eventRecordMap.get( eventUrl );
    if( !record ) {
        record = { attendees: new Map<DID,EventAttendee>() } as EventRecord;
        eventRecordMap.set( eventUrl, record );
    }
    return record;
}

// maxAge in minutes
function isTooOld( created: Date, maxAge: number | undefined ) {
    if( !maxAge )
        return false;
    else
        return created.getTime() + ( maxAge * 60000 ) < Date.now();
}

//
// Distance
//

function toRadians(degrees:number) {
    return degrees * (Math.PI / 180);
}

const EARTH_RADIUS_METERS = 6371000; // in meters

function getDistanceInMeters( coord1:Geocoordinates, coord2:Geocoordinates ) {

    const lat1 = toRadians(coord1.latitude);
    const lat2 = toRadians(coord2.latitude);
    const deltaLat = toRadians(coord2.latitude - coord1.latitude);
    const deltaLon = toRadians(coord2.longitude - coord1.longitude);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS_METERS * c;
}
