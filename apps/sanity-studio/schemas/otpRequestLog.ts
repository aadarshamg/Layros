import { defineField, defineType } from "sanity";

// Internal — the server-side OTP send-rate-limit counter (see
// lib/auth/rate-limit.ts in the storefront). Deliberately NOT added to
// sanity.config.ts's structure list, so it never shows up in the Studio
// sidebar; it's bookkeeping, not content anyone edits. _id is
// `otplog-<hex(sha256(key))>` where key is "phone:<10-digit>" or
// "ip:<hashed-ip>" — set by the storefront, never edited here.
export default defineType({
  name: "otpRequestLog",
  title: "OTP Request Log (internal)",
  type: "document",
  fields: [
    defineField({ name: "key", title: "Key", type: "string", readOnly: true }),
    defineField({ name: "count", title: "Count", type: "number", readOnly: true, initialValue: 0 }),
    defineField({ name: "windowStartedAt", title: "Window started at", type: "datetime", readOnly: true }),
    defineField({ name: "lastRequestedAt", title: "Last requested at", type: "datetime", readOnly: true }),
  ],
});
