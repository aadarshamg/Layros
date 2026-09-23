import { defineRailway, github, project, service } from "railway/iac";

export default defineRailway(() => {
  const web = service("web", {
    source: github("aadarshamg/Layros"),
    build: "pnpm run build",
  });

  return project("Leyros Perfume Website", {
    resources: [web],
  });
});
