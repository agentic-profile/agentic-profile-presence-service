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
    peerAgentUrl: {
        type: "string",
        short: "a"
    }
};

(async ()=>{
    const port = process.env.PORT || 3003;

    const { values } = argv.parseArgs({
        args: process.argv.slice(2),
        options: ARGV_OPTIONS
    });
    const {
        broadcast = false,
        peerAgentUrl = `http://localhost:${port}/presence`
    } = values;

    try {
        const payload = {
            events: {
                eventUrls: [ "https://lu.ma/zwterele" ]
            }
        };

        const { profileResolver, myProfileAndKeyring } = await createProfileResolver();
        const agentDid = myProfileAndKeyring.profile.id + "#agent-presence-client";

        const { data } = await sendAgenticPayload({ 
            url: peerAgentUrl, 
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
