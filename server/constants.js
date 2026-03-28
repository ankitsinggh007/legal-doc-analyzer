/* global process */

const maxDocChars = Number.parseInt(process.env.MAX_DOC_CHARS || "", 10);
export const MAX_CHARS =
  Number.isFinite(maxDocChars) && maxDocChars > 0 ? maxDocChars : 60000;
export const RATE_LIMIT_MAX = 5;
export const RATE_LIMIT_WINDOW = "30 m";
