import { env } from "@basango/domain/config";
import { logger } from "@basango/logger";

import { auth } from "#api/auth";

const email = env.BASANGO_ADMIN_EMAIL?.trim();
const name = env.BASANGO_ADMIN_NAME?.trim();
const password = env.BASANGO_ADMIN_PASSWORD;

if (!email || !name || !password) {
  throw new Error(
    "BASANGO_ADMIN_EMAIL, BASANGO_ADMIN_NAME, and BASANGO_ADMIN_PASSWORD are required.",
  );
}

const result = await auth.api.createUser({
  body: {
    email,
    name,
    password,
    role: "admin",
  },
});

logger.info({ email: result.user.email, userId: result.user.id }, "Created Better Auth admin");
