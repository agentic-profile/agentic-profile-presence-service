import { JSONRPCRequest, JSONRPCResponse, JSONRPCError } from '@modelcontextprotocol/sdk/types.js';
import { jrpcError, jrpcResult, jrpcErrorAuthRequired } from '../../json-rpc/index.js';
import { saveEvent } from '../../events/events.js';
import { saveLocation } from '../../locations.js';
import { UnifiedStore } from '../../storage/models.js';
import { ClientAgentSession } from '@agentic-profile/auth';
import { Request } from 'express';
import { LocationUpdate, EventUpdate } from '../../models.js';


export async function handleToolsCall(request: JSONRPCRequest, session: ClientAgentSession, req: Request, store: UnifiedStore): Promise<JSONRPCResponse | JSONRPCError> {
    const { name } = request.params || {};
    console.log('🔍 handleToolsCall', name, request, session);
    
    switch (name) {
        case 'update-location':
            return await handleUpdateLocation(request,session,req,store);
        case 'update-event':
            return await handleUpdateEvent(request,session,req,store);
        default:
            return jrpcError(request.id!, -32601, `Tool ${name} not found`);
    }
}

async function handleUpdateLocation(request: JSONRPCRequest, session: ClientAgentSession, req: Request, store: UnifiedStore): Promise<JSONRPCResponse | JSONRPCError> {
    const args = request.params?.arguments as LocationUpdate;
    const agentDid = args.agentDid ?? session?.agentDid
    if( !agentDid )
        return jrpcErrorAuthRequired( request.id );

    const result = await saveLocation( agentDid, args, store);
    return jrpcResult(request.id!, result);
}

async function handleUpdateEvent(request: JSONRPCRequest, session: ClientAgentSession, req: Request, store: UnifiedStore): Promise<JSONRPCResponse | JSONRPCError> {
    const args = request.params?.arguments as EventUpdate;
    const agentDid = args.agentDid ?? session?.agentDid
    if( !agentDid )
        return jrpcErrorAuthRequired( request.id );

    const result = await saveEvent( agentDid, args, store);
    return jrpcResult(request.id!, result);
}