import express, { Request, Response } from "express";

import {
    agentHooks,
    CommonHooks
} from "@agentic-profile/common";
import {
    asyncHandler,
    baseUrl,
    isAdmin,
    prettyJSON,
    resolveAgentSession
} from "@agentic-profile/express-common";

import { saveLocation } from "./locations.js";
import { saveEvent } from "./events.js";
import {
    AgenticEventUpdate,
    AgenticLocationUpdate
} from "./models.js";


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

    router.put( "/locations", asyncHandler( async (req: Request, res: Response) => {
        const agentSession = await resolveAgentSession( req, res );
        if( !agentSession )
            // A 401 has been issued with a challenge, or an auth error has been thrown
            return;

        const { agentDid } = agentSession;
        const result = await saveLocation( agentDid, req.body as AgenticLocationUpdate );

        res.json( result );   
    }));

    router.put( "/events", asyncHandler( async (req: Request, res: Response) => {
        const agentSession = await resolveAgentSession( req, res );
        if( !agentSession )
            // A 401 has been issued with a challenge, or an auth error has been thrown
            return;

        const { agentDid } = agentSession;
        const result = await saveEvent( agentDid, req.body as AgenticEventUpdate );

        res.json( result );      
    }));

    router.get( "/storage", asyncHandler( async (req: Request, res: Response) => {
        if( !isAdmin( req ) )
            throw new Error( "/storage only available to admins" );

        const data = await agentHooks<CommonHooks>().storage.dump();
        res.status(200)
            .set('Content-Type', 'application/json')
            .send( prettyJSON(data) ); // make easier to read ;)
    }));

    return router;
}
