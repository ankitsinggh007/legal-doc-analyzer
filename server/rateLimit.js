/* global process */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { RATE_LIMIT_MAX, RATE_LIMIT_WINDOW } from "./constants.js";

let ratelimit;

function getRatelimit() {
  if (ratelimit) return ratelimit;

  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    throw new Error(
      "Server misconfigured: UPSTASH_REDIS_REST_URL/TOKEN is missing."
    );
  }

  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(RATE_LIMIT_MAX, RATE_LIMIT_WINDOW),
  });

  return ratelimit;
}

export async function checkRateLimit(identity) {
  const limiter = getRatelimit();
  return limiter.limit(identity);
}
