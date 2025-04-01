import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["production", "development"]).default("development"),
  APP_URL: z.string({ required_error: "APP_URL is required" }),

  DATABASE_URL: z.string({ required_error: "DATABASE_URL is required" }),
  DATABASE_AUTH_TOKEN: z.string({ required_error: "DATABASE_AUTH_TOKEN is required" }),

  JWT_ACCESS_SECRET: z.string({ required_error: "ACCESS_SECRET is required" }),
  JWT_REFRESH_SECRET: z.string({ required_error: "REFRESH_SECRET is required" }),

  CACHE_URL: z.string({ required_error: "CACHE_URL is required" }),

  SMTP_HOST: z.string({ required_error: "SMTP_HOST is required" }),
  SMTP_EMAIL: z.string({ required_error: "SMTP_EMAIL is required" })
    .email({ message: "SMTP_EMAIL must be a valid email" }),
  SMTP_PASSWORD: z.string({ required_error: "SMTP_PASSWORD is required" }),

  GW_APP_ID: z.string({ required_error: "GW_APP_ID is required" }),
  GW_PUBLIC_KEY: z.string({ required_error: "GW_PUBLIC_KEY is required" }),
  GW_PRIVATE_KEY: z.string({ required_error: "GW_PRIVATE_KEY is required" }),
});

export type Env = z.infer<typeof schema>;

let parsed: Env;
try {
  parsed = schema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(
      "❌ Invalid environment variables:",
      JSON.stringify(error.errors, null, 2),
    );
  } else {
    console.error("❌ Error parsing environment variables:", error);
  }
  process.exit(1);
}

const env = {
  ...parsed,
  GATEWAY: {
    APP_ID: parsed.GW_APP_ID,
    PUBLIC_KEY: parsed.GW_PUBLIC_KEY,
    PRIVATE_KEY: parsed.GW_PRIVATE_KEY,
  }
};

export default env;
