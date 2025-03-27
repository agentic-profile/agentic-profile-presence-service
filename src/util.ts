import {
	agentHooks,
	DID
} from "@agentic-profile/common";

import { StorageHook } from "./storage/models.js";


export function removeFragment( did: DID ) {
	return did.split("#")[0];
}

export function storage() {
	return agentHooks<StorageHook>().storage;
}