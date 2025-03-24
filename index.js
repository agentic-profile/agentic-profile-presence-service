import express from "express";
import serverlessExpress from "@codegenie/serverless-express";

import { routes } from "./dist/routes.js";
import app from "./dist/app.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/", express.static( join(__dirname, "www") ));

app.use("/", routes());

const seHandler = serverlessExpress({ app });
export function handler(event, context, callback ) {
    context.callbackWaitsForEmptyEventLoop = false;
    return seHandler( event, context, callback );
}