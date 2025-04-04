import { agentHooks } from "@agentic-profile/common";
import { StorageHook } from "./storage/models.js";

export function storage() {
	return agentHooks<StorageHook>().storage;
}