import { DID } from "@agentic-profile/common";
import {
    AgenticLocationUpdate,
    NearbyAgent
} from "./models.js";
import {
    removeFragment,
    storage
} from "./util.js";


export async function saveLocation( did: DID, update: AgenticLocationUpdate ) {
    did = removeFragment( did );
    const { coords, query } = update;
    await storage().updateAgentLocation( did, coords );

    let nearby: undefined | NearbyAgent[] = undefined;
    if( query )
        nearby = await storage().findNearbyAgents( coords, query );

    return { did, coords, nearby, broadcastResults: [] };
}