import 'dotenv/config';
import express from "express";

import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { setAgentHooks } from "@agentic-profile/common";
import { app } from "@agentic-profile/express-common";

import { routes } from "./dist/routes.js";
import { InMemoryStorage } from "./dist/storage/memory.js";
import { MySQLStorage } from "./dist/storage/mysql/database.js";

const Storage = process.env.AP_STORAGE === 'mysql' ? MySQLStorage : InMemoryStorage;
const port = process.env.PORT || 3004;
const TESTING_DID_PATH = `web:localhost%3A${port}:iam`;
setAgentHooks({
    storage: new Storage(),
    createUserAgentDid: (uid) => `did:${process.env.AP_DID_PATH ?? TESTING_DID_PATH}:${uid}`
});

app.use("/", express.static( join(__dirname, "www") ));
app.use("/", routes());

app.listen(port, () => {
    console.info(`Agentic Profile Presence Service listening on http://localhost:${port}`);
});