import { DID } from "@agentic-profile/common";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates
} from "@agentic-profile/auth";

import {
    Storage,
    VerificationMethodRecord
} from "./models.js";
import {
    Geocoordinates,
    LocationQuery,
    NearbyAgent
} from "../models.js";

let nextSessionId = 1;
const clientSessionMap = new Map<number,ClientAgentSession>();

interface AgentEventRecord {
    did: DID,
    eventUrl: string,
    created: Date
}

interface LocationRecord {
    coords: Geocoordinates,
    created: Date
}

const verificationMethodMap = new Map<string,VerificationMethodRecord>();
const agentLocationMap = new Map<string,LocationRecord>();
const agentEventMap = new Map<string,AgentEventRecord>();

function mapToObject<K extends PropertyKey, V>(map: Map<K, V>): Record<K, V> {
    return Object.fromEntries(map) as Record<K, V>;
}

function agentEventKey( did: DID, eventUrl: string ) {
    return `${did} ${eventUrl}`;    
}


export class InMemoryStorage implements Storage {

    async dump() {
        return {
            database: 'Memory',
            clientSessions: mapToObject( clientSessionMap ),
            verificationMethods: mapToObject( verificationMethodMap ),
            agentLocations: mapToObject( agentLocationMap ),
            agentEvents: mapToObject( agentEventMap )
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
 
    async addAgentEvent( did: DID, eventUrl: string ) {
        const key = agentEventKey( did, eventUrl );
        agentEventMap.set( key, { did, eventUrl, created: new Date() } );
    }

    async syncAgentEvents( did: DID, eventUrls: string[] ) {
        for( const url of eventUrls ) {
            const key = agentEventKey( did, url );
            console.log( 'adding event', key );
            agentEventMap.set( key, { did, eventUrl: url, created: new Date() } );
        }

        // remove those not in list
        [...agentEventMap.values()]
            .filter(e=>e.did === did && eventUrls.includes(e.eventUrl) !== true)
            .forEach(e=>{
                const key = agentEventKey( e.did, e.eventUrl );
                console.log( 'removing event', key );
                agentEventMap.delete(key);
            });
    }

    async listEventAgents( eventUrl: string ) {
        return [...agentEventMap.values()]
            .filter(e=>e.eventUrl === eventUrl)
            .map(e=>e.did);
    }
    
    async removeAgentEvent( did: DID, eventUrl: string ) {
        const key = agentEventKey( did, eventUrl );
        agentEventMap.delete( key )
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
