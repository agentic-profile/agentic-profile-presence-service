import 'dotenv/config';

import os from "os";
import { join } from "path";
import {
    createEdDsaJwk,
    postJson
} from "@agentic-profile/auth";
import {
    createAgenticProfile,
    prettyJson,
    webDidToUrl
} from "@agentic-profile/common";
import {
    saveProfile
} from "@agentic-profile/express-common";


(async ()=>{

    const services = [
        {
            subtype: "presence-client",
            url: `https://agents.matchwise.ai/users/*/presence`
        }
    ];
    const { profile, keyring, b64uPublicKey } = await createAgenticProfile({
        services,
        createJwk: createEdDsaJwk 
    });

    // hack the profile, so the well-known agentic profile can sign for the presence-client
    const agent = profile.service.find(e=>e.id==="#agent-presence-client");
    if( !agent )
        throw new Error("Failed to find #agent-presence-client agent in profile");
    agent.capabilityInvocation = [ "did:web:presence.p2pagentic.ai#identity-key" ];

    let savedProfile;
    try {
    	// publish profile to web (so did:web:... will resolve)
        let { data } = await postJson(
            "https://testing.agenticprofile.ai/agentic-profile",
            { profile, b64uPublicKey }
        );
        console.log( 'Agentic Profile', prettyJson(data) );
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