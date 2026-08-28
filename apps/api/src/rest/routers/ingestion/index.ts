import { OpenAPIHono } from "@hono/zod-openapi";

import { articleIngestionRouter } from "./articles";
import { publicationBoundsRouter } from "./publication-bounds";
import { ingestionSignalsRouter } from "./signals";
import { sourceSyncRouter } from "./source-sync";

const app = new OpenAPIHono();

app.route("/articles", articleIngestionRouter);
app.route("/signals", ingestionSignalsRouter);
app.route("/sources/publication-bounds", publicationBoundsRouter);
app.route("/sources/sync", sourceSyncRouter);

export const ingestionRouter = app;
