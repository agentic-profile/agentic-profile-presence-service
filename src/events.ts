import {
    agentHooks,
    DID
} from "@agentic-profile/common";

import {
    AgenticEventUpdate,
} from "./models.js";
import {
    removeFragment,
    storage
} from "./util.js";

export async function saveEvent( did: DID, update: AgenticEventUpdate ) {
    did = removeFragment( did );
    const { eventUrl, broadcast } = update;
    await storage().addAgentEvent( did, eventUrl );

    return { did, eventUrl, broadcastResults: [] };
}