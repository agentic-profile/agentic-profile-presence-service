import {
    AGENTIC_AUTH_REQUIRED_JSON_RPC_CODE,
    jrpcError,
    JsonRpcRequest,
    JsonRpcRequestContext,
    jrpcResult,
    JsonRpcResponse
} from '@agentic-profile/a2a-mcp-express';
import log from 'loglevel';

import { saveEvent } from '../../events/events.js';
import { saveLocation } from '../../locations.js';
import { UnifiedStore } from '../../storage/models.js';
import { ClientAgentSession } from '@agentic-profile/auth';
import { LocationUpdate, EventUpdate } from '../../models.js';


export function createToolsCallHandler(store: UnifiedStore) {

    return async (request: JsonRpcRequest, context: JsonRpcRequestContext): Promise<JsonRpcResponse> => {
        const { name } = request.params || {};
        log.info('handleToolsCall', name, request);
        
        try {
            const session = context.session;
            if (!session) {
                log.info('Requesting authentication', context);
                return jrpcError(request.id!, AGENTIC_AUTH_REQUIRED_JSON_RPC_CODE, 'Please authenticate');
            }

            switch (name) {
                case 'update_location':
                    return await updateLocation(request, session);
                case 'update_event_rsvp':
                    return await updateEvent(request, session);
                default:
                    return jrpcError(request.id!, -32601, `Tool ${name} not found`);
            }
        } catch (error: any) {
            log.error('💥 Error in handleToolsCall:', error.message, error.stack);
            return jrpcError(request.id!, -32603, `Internal error: ${error.message}`);
        }
    }

    async function updateLocation(request: JsonRpcRequest, session: ClientAgentSession): Promise<JsonRpcResponse> {
        const args = request.params?.arguments as LocationUpdate;
        if( !args )
            return jrpcError(request.id!, -32602, 'Missing required arguments');
        if( !args.coords || !args.coords.latitude || !args.coords.longitude )
            return jrpcError(request.id!, -32602, 'Missing required coordinates');

        const result = await saveLocation( session.agentDid, args, store);
        return jrpcResult(request.id!, result);
    }

    async function updateEvent(request: JsonRpcRequest, session: ClientAgentSession): Promise<JsonRpcResponse> {
        const args = request.params?.arguments as EventUpdate;
        if( !args )
            return jrpcError(request.id!, -32602, 'Missing required arguments');
        if( !args.eventUrl )
            return jrpcError(request.id!, -32602, 'Missing required event URL');
        if( !args.rsvp || !['yes', 'no', 'maybe'].includes(args.rsvp) )
            return jrpcError(request.id!, -32602, 'Invalid RSVP status');

        const result = await saveEvent( session.agentDid, args, store);
        return jrpcResult(request.id!, result);
    }
}
