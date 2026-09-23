"use client";

import { NextStudio } from "next-sanity/studio";
import config from "../../../../sanity.config";

// Importing sanity.config.ts (and therefore `sanity`/`defineConfig`) has to
// happen behind a "use client" boundary, not in the page.tsx Server
// Component itself — otherwise Next evaluates that whole module graph
// under React's server-only condition, which doesn't provide
// `React.createContext`, and `sanity` needs it at module-evaluation time.
export function AdminStudio() {
  return <NextStudio config={config} />;
}
