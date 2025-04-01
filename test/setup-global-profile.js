import 'dotenv/config';

import os from "os";
import { join } from "path";
import {
    prettyJSON,
    webDidToUrl
} from "@agentic-profile/common";
import {
    createAgenticProfile,
    fetchJson,
    resolvePublicKey,
    saveProfile
} from "@agentic-profile/express-common";


(async ()=>{

    const services = [
        {
            type: "presence",
            url: `https://agents.matchwise.ai/users/*/presence`
        }
    ];
    const { profile, keyring } = await createAgenticProfile({ services });
    const b64uPublicKey = resolvePublicKey( profile );

    let savedProfile;
    try {
    	// publish profile to web (so did:web:... will resolve)
        let { data } = await fetchJson(
            "https://testing.agenticprofile.ai/agentic-profile",
            { profile, b64uPublicKey }
        );
        console.log( 'data', data );
        savedProfile = data.profile;
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
        const dir = join( os.homedir(), ".agentic", "iam", "global-me" );
        await saveProfile({ dir, profile: savedProfile, keyring });
    } catch(error) {
    	console.log( "Failed to save profile", error );
    }
})();