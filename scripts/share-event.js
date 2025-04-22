import { prettyJson } from "@agentic-profile/common";
import {
    generateAuthToken,
    resolveVerificationKey,
    sendAgenticPayload,
    signChallenge
} from "@agentic-profile/auth";
import { argv } from "@agentic-profile/express-common";

import { createProfileResolver } from "./util.js";

const ARGV_OPTIONS = {
    broadcast: {
        type: "boolean",
        short: "B"
    },
    eventUrl: {
        type: "string",
        short: "e"
    },
    serviceUrl: {
        type: "string",
        short: "s"
    },
    rsvp: {
        type: "string",
        short: "r"
    }
};

(async ()=>{
    const port = process.env.PORT || 3004;

    const { values } = argv.parseArgs({
        args: process.argv.slice(2),
        options: ARGV_OPTIONS
    });
    const {
        broadcast = false,
        rsvp = "yes",
        serviceUrl = `http://localhost:${port}/events`,
        eventUrl = "https://lu.ma/zwterele"
    } = values;

    try {
        const payload = {
            eventUrl: "https://lu.ma/zwterele",
            rsvp,
            broadcast
        };

        const { profileResolver, myProfileAndKeyring } = await createProfileResolver();
        const agentDid = myProfileAndKeyring.profile.id + "#agent-presence-client";

        const { data } = await sendAgenticPayload({ 
            url: serviceUrl, 
            payload,
            resolveAuthToken: async ( agenticChallenge ) => {
                return generateAuthToken({
                    agentDid,
                    agenticChallenge,
                    profileResolver
                })
            }
        });

        console.log(`Sharing result: ${prettyJson(data)}`);
    } catch( err ) {
        console.log("Sharing failed:", err );
    }
})();
