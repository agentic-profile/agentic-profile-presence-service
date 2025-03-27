import {
    ClientAgentSessionStorage,
    EdDSAPrivateJWK,
    EdDSAPublicJWK
} from "@agentic-profile/auth";
import { DID } from "@agentic-profile/common";

import { Geocoordinates } from "../models.js";

export interface VerificationMethodRecord {
    id: string,
    type: string,
    publicKeyJwk: EdDSAPublicJWK,
    privateKeyJwk: EdDSAPrivateJWK
}

export interface Storage extends ClientAgentSessionStorage {

    addVerificationMethod: ( method: VerificationMethodRecord )=>Promise<void>,
    listVerificationMethods: ()=>Promise<VerificationMethodRecord[]>,
    removeVerificationMethod: ( id:string )=>Promise<void>,

    updateAgentLocation: ( did: DID, coords: Geocoordinates )=>Promise<void>,
    findNearbyAgents: ( coords: Geocoordinates, withinMeters: number, maxAgeMinutes?: number )=>Promise<DID[]>,

    addAgentEvent: ( did: DID, eventUrl: string )=>Promise<void>,
    listEventAgents: ( eventUrl: string )=>Promise<DID[]>,
    removeAgentEvent: ( did: DID, eventUrl: string )=>Promise<void>,

    // Debug (optional)
    dump: () => Promise<any>
}

export interface StorageHook {
    storage: Storage
}
