import { DID } from "@agentic-profile/common";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates
} from "@agentic-profile/auth";

import { mysql } from "@agentic-profile/express-common";
const {
    queryFirstRow,
    queryResult,
    queryRows
} = mysql;

import {
    Storage,
    VerificationMethodRecord
} from "../models.js";
import {
    Geocoordinates,
    LocationQuery,
    NearbyAgent
} from "../../models.js";

export class MySQLStorage implements Storage {

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

        const rows = await queryRows(sql, params);
        return rows.map(({ did, distance, updated }: any) => ({ did, distance, updated }));
    }

    //
    // Events
    //

    async addAgentEvent(did: DID, eventUrl: string) {
        await queryResult(
            `INSERT INTO agent_events (did, event_url) 
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE updated = CURRENT_TIMESTAMP`,
            [did, eventUrl]
        );
    }

    async listEventAgents(eventUrl: string): Promise<DID[]> {
        const rows = await queryRows(
            `SELECT did FROM agent_events WHERE event_url = ?`,
            [eventUrl]
        );
        return rows.map((row: any) => row.did);
    }

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
    }

    async removeAgentEvent(did: DID, eventUrl: string) {
        await queryResult(
            `DELETE FROM agent_events WHERE did = ? AND event_url = ?`,
            [did, eventUrl]
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
