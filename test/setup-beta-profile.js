import 'dotenv/config';

import os from "os";
import { join } from "path";
import {
    prettyJSON,
    webDidToUrl
} from "@agentic-profile/common";
import {
    createAgenticProfile,
    saveProfile
} from "@agentic-profile/express-common";


(async ()=>{

    const { profile, keyring } = await createAgenticProfile({ services: [
        { type: "presence", url: "https://agents.matchwise.ai/users/2/presence" }
    ]});
    const b64uPublicKey = profile.verificationMethod[0].publicKeyJwk.x;

    let savedProfile;
    try {
    	// publish profile to web (so did:web:... will resolve)
        const response = await fetch( "https://testing.agenticprofile.ai/agentic-profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            body: JSON.stringify({ profile, b64uPublicKey })
        });
        if( !response.ok )
            throw new Error(`Failed to publish profile ${response.status}`);
        ({ profile: savedProfile } = await response.json());
        const did = savedProfile.id;
        console.log( `Published agentic profile to:

    ${webDidToUrl(did)}

Or via DID at:

    ${did}
`);
    } catch (error) {
        console.log( "Failed to publish profile", error );
        return;
    }

    try {
        // also save locally as "beta" for testing
        const dir = join( os.homedir(), ".agentic", "iam", "beta" );
        await saveProfile({ dir, profile: savedProfile, keyring });
    } catch(error) {
    	console.log( "Failed to save profile", error );
    }
})();