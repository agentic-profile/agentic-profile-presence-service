import { 
    DID, 
    removeFragmentId
} from "@agentic-profile/common";
import {
    AgenticLocationUpdate,
    NearbyAgent
} from "./models.js";
import { storage } from "./util.js";


export async function saveLocation( did: DID, update: AgenticLocationUpdate ) {
    did = removeFragmentId( did );
    const { coords, query } = update;
    await storage().updateAgentLocation( did, coords );

    let nearby: undefined | NearbyAgent[] = undefined;
    if( query )
        nearby = await storage().findNearbyAgents( coords, query );

    return { did, coords, nearby, broadcastResults: [] };
}