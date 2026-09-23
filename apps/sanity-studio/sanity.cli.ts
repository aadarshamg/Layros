import { defineCliConfig } from "sanity/cli";

export default defineCliConfig({
  api: {
    projectId: "5sa8ov3z",
    dataset: "production",
  },
  // Hosted at https://leyros.sanity.studio — set so `sanity deploy` doesn't
  // prompt for a hostname on future deploys.
  studioHost: "leyros",
});
