import { defineConfig, type SchemaTypeDefinition } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes as sharedSchemaTypes } from "sanity-studio/schemas";

// Schema field definitions (schemaTypes) are plain data — defineField/
// defineType build ordinary JS objects, no React involved — so importing
// them straight from the sanity-studio workspace package is safe at
// runtime and keeps the two Studios in sync automatically. The cast is
// needed because they're typed against sanity-studio's own `sanity`
// install (see note below on the React version split), which TypeScript
// treats as structurally distinct from this app's `sanity` types even
// though the actual objects are identical.
const schemaTypes = sharedSchemaTypes as unknown as SchemaTypeDefinition[];
//
// The structure/plugin wiring below is NOT imported from sanity-studio,
// even though it's nearly identical to apps/sanity-studio/studio-config.ts.
// apps/sanity-studio pins React 18 (Sanity Studio v3's supported version)
// while this app is on React 19, so pnpm resolves two separate copies of
// `sanity` and `react`. Schema data doesn't care which copy touches it, but
// structureTool()/defineConfig() actually execute React internals (context,
// hooks) at call time — calling them via sanity-studio's copy from inside
// this app's server-render/build process crashed with
// "createContext is not a function", a classic duplicate-React symptom.
// Calling them here, through this app's own `sanity` install, avoids that
// entirely. If the two structures drift, update both — small/rare enough
// not to be worth the fragility of sharing the executable code.
export default defineConfig({
  name: "leyros",
  title: "Leyros Admin",
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "",
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "production",
  basePath: "/admin",
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title("Content")
          .items([
            S.documentTypeListItem("order")
              .title("Orders")
              .child(S.documentList().title("Orders").filter('_type == "order"').defaultOrdering([{ field: "_createdAt", direction: "desc" }])),
            S.documentTypeListItem("customer")
              .title("Customers")
              .child(S.documentList().title("Customers").filter('_type == "customer"').defaultOrdering([{ field: "_createdAt", direction: "desc" }])),
            S.documentTypeListItem("product").title("Products"),
            S.documentTypeListItem("shoppableVideo").title("Shoppable Videos"),
            S.documentTypeListItem("coupon").title("Coupons"),
            S.documentTypeListItem("review")
              .title("Google Reviews")
              .child(S.documentList().title("Google Reviews").filter('_type == "review"').defaultOrdering([{ field: "publishTime", direction: "desc" }])),
            S.listItem()
              .title("Store Settings")
              .child(S.document().schemaType("storeSettings").documentId("storeSettings")),
            S.divider(),
            S.listItem()
              .title("Journal (blog)")
              .child(
                S.list()
                  .title("Journal")
                  .items([
                    S.documentTypeListItem("post").title("Posts"),
                    S.documentTypeListItem("author").title("Authors"),
                    S.documentTypeListItem("category").title("Categories"),
                  ]),
              ),
          ]),
    }),
    // Sales analytics is standalone-Studio-only for now (leyros.sanity.studio)
    // — it's a client-hooks-heavy tool, and porting it here means either
    // duplicating the component or hitting the same duplicate-React problem.
  ],
  schema: {
    types: schemaTypes,
  },
});
