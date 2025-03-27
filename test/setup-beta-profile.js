import 'dotenv/config';
import axios from "axios";

import os from "os";
import { join } from "path";
import { webDidToUrl } from "@agentic-profile/common";
import {
    logAxiosResult,
    prettyJSON,
} from "@agentic-profile/express-common";

import {
    createAgenticProfile,
    saveProfile
} from "./util.js";


(async ()=>{

    const { profile, jwk } = await createAgenticProfile( `https://agents.matchwise.ai/users/2/presence` );
    const { b64uPublicKey } = jwk;

    let savedProfile;
    try {
    	// publish profile to web (so did:web:... will resolve)
        const axiosResult = await axios.post(
        	"https://testing.agenticprofile.ai/agentic-profile",
        	{ profile, b64uPublicKey }
        );
        const data = axiosResult.data ?? axiosResult.response?.data;
        savedProfile = data.profile;
        const did = savedProfile.id;
        console.log( `Published agentic profile to:

    ${webDidToUrl(did)}

Or via DID at:

    ${did}
`);
    } catch (error) {
        logAxiosResult( error );
        console.log( "Failed to publish profile" );
    }

    try {
        // also save locally as "beta" for testing
        const dir = join( os.homedir(), ".agentic", "iam", "beta" );
        await saveProfile({ dir, profile: savedProfile, keyring: [jwk] });
    } catch(error) {
    	console.log( "Failed to save profile", error );
    }
})();