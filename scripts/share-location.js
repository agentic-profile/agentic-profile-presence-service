import { join } from "path";
import os from "os";
import { prettyJson } from "@agentic-profile/common";
import {
    resolveVerificationKey,
    sendAgenticPayload,
    signChallenge
} from "@agentic-profile/auth";
import {
    argv,
    generateAuthToken,
    loadProfileAndKeyring
} from "@agentic-profile/express-common";


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
    const port = process.env.PORT || 3003;

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

        const { data } = await sendAgenticPayload({ 
            url: peerAgentUrl, 
            payload,
            resolveAuthToken: async ( agenticChallenge ) => {
                return generateAuthToken({
                    agentSubtype: "presence",
                    agenticChallenge,
                    profileDir: join( os.homedir(), ".agentic", "iam", "global-me" )
                })
            }
        });

        console.log(`Sharing result: ${prettyJson(data)}`);
    } catch( err ) {
        console.log(`Sharing failed: ${err}` );
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
