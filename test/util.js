import axios from "axios";
import {
    signChallenge,
    createEdDsaJwk
} from "@agentic-profile/auth";
import {
    logAxiosResult,
    prettyJSON
} from "@agentic-profile/express-common";
import { parseArgs as nodeParseArgs } from "util";
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
                type: "Agentic/presence",
                serviceEndpoint,
                capabilityInvocation: [
                    verificationMethod
                ]
            }
        ]
    };

    return { profile, jwk };
}

export function argvToCommand(argv) {
    const program = argv[0].split( sep ).at(-1);
    const script = argv[1].split( sep ).slice(-2).join( sep );

    return `${program} ${script}`;
}

export async function putAgenticPayload({
    type,
    challenge,
    profileDir,     // to load our private keys
    peerAgentUrl,   // `http://localhost:${port}/users/2/agent-chats`
    payload
}) {
    const { profile, keyring } = await loadProfile( profileDir );
    const { privateJwk } = keyring[0];

    const agenticChallenge = {
        challenge
    };

    const agentDid = `${profile.id}#agent-${type}`;
    const attestation = {
        agentDid,
        verificationId: `#agent-${type}-key-0` 
    }

    const authToken = await signChallenge({ agenticChallenge, attestation, privateJwk });
    console.log( "\nCreated agent authorization token:", authToken, agenticChallenge );

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

//
// Utility
// 

export function parseArgs({args, options}) {
    const optionShortToKey = Object.fromEntries(
        Object.entries(options).map(([key, opt]) => [opt.short, key])
    );

    const normalized = [];
    for (let i = 0; i < args.length; i++) {
        const current = args[i];
        const next = args[i + 1];

        // Check if next is a negative number (int or float)
        const isNegativeNumber = /^-\d+(\.\d+)?$/.test(next);

        // If current is a short option like -x and next is a negative number, combine
        if (/^-[a-zA-Z]$/.test(current) && isNegativeNumber ) {
            const key = current[1];
            const optionName = optionShortToKey[key];
            if (options[optionName]?.type === "string") {
                normalized.push(`${current}=${next}`);
                i++; // skip next, already used
                continue;
            }
        }
        normalized.push(current);
    }

    return nodeParseArgs({ args: normalized, options });
}
