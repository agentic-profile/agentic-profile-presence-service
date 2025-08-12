import {
    AgenticProfile,
    DID
} from "@agentic-profile/common/schema";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates
} from "@agentic-profile/auth";

import {
    queryFirstRow,
    queryResult,
    queryRows
} from "@agentic-profile/mysql";

import {
    UnifiedStore,
    VerificationMethodRecord
} from "./models.js";
import {
    EventAttendee,
    EventAttendeeUpdate,
    EventListingUpdate,
    Geocoordinates,
    LocationQuery,
    NearbyAgent
} from "../models.js";

interface AgenticProfileRecord {
    profileDid: string,
    agenticProfile: AgenticProfile,
    updated: Date
}

export class MySQLStore implements UnifiedStore {

    async addVerificationMethod( method: VerificationMethodRecord ) {
        const { id, type, publicKeyJwk, privateKeyJwk } = method;
        const updates = {
            type,
            public_key_jwk: publicKeyJwk ? JSON.stringify( publicKeyJwk ) : undefined,
            private_key_jwk: privateKeyJwk ? JSON.stringify( privateKeyJwk ) : undefined
        };
        const insert = { id, ...updates };

        await queryResult( "INSERT INTO verification_methods SET ? ON DUPLICATE KEY UPDATE ?", [insert,updates] );
    }

    async listVerificationMethods() {
        return await queryRows<VerificationMethodRecord>(
            "SELECT id,type,public_key_jwk as publicKeyJwk,private_key_jwk as privateKeyJwk FROM verification_methods"
        );
    }

    async removeVerificationMethod( id:string ) {
        await queryResult( "DELETE FROM verification_methods WHERE id=?",[id] );
    }

    //
    // Locations
    //

    async updateAgentLocation( did: DID, coords: Geocoordinates ) {
        const { latitude, longitude } = coords;
        await queryResult(
            "INSERT INTO agent_coords SET did=?,coords=POINT(?,?) ON DUPLICATE KEY UPDATE coords=POINT(?,?)",
            [did,longitude,latitude,longitude,latitude] 
        );
    }

    async findNearbyAgents( coords: Geocoordinates, query: LocationQuery ): Promise<NearbyAgent[]> {
        const { latitude, longitude } = coords;
        const { maxAge, withinMeters } = query;  // maxAge in minutes

        let sql = `
WITH distances AS (
    SELECT 
        did, 
        updated, 
        ST_Distance_Sphere(coords, POINT(?, ?)) AS distance
    FROM 
        agent_coords
)
SELECT 
    did, 
    updated, 
    distance
FROM 
    distances
WHERE 
    distance <= ?
        `;
        const params: any[] = [longitude, latitude, withinMeters];

        if (maxAge !== undefined) {
            sql += ` AND updated >= NOW() - INTERVAL ? MINUTE`;
            params.push(maxAge);
        }

        console.log(sql,params);
        const rows = await queryRows(sql, params);
        return rows.map(({ did, distance, updated }: any) => ({ did, distance, updated }));
    }

    //
    // Events
    //

    async updateEventAttendee( eventUrl: string, update: EventAttendeeUpdate ) {
        const { did, rsvp } = update;
        const insert = { did, event_url: eventUrl, rsvp };
        await queryResult(
            `INSERT INTO event_attendees SET ? 
             ON DUPLICATE KEY UPDATE ?`,
            [insert, { did, rsvp }]
        );
    }

    async listEventAttendees(eventUrl: string): Promise<EventAttendee[]> {
        return await queryRows<EventAttendee>(
            `SELECT did,rsvp,updated FROM event_attendees WHERE event_url=?`,
            [eventUrl]
        );
    }

    /*
    async syncAgentEvents( did: DID, eventUrls: string[] ) {
        // Step 1: Get current events for the DID
        const currentRows = await queryRows(
            `SELECT event_url FROM agent_events WHERE did = ?`,
            [did]
        );
        const currentEventUrls = currentRows.map((row: any) => row.event_url);

        // Step 2: Determine which events to remove and which to add
        const toAdd = eventUrls.filter(url => !currentEventUrls.includes(url));
        const toRemove = currentEventUrls.filter(url => !eventUrls.includes(url));

        // Step 3: Remove stale events
        if (toRemove.length > 0) {
            await queryResult(
                `DELETE FROM agent_events WHERE did = ? AND event_url IN (${toRemove.map(() => '?').join(',')})`,
                [did, ...toRemove]
            );
        }

        // Step 4: Add new events
        for (const url of toAdd) {
            await this.addAgentEvent(did, url); // uses your existing upsert logic
        }
    }*/

    async removeEventAttendee( eventUrl: string, did: DID ) {
        await queryResult(
            `DELETE FROM event_attendees WHERE event_url = ? AND did = ?`,
            [ eventUrl, did ]
        );
    }

    async updateEventListing( eventUrl: string, update: EventListingUpdate ) {
        const { title, description, startDate, endDate, address, coords } = update;
        const dbUpdate = {
            title,
            description,
            start_date: startDate,
            end_date: endDate,
            address: address ? JSON.stringify( address ) : address    
        }
        const insert = {
            event_url: eventUrl,
            ...dbUpdate
        };

        const coordSQL = coords ? ",coords=POINT(?,?)" : "";
        const coordParams = coords ? [coords.longitude,coords.latitude] : [];

        await queryResult(
            `INSERT INTO event_listings SET ?${coordSQL} 
             ON DUPLICATE KEY UPDATE ?${coordSQL}`,
            [ insert, ...coordParams, dbUpdate, ...coordParams ]
        );      
    }


    //
    // Sessions, where we have authenticated either a general agentic profile (no agent_url)
    // or a specific agent of an agentic profile and we are sure the agent signed the
    // server challenge and attestation
    //

    async createClientAgentSession( challenge: string ) {
        const { insertId: id } = await queryResult( 'INSERT INTO client_agent_sessions SET ?', [{challenge}] );
        return id;
    }

    async fetchClientAgentSession( id: number ) {
        return await queryFirstRow<ClientAgentSession>(
            "SELECT id,created,challenge,agent_did as agentDid,auth_token as authToken FROM client_agent_sessions WHERE id=?",
            [id]
        ) ?? undefined;
    }

    async updateClientAgentSession( id: number, updates: ClientAgentSessionUpdates ) {
        const fields = {} as any;
        if( updates.agentDid !== undefined )
            fields.agent_did = updates.agentDid;
        if( updates.authToken !== undefined )
            fields.auth_token = updates.authToken;

        await queryResult( 'UPDATE client_agent_sessions SET ? WHERE id=?', [fields,id] );
    }

    //
    // Agentic Profile Cache
    //

    async saveAgenticProfile( profile: AgenticProfile ) {
        const update = {
            agentic_profile: JSON.stringify(profile)
        };
        const insert = {
            ...update,
            profile_did: profile.id,
        };
        await queryResult(
            "INSERT INTO agentic_profile_cache SET ? ON DUPLICATE KEY UPDATE ?",
            [insert,update]
        );
    }

    async loadAgenticProfile( did: DID ) {
        const AGENTIC_PROFILE_CACHE_COLUMNS = "profile_did as profileDid,agentic_profile as agenticProfile,updated";
        const record = await queryFirstRow<AgenticProfileRecord>(
            `SELECT ${AGENTIC_PROFILE_CACHE_COLUMNS} FROM agentic_profile_cache WHERE profile_did=?`,
            [did]
        );
        if( record && !isExpired( record ) )
            return record.agenticProfile;
        else
            return undefined;
    }

    //
    // Debug
    //

    async dump() {
        const clientSessions = await queryRows<any>( "SELECT * FROM client_agent_sessions" );
        const agentLocations = await queryRows<any>( "SELECT * FROM agent_coords" );
        const agentEvents = await queryRows<any>( "SELECT * FROM agent_events" );
        const verificationMethods = await queryRows<any>( "SELECT id,type,public_key_jwk as publicKeyJwk FROM verification_methods" );

        return {
            database: "MySQL",
            clientSessions,
            agentLocations,
            agentEvents,
            verificationMethods
        }
    }
}

function isExpired( record: AgenticProfileRecord ) {
    const updated = new Date( record.updated );
    const now = new Date();
    const ttl = record.agenticProfile.ttl ?? 86400;
    const result = updated.getTime() + (ttl * 1000) < now.getTime();
    return result;
}
