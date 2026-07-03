/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as billing from "../billing.js";
import type * as cancelSessions from "../cancelSessions.js";
import type * as constants from "../constants.js";
import type * as crons from "../crons.js";
import type * as deflect from "../deflect.js";
import type * as demos from "../demos.js";
import type * as dev from "../dev.js";
import type * as emails from "../emails.js";
import type * as http from "../http.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_hmac from "../lib/hmac.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_sentry from "../lib/sentry.js";
import type * as lib_stripeClient from "../lib/stripeClient.js";
import type * as stripe from "../stripe.js";
import type * as webhooks from "../webhooks.js";
import type * as widget from "../widget.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  billing: typeof billing;
  cancelSessions: typeof cancelSessions;
  constants: typeof constants;
  crons: typeof crons;
  deflect: typeof deflect;
  demos: typeof demos;
  dev: typeof dev;
  emails: typeof emails;
  http: typeof http;
  "lib/auth": typeof lib_auth;
  "lib/hmac": typeof lib_hmac;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/sentry": typeof lib_sentry;
  "lib/stripeClient": typeof lib_stripeClient;
  stripe: typeof stripe;
  webhooks: typeof webhooks;
  widget: typeof widget;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
