console.log( 'Running Node locally...' );

import 'dotenv/config';
import express from "express";
import { routes } from "./dist/routes.js";
import app from "./dist/app.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use("/", express.static( join(__dirname, "www") ));

app.use("/", routes() );

const port = process.env.PORT || 3003;
app.listen(port, () => {
    console.info(`Agentic Profile Presence Service listening on http://localhost:${port}`);
});