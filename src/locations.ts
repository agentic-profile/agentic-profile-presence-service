import {
    agentHooks,
    DID
} from "@agentic-profile/common";

import {
    AgenticLocationUpdate,
    Geocoordinates
} from "./models.js";
import {
    removeFragment,
    storage
} from "./util.js";


export async function saveLocation( did: DID, update: AgenticLocationUpdate ) {
    did = removeFragment( did );
    const { coords, broadcast } = update;
    await storage().updateAgentLocation( did, coords );

    return { did, coords, broadcastResults: [] };
}