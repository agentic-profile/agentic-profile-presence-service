import express, { Request, Response } from "express";

import {
    createDidResolver,
    prettyJson
} from "@agentic-profile/common";
import {
    asyncHandler,
    baseUrl,
    isAdmin,
} from "@agentic-profile/express-common";

import { UnifiedStore } from "./storage/models.js";
import { createPresenceRouter } from "./mcp/presence/router.js";


export function routes( store: UnifiedStore ) {
    const didResolver = createDidResolver({ store });
    const router = express.Router();

    const runningSince = new Date();
    router.get( "/status", function( req: Request, res: Response ) {
        res.json({
            name:"Agentic Profile Presence Service",
            version:[1,0,0], 
            started: runningSince,
            url:baseUrl(req) 
        }); 
    });

    router.use( "/mcp/presence", createPresenceRouter( didResolver, store ) );

    router.get( "/storage", asyncHandler( async (req: Request, res: Response) => {
        if( !isAdmin( req ) )
            throw new Error( "/storage only available to admins" );

        const data = await store.dump();
        res.status(200)
            .set('Content-Type', 'application/json')
            .send( prettyJson(data) ); // make easier to read ;)
    }));

    return router;
}
