import { prettyJson } from "@agentic-profile/common";
import {
    generateAuthToken,
    sendAgenticPayload,
} from "@agentic-profile/auth";
import { argv } from "@agentic-profile/express-common";
import { createProfileResolver } from "./util.js";


const ARGV_OPTIONS = {
    broadcast: {
        type: "boolean",
        short: "B"
    },
    latitude: {
        type: "string",
        short: "y"
    },
    longitude: {
        type: "string",
        short: "x"
    },
    peerAgentUrl: {
        type: "string",
        short: "a"
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
        latitude,
        longitude,
        peerAgentUrl = `http://localhost:${port}/presence`
    } = values;
    const coords = asCoords( latitude, longitude );

    try {
        const payload = {
            location: {
                broadcast,
                coords,
                query: { withinMeters: 100 }
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

function asCoords( latitude, longitude ) {
    if( latitude === undefined && longitude === undefined )
        return { latitude: 37.334220, longitude: -122.110294 }; // Some defaults
    else return {
        latitude: asNumber( latitude ),
        longitude: asNumber( longitude )
    }
}

function asNumber( s ) {
    return s.charAt(0) === '=' ? Number( s.slice(1) ) : Number( s );
}
