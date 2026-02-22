import { createMcpServiceRouter, DEFAULT_MCP_INITIALIZE_RESPONSE } from '@agentic-profile/a2a-mcp-express';

import { createToolsCallHandler } from './methods.js';
import { MCP_TOOLS } from './tools.js';
import { Resolver } from 'did-resolver';
import { UnifiedStore } from '../../storage/models.js';


export function createPresenceRouter( didResolver: Resolver, store: UnifiedStore ) {
    return createMcpServiceRouter({
        store,
        didResolver,
        handlers: {
            toolsCall: createToolsCallHandler(store)
        },
        initializeResponse: INITIALIZE_RESPONSE,
        lists: { tools: MCP_TOOLS },
    });
}

const INITIALIZE_RESPONSE = {
    ...DEFAULT_MCP_INITIALIZE_RESPONSE,
    "serverInfo": {
        "name": "Presence Service",
        "title": "Find nearby people",
        "version": "1.0.0"
    }
};
