import 'dotenv/config';
import express from "express";
import log from "loglevel";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { app } from "@agentic-profile/express-common";

import { routes } from "./dist/routes.js";
import { InMemoryStore } from "./dist/storage/memory.js";
import { MySQLStore } from "./dist/storage/mysql.js";

log.setLevel( process.env.LOG_LEVEL ?? "trace" );
console.log( "log level", log.getLevel() );

const StoreClass = process.env.AP_STORAGE === 'mysql' ? MySQLStore : InMemoryStore;
const store = new StoreClass();
const port = process.env.PORT || 3004;

app.use("/", express.static( join(__dirname, "www") ));
app.use("/", routes( store ));

app.listen(port, () => {
    console.info(`Agentic Profile Presence Service listening on http://localhost:${port}`);
});