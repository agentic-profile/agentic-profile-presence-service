import { DID } from "@agentic-profile/common";
import { AgenticLocationUpdate } from "./models.js";
import {
    removeFragment,
    storage
} from "./util.js";


export async function saveLocation( did: DID, update: AgenticLocationUpdate ) {
    did = removeFragment( did );
    const { coords } = update;
    await storage().updateAgentLocation( did, coords );

    return { did, coords, broadcastResults: [] };
}