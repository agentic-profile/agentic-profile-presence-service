import { ServerError } from "@agentic-profile/express-common";
//import { DOMParser } from "xmldom";
import { JSDOM } from "jsdom";
import log from "loglevel";

import {
    EventListing
} from "../models.js";

//
// Event platform specific
//

export function normalizeLumaUrl( url: URL ): string | undefined {
    // Check it's a lu.ma URL
    if (!/^(www\.)?(lu\.ma|luma\.com)$/.test(url.hostname))
        return;

    // Get pathname, remove trailing slashes
    const pathname = url.pathname.replace(/\/+$/, "");

    return `https://luma.com${pathname}`;
}

export async function fetchLumaEventDetails( url: string ): Promise<EventListing> {
    // Fetch the HTML content of the page
    const response = await fetch(url);
    if (!response.ok)
        throw new ServerError([4],`Failed to fetch event from URL: ${response.statusText} ${url}`);

    log.info( "fetchLumaEventDetails", url, response.ok );
    const html = await response.text();

    // Create a DOM parser
    //const parser = new DOMParser();
    //const doc = parser.parseFromString(html, 'text/html');
    const dom = new JSDOM( html );

    return extractLumaEventDetails( dom.window.document );
}

// result: { title, description, start_date, end_date, coords, address }
function extractLumaEventDetails( document: any ): EventListing {
    const result = {} as EventListing;

    // Get meta tags by their name or property attributes
    result.title = document.querySelector('meta[property="og:title"]')?.content || 
                  document.querySelector('title')?.textContent ||
                  'Title not found';

    result.description = document.querySelector('meta[property="og:description"]')?.content || 
                        document.querySelector('meta[name="description"]')?.content ||
                        'Description not found';

    const json = document.querySelector('script[type="application/ld+json"]')?.textContent;
    if( json ) {
        const data = JSON.parse( json );

        result.startDate = data.startDate;
        result.endDate = data.endDate;

        if( data.location && data.location['@type'] === 'Place' ) {
            const { name, address, latitude, longitude } = data.location;

            if( address && address['@type'] === 'PostalAddress' ) {
                const { addressCountry:country, addressLocality:city, addressRegion:state, streetAddress:street } = address;
                result.address = {
                    name,
                    street,
                    city, state,
                    country: country?.name
                }
            }

            if( latitude && longitude )
                result.coords = { latitude, longitude };
        }
    }

    return result;
}
