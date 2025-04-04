import express, { Request, Response } from "express";

import {
    agentHooks,
    CommonHooks,
    prettyJson
} from "@agentic-profile/common";
import {
    asyncHandler,
    baseUrl,
    isAdmin,
    resolveAgentSession
} from "@agentic-profile/express-common";

import { saveLocation } from "./locations.js";
import { saveEvents } from "./events.js";
import { PresenceUpdate } from "./models.js";


export function routes() {
    var router = express.Router();

    const runningSince = new Date();
    router.get( "/status", function( req: Request, res: Response ) {
        res.json({
            name:"Agentic Profile Presence Service",
            version:[1,0,0], 
            started: runningSince,
            url:baseUrl(req) 
        }); 
    });

    router.put( "/presence", asyncHandler( async (req: Request, res: Response) => {
        const agentSession = await resolveAgentSession( req, res );
        if( !agentSession )
            // A 401 has been issued with a challenge, or an auth error has been thrown
            return;

        const { agentDid } = agentSession;
        const { location, events } = req.body as PresenceUpdate;

        const result = {} as any;
        if( location )
            result.location = await saveLocation( agentDid, location );
        if( events )
            result.events = await saveEvents( agentDid, events );

        res.json( result );   
    }));

    router.get( "/storage", asyncHandler( async (req: Request, res: Response) => {
        if( !isAdmin( req ) )
            throw new Error( "/storage only available to admins" );

        const data = await agentHooks<CommonHooks>().storage.dump();
        res.status(200)
            .set('Content-Type', 'application/json')
            .send( prettyJson(data) ); // make easier to read ;)
    }));

    return router;
}
