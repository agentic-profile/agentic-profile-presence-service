import axios from "axios";
import {
    agentHooks,
    DID
} from "@agentic-profile/common";
import { ServerError } from "@agentic-profile/express-common";

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

    if( !eventUrl )
        throw new ServerError([4],"Missing required 'eventUrl' property");
    const normalizedUrl = normalizeEventUrl( eventUrl );

    await storage().addAgentEvent( did, normalizedUrl );

    return { did, eventUrl, broadcastResults: [] };
}

function normalizeEventUrl( url: string ): string {
    let result = normalizeLumaUrl( url );
    if( result )
        return result as string;

    console.log("WARNING: Unrecognized event " + url );
    return url;
}

function normalizeLumaUrl( url: string ): string | boolean {
    try {
        const parsedUrl = new URL(url);

        // Check it's a lu.ma URL
        if (!/^(www\.)?lu\.ma$/.test(parsedUrl.hostname))
            return false;

        // Normalize host
        const hostname = "lu.ma";

        // Get pathname, remove trailing slashes
        const pathname = parsedUrl.pathname.replace(/\/+$/, "");

        return `https://${hostname}${pathname}`;
    } catch (err:any) {
        throw new ServerError([4],"Invalid event URL: " + err.message );
    }
}
