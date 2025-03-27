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

export class MySQLStorage { //implements Storage {

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
        const verificationMethods = await queryRows<any>( "SELECT id,type,public_key_jwk as publicKeyJwk FROM client_agent_sessions" );

        return {
            database: "MySQL",
            clientSessions,
            agentLocations,
            agentEvents,
            verificationMethods
        }
    }
}
