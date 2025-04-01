import serverlessExpress from "@codegenie/serverless-express";
import express from "express";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { setAgentHooks } from "@agentic-profile/common";
import { app } from "@agentic-profile/express-common";

import { routes } from "./dist/routes.js";

import { MySQLStorage } from "./dist/storage/mysql/database.js";


const port = process.env.PORT || 3003;
const TESTING_DID_PATH = `web:localhost%3A${port}:iam`;
setAgentHooks({
    storage: new MySQLStorage(),
    createUserAgentDid: (uid) => `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`
});

app.use("/", express.static( join(__dirname, "www") ));
app.use("/", routes());

const seHandler = serverlessExpress({ app });
export function handler(event, context, callback ) {
    context.callbackWaitsForEmptyEventLoop = false;
    return seHandler( event, context, callback );
}