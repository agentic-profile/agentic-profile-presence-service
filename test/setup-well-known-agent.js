import 'dotenv/config';

import { join } from "path";
import {
    prettyJSON,
    webDidToUrl
} from "@agentic-profile/common";
import {
    createAgenticProfile,
    resolvePublicKey,
    saveProfile
} from "@agentic-profile/express-common";
import { __dirname } from "./util.js";


(async ()=>{

	const services = [
        {
            type: "presence-location",
            url: `https://${process.env.AP_HOSTNAME}/locations`
        },
        {
            type: "presence-event",
            url: `https://${process.env.AP_HOSTNAME}/events`
        }
    ];
    const { profile, keyring } = await createAgenticProfile({ services });
    const b64uPublicKey = resolvePublicKey( profile );
    const did = `did:web:${process.env.AP_HOSTNAME}`;
    profile.id = did;

    console.log( `Published agentic profile to:

    ${webDidToUrl(did)}

Or via DID at:

    ${did}
`);

    try {
        // also save locally as "beta" for testing
        let dir = join( __dirname, "..", "www", ".well-known" );
        await saveProfile({ dir, profile });

        dir = join( __dirname, ".." );
        await saveProfile({ dir, keyring });
    } catch(error) {
    	console.log( "Failed to save profile", error );
    }
})();