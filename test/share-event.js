import { join } from "path";
import os from "os";
import { putAgenticPayload } from "./util.js";


(async ()=>{
    const port = process.env.PORT || 3003;

    await putAgenticPayload({
        argv: process.argv,
        profileDir: join( os.homedir(), ".agentic", "iam", "beta" ),
        peerAgentUrl: `http://localhost:${port}/events`,
        payload: {
            eventUrl: "https://lu.ma/zwterele",
            broadcast: false
        }
    });
})();
