import { DID } from "@agentic-profile/common";
import {
    ClientAgentSession,
    ClientAgentSessionUpdates
} from "@agentic-profile/auth";

import { mysql } from "@agentic-profile/express-common";
const {
    queryFirstRow,
    queryResult,
    queryRows,
    updateDB
} = mysql;

import {
    Storage,
    VerificationMethodRecord
} from "../models.js";
import { Geocoordinates } from "../../models.js";

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

    async findNearbyAgents( coords: Geocoordinates, withinMeters: number, maxAgeMinutes?: number ): Promise<DID[]> {
        const { latitude, longitude } = coords;

        let sql = `
            SELECT did FROM agent_coords
            WHERE ST_Distance_Sphere(coords, POINT(?, ?)) <= ?
        `;
        const params: any[] = [longitude, latitude, withinMeters];

        if (maxAgeMinutes !== undefined) {
            sql += ` AND updated >= NOW() - INTERVAL ? MINUTE`;
            params.push(maxAgeMinutes);
        }

        const rows = await queryRows(sql, params);
        return rows.map((row: any) => row.did);
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
