import { 
    DID
} from "@agentic-profile/common/schema";
import { 
    pruneFragmentId
} from "@agentic-profile/common";
import {
    LocationUpdate,
    NearbyAgent
} from "./models.js";
import { UnifiedStore } from "./storage/models.js";

export async function saveLocation( did: DID, update: LocationUpdate, store: UnifiedStore ) {
    ({documentId: did} = pruneFragmentId( did ));
    const { coords, query } = update;
    await store.updateAgentLocation( did, coords );

    let nearby: undefined | NearbyAgent[] = undefined;
    if( query )
        nearby = await store.findNearbyAgents( coords, query );

    console.log( `saveLocation: ${did}${JSON.stringify(update,null,4)} ${JSON.stringify(nearby,null,4)}` );

    return { did, coords, nearby, broadcastResults: [] };
}