import axios from "axios";
import {
    signChallenge,
    createEdDsaJwk
} from "@agentic-profile/auth";
import {
    logAxiosResult,
    prettyJSON
} from "@agentic-profile/express-common";
import { fileURLToPath } from "url";
import { dirname, join, sep } from "path";
import { readFile, mkdir, writeFile } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);


export async function createAgenticProfile( serviceEndpoint ) {
    const jwk = await createEdDsaJwk();
    const verificationMethod = {
        id: "#agent-presence-key-0",
        type: "JsonWebKey2020",
        publicKeyJwk: jwk.publicJwk
    };

    const profile = {
        "@context": [
            "https://www.w3.org/ns/did/v1",
            "https://w3id.org/security/suites/jws-2020/v1",
            "https://iamagentic.org/ns/agentic-profile/v1"
        ],
        //id: did,
        //name: "Atlas",
        verificationMethod: [],
        service:[
            {
                id: "#agent-presence",
                type: "Agentic/Presence",
                serviceEndpoint,
                capabilityInvocation: [
                    verificationMethod
                ]
            }
        ]
    };

    return { profile, jwk };
}

function argvToCommand(argv) {
    const program = argv[0].split( sep ).at(-1);
    const script = argv[1].split( sep ).slice(-2).join( sep );

    return `${program} ${script}`;
}

export async function putAgenticPayload({
    argv,
    profileDir,     // to load our private keys
    peerAgentUrl,   // `http://localhost:${port}/users/2/agent-chats`
    payload
}) {
    if( argv.length < 4 ) {
        const command = argvToCommand(argv);
        console.log( `Please provide the challenge 'id' and 'random' from the agent service, such as:\n    ${command} 1 ffgf6sdf76sdf76sdf`);
        return;
    }
    const id = Number(argv[2].trim());
    const random = argv[3].trim();

    const { profile, keyring } = await loadProfile( profileDir );
    const { privateJwk } = keyring[0];

    // Authenticating with an agent of user 2 on localhost
    const agenticChallenge = {
        challenge: { id, random }
    };

    const agentDid = `${profile.id}#agent-presence`;
    const attestation = {
        agentDid,
        verificationId: "#agent-presence-key-0" 
    }

    const authToken = await signChallenge({ agenticChallenge, attestation, privateJwk });
    console.log( "\nCreated agent authorization token:", authToken );

    const auth = {
        headers: {
            Authorization: 'Agentic ' + authToken
        }
    }

    try {
        const result = await axios.put(
            peerAgentUrl,
            payload,
            auth
        );

        logAxiosResult( result );
    } catch (error) {
        logAxiosResult( error );
        console.error("ERROR: Failed to PUT payload");
    }   
}

export async function saveProfile({ dir, profile, keyring }) {
    await mkdir(dir, { recursive: true });

    const profilePath = join(dir, "did.json");
    await writeFile(
        profilePath,
        prettyJSON( profile ),
        "utf8"
    );

    const keyringPath = join(dir, "keyring.json");
    await writeFile(
        keyringPath,
        prettyJSON( keyring ),
        "utf8"
    );  

    return { profilePath, keyringPath }
}

export async function loadProfile( dir ) {
    let buffer = await readFile( join( dir, "did.json") );
    const profile = JSON.parse( buffer );

    buffer = await readFile( join( dir, "keyring.json") );
    const keyring = JSON.parse( buffer );

    return { profile, keyring };
}