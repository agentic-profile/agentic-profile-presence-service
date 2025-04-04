import {
    DID,
    removeFragment
} from "@agentic-profile/common";
import { ServerError } from "@agentic-profile/express-common";

import {
    AgenticEventsUpdate,
} from "./models.js";
import { storage } from "./util.js";

export async function saveEvents( did: DID, update: AgenticEventsUpdate ) {
    did = removeFragment( did );

    const { eventUrls: syncUrls } = update;
    if( !syncUrls )
        throw new ServerError([4],"Missing required 'eventUrl' property");

    const warnings = [];
    const eventUrls = [];
    for( const url of syncUrls ) {
        try {
            const normalizedUrl = normalizeEventUrl( url );
            eventUrls.push( normalizedUrl );
        } catch( err ) {
            warnings.push( `Failed to add event url ${url}: ${err}` );
        }
    }

    await storage().syncAgentEvents( did, eventUrls );

    return { did, eventUrls, warnings, broadcastResults: [] };
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
