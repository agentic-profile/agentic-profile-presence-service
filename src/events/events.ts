import { removeFragmentId } from "@agentic-profile/common";
import { DID } from "@agentic-profile/common/schema";
import { ServerError } from "@agentic-profile/express-common";
import log from "loglevel";

import { EventUpdate } from "../models.js";

import {
    fetchLumaEventDetails,
    normalizeLumaUrl
} from "./luma.js";
import { UnifiedStore } from "../storage/models.js";

/*
export async function saveEvents( did: DID, update: BatchEventUpdate ) {
    did = removeFragmentId( did );

    const { eventUrls: syncUrls } = update;
    if( !syncUrls )
        throw new ServerError([4],"Missing required 'eventUrls' property");

    const warnings = [];
    const events = [];
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
}*/

export async function saveEvent( did: DID, update: EventUpdate, store: UnifiedStore ) {
    did = removeFragmentId( did );
    log.info("saveEvent", did, update );
    const { eventUrl, rsvp /*, broadcast*/ } = update;

    const { url, type } = normalizeEventUrl( eventUrl );

    const listing = await fetchEventDetails( url, type );

    log.info("updating event listing", url );
    await store.updateEventListing( url, listing );

    log.info("updating event attendee", url );
    await store.updateEventAttendee( url, { did, rsvp } );
    const attendees = await store.listEventAttendees( url );
    log.info("event attendees", attendees );

    return { eventUrl: url, listing, attendees };
}

interface EventUrl {
    url: string,
    type: "luma"
}

function normalizeEventUrl( eventUrl: string ): EventUrl {
    const parsedUrl = new URL( eventUrl );

    let url = normalizeLumaUrl( parsedUrl );
    if( url )
        return { url, type: "luma" };

    throw new ServerError([4],"Unrecognized event type for " + eventUrl );
}

async function fetchEventDetails( url: string, type: string ) {
    log.info("fetchEventDetails", url, type );
    if( type === "luma" )
        return await fetchLumaEventDetails( url );

    throw new ServerError([4],"Uknown event type " + type );
} 
