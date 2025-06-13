import { ServerError } from "@agentic-profile/express-common";
import { JSDOM } from "jsdom";
import log from "loglevel";

import {
    EventListing
} from "../models.js";

//
// Event platform specific
//

export function normalizeEventbriteUrl(url: URL): string | undefined {
    // Check it's an eventbrite.com URL
    if (!/^(www\.)?eventbrite\.com$/.test(url.hostname))
        return;

    // Get pathname, remove trailing slashes
    const pathname = url.pathname.replace(/\/+$/, "");

    // Eventbrite URLs typically follow the pattern: /e/event-name-ticket-123456789
    if (!/^\/e\/[^/]+-\d+$/.test(pathname))
        return;

    return `https://www.eventbrite.com${pathname}`;
}

export async function fetchEventbriteEventDetails(url: string): Promise<EventListing> {
    // Fetch the HTML content of the page
    const response = await fetch(url);
    if (!response.ok)
        throw new ServerError([4], `Failed to fetch event from URL: ${response.statusText} ${url}`);

    log.info("fetchEventbriteEventDetails", url, response.ok);
    const html = await response.text();

    const dom = new JSDOM(html);
    return extractEventbriteEventDetails(dom.window.document);
}

function extractEventbriteEventDetails(document: any): EventListing {
    const result = {} as EventListing;

    // Get meta tags by their name or property attributes
    result.title = document.querySelector('meta[property="og:title"]')?.content ||
                  document.querySelector('title')?.textContent ||
                  'Title not found';

    result.description = document.querySelector('meta[property="og:description"]')?.content ||
                        document.querySelector('meta[name="description"]')?.content ||
                        'Description not found';

    // Eventbrite uses multiple JSON-LD scripts, we need to find the one with event data
    const jsonScripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of jsonScripts) {
        try {
            const data = JSON.parse(script.textContent);
            
            // Eventbrite can have multiple JSON-LD objects, we need the Event one
            if (data['@type'] === 'Event') {
                // Handle dates - Eventbrite provides these in ISO format
                if (data.startDate) {
                    result.startDate = new Date(data.startDate).toISOString();
                }
                if (data.endDate) {
                    result.endDate = new Date(data.endDate).toISOString();
                }

                // Handle location information
                if (data.location) {
                    // Eventbrite can provide location in different formats
                    if (typeof data.location === 'string') {
                        // Sometimes location is just a string
                        result.address = {
                            name: data.location,
                            street: '',
                            city: '',
                            state: '',
                            country: ''
                        };
                    } else if (data.location['@type'] === 'Place') {
                        const location = data.location;
                        
                        // Handle address
                        if (location.address) {
                            const address = location.address;
                            result.address = {
                                name: location.name || '',
                                street: address.streetAddress || '',
                                city: address.addressLocality || '',
                                state: address.addressRegion || '',
                                country: typeof address.addressCountry === 'string' 
                                    ? address.addressCountry 
                                    : address.addressCountry?.name || ''
                            };
                        }

                        // Handle coordinates
                        if (location.geo) {
                            result.coords = {
                                latitude: location.geo.latitude,
                                longitude: location.geo.longitude
                            };
                        }
                    }
                }

                // If we found and processed the event data, we can break
                break;
            }
        } catch (error) {
            log.error("Error parsing Eventbrite JSON-LD:", error);
        }
    }

    // Fallback: Try to get date/time from the page content if not found in JSON-LD
    if (!result.startDate || !result.endDate) {
        const dateTimeElement = document.querySelector('[data-testid="event-date-time"]');
        if (dateTimeElement) {
            const dateTimeText = dateTimeElement.textContent;
            // Try to parse the date/time text
            // This is a fallback and might need adjustment based on actual Eventbrite date format
            const dateMatch = dateTimeText.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
            if (dateMatch) {
                const date = new Date(dateMatch[1]);
                if (!result.startDate) {
                    result.startDate = date.toISOString();
                }
                if (!result.endDate) {
                    // If no end date found, use start date as end date
                    result.endDate = date.toISOString();
                }
            }
        }
    }

    // Fallback: Try to get address from the page content if not found in JSON-LD
    if (!result.address) {
        const locationElement = document.querySelector('[data-testid="event-location"]');
        if (locationElement) {
            const locationText = locationElement.textContent;
            if (locationText) {
                result.address = {
                    name: locationText.trim(),
                    street: '',
                    city: '',
                    state: '',
                    country: ''
                };
            }
        }
    }

    return result;
} 