import { ClientAgentSessionStore } from "@agentic-profile/auth";
import {
    AgenticProfileStore,
    DID,
    EdDSAPrivateJWK,
    EdDSAPublicJWK
} from "@agentic-profile/common";

import {
    EventAttendee,
    EventAttendeeUpdate,
    EventListingUpdate,
    Geocoordinates,
    LocationQuery,
    NearbyAgent,
} from "../models.js";

export interface VerificationMethodRecord {
    id: string,
    type: string,
    publicKeyJwk: EdDSAPublicJWK,
    privateKeyJwk: EdDSAPrivateJWK
}

export interface UnifiedStore extends ClientAgentSessionStore, AgenticProfileStore {

    addVerificationMethod: ( method: VerificationMethodRecord )=>Promise<void>,
    listVerificationMethods: ()=>Promise<VerificationMethodRecord[]>,
    removeVerificationMethod: ( id:string )=>Promise<void>,

    updateAgentLocation: ( did: DID, coords: Geocoordinates )=>Promise<void>,
    findNearbyAgents: ( coords: Geocoordinates, query: LocationQuery )=>Promise<NearbyAgent[]>,

    updateEventAttendee: ( eventUrl: string, update: EventAttendeeUpdate )=>Promise<void>,
    listEventAttendees: ( eventUrl: string )=>Promise<EventAttendee[]>,
    removeEventAttendee: ( eventUrl: string, did: DID )=>Promise<void>,

    updateEventListing: ( eventUrl: string, update: EventListingUpdate )=>Promise<void>, 

    // Debug (optional)
    dump: () => Promise<any>
}
