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
    eventUrl: {
        type: "string",
        short: "e"
    },
    id: {
        type: "string",
        short: "i"
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
        eventUrl = "https://lu.ma/zwterele",
        peerAgentUrl = `http://localhost:${port}/events`
    } = values;
    const id = Number( values.id );

    /*
    if( argv.length < 4 ) {
        const command = argvToCommand(argv);
        console.log( `Please provide the challenge 'id' and 'random' from the agent service, such as:\n    ${command} 1 ffgf6sdf76sdf76sdf`);
        return;
    }*/

    await putAgenticPayload({
        type,
        challenge: { id, secret },
        profileDir: join( os.homedir(), ".agentic", "iam", "beta" ),
        peerAgentUrl,
        payload: {
            eventUrl,
            broadcast
        }
    });
})();
