import { createStudioConfig } from "./studio-config";

export default createStudioConfig({
  projectId: process.env.SANITY_STUDIO_PROJECT_ID || "",
  dataset: process.env.SANITY_STUDIO_DATASET || "production",
});
