import { join } from "path";
import os from "os";
import {
    argv,
    sendAgenticPayload
} from "@agentic-profile/express-common";
import { prettyJSON } from "@agentic-profile/common";

const ARGV_OPTIONS = {
    broadcast: {
        type: "boolean",
        short: "B"
    },
    id: {
        type: "string",
        short: "i"
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
    },
    secret: {
        type: "string",
        short: "s"
    },
    type: {
        type: "string",
        short: "t"
    }
};

(async ()=>{
    const port = process.env.PORT || 3003;

    const { values } = argv.parseArgs({
        args: process.argv.slice(2),
        options: ARGV_OPTIONS
    });
    const {
        type = "presence",
        secret,
        broadcast = false,
        peerAgentUrl = `http://localhost:${port}/locations`,
        latitude,
        longitude
    } = values;
    const id = Number( values.id );
    const coords = asCoords( latitude, longitude );

    const response = await sendAgenticPayload({
        type,
        challenge: { id, secret },
        profileDir: join( os.homedir(), ".agentic", "iam", "beta" ),
        peerAgentUrl,
        payload: { coords }
    });

    if( !response.ok )
        console.log(`ERROR: Sharing failed: ${response.status}`);
    else {
        const result = await response.json();
        console.log( `Result: ${prettyJSON(result)}` );
    }
})();

function asCoords( latitude, longitude ) {
    if( latitude === undefined && longitude === undefined )
        return { latitude: 37.334220, longitude: -122.110294 };
    else return {
        latitude: asNumber( latitude ),
        longitude: asNumber( longitude )
    }
}

function asNumber( s ) {
    return s.charAt(0) === '=' ? Number( s.slice(1) ) : Number( s );
}