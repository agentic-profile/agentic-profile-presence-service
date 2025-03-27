import { join } from "path";
import os from "os";
import {
    parseArgs,
    putAgenticPayload
} from "./util.js";

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

    const { values } = parseArgs({
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

    await putAgenticPayload({
        type,
        challenge: { id, secret },
        profileDir: join( os.homedir(), ".agentic", "iam", "beta" ),
        peerAgentUrl,
        payload: { coords }
    });
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