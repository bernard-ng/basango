import { OpenAPIHono } from "@hono/zod-openapi";

import { articleIngestionRouter } from "./articles";
import { publicationBoundsRouter } from "./publication-bounds";
import { ingestionSignalsRouter } from "./signals";

const app = new OpenAPIHono();

app.route("/articles", articleIngestionRouter);
app.route("/signals", ingestionSignalsRouter);
app.route("/sources/publication-bounds", publicationBoundsRouter);

export const ingestionRouter = app;
