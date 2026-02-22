import { parseDid, DID } from "@agentic-profile/common";
import { ServerError } from "@agentic-profile/express-common";
import log from "loglevel";

import { EventUpdate } from "../models.js";

import {
    fetchLumaEventDetails,
    normalizeLumaUrl
} from "./luma.js";
import {
    fetchEventbriteEventDetails,
    normalizeEventbriteUrl
} from "./eventbrite.js";
import { UnifiedStore } from "../storage/models.js";

export async function saveEvent( did: DID, update: EventUpdate, store: UnifiedStore ) {
    did = parseDid( did ).did;
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
    type: "luma" | "eventbrite"
}

function normalizeEventUrl( eventUrl: string ): EventUrl {
    const parsedUrl = new URL( eventUrl );

    let url = normalizeLumaUrl( parsedUrl );
    if( url )
        return { url, type: "luma" };

    url = normalizeEventbriteUrl( parsedUrl );
    if( url )
        return { url, type: "eventbrite" };

    throw new ServerError([4],"Unrecognized event type for " + eventUrl );
}

async function fetchEventDetails( url: string, type: string ) {
    log.info("fetchEventDetails", url, type );
    if( type === "luma" )
        return await fetchLumaEventDetails( url );

    if( type === "eventbrite" )
        return await fetchEventbriteEventDetails( url );

    throw new ServerError([4],"Unknown event type " + type );
} 
