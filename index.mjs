import serverlessExpress from "@codegenie/serverless-express";
import express from "express";
import log from "loglevel";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { app } from "@agentic-profile/express-common";

import { routes } from "./dist/routes.js";
import { MySQLStore } from "./dist/storage/mysql.js";

log.setLevel( process.env.LOG_LEVEL ?? "info" );
console.log( "log level", log.getLevel() );

/*
const port = process.env.PORT || 3004;
const TESTING_DID_PATH = `web:localhost%3A${port}:iam`;
setAgentHooks({
    storage: new MySQLStorage(),
    createUserAgentDid: (uid) => `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`
});
*/

app.use("/", express.static( join(__dirname, "www"), {
    dotfiles: "allow"
} ));

const store = new MySQLStore();
app.use("/", routes( store));

const seHandler = serverlessExpress({ app });
export function handler(event, context, callback ) {
    context.callbackWaitsForEmptyEventLoop = false;
    return seHandler( event, context, callback );
}