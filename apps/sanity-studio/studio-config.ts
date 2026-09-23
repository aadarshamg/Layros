import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";
import SalesAnalytics from "./tools/SalesAnalytics";

/**
 * Shared by both the standalone Studio deployment (sanity.config.ts,
 * deployed to leyros.sanity.studio) and the embedded one at
 * apps/storefront's /admin route — one definition of the structure/tools/
 * schema so the two never drift apart.
 */
export function createStudioConfig(options: { projectId: string; dataset: string; basePath?: string }) {
  return defineConfig({
    name: "leyros",
    title: "Leyros Admin",
    projectId: options.projectId,
    dataset: options.dataset,
    basePath: options.basePath,
    plugins: [
      structureTool({
        // Day-to-day tasks (products, shoppable videos) come first; the
        // three blog-related types are tucked into one "Journal" group below
        // so the sidebar isn't five equally-weighted items for someone who
        // only ever touches two of them.
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
      // The Vision tool (a raw GROQ query console) is a developer tool with
      // no use for day-to-day content editing — omitted so it doesn't show
      // up as a confusing extra tab.
    ],
    tools: [
      {
        name: "sales-analytics",
        title: "Analytics",
        component: SalesAnalytics,
      },
    ],
    schema: {
      types: schemaTypes,
    },
  });
}
