import type { MedusaContainer } from "@medusajs/framework/types";
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils";
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductOptionsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createStoresWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
} from "@medusajs/medusa/core-flows";
import { PERFUME_DETAILS_MODULE } from "../modules/perfume-details";
import type PerfumeDetailsModuleService from "../modules/perfume-details/service";

/**
 * Demo catalog for local dev / Phase 1 verification (plan §2 step 4, §9).
 * Run with: npm run seed --workspace=apps/medusa (needs DATABASE_URL set
 * and migrations applied first — see plan §2).
 *
 * Idempotent by design (checks for an existing named resource before
 * creating one) — safe to re-run, e.g. after fixing an error partway
 * through a previous run, without creating duplicate stores/regions/etc.
 */
export default async function seed({ container }: { container: MedusaContainer }) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const link = container.resolve(ContainerRegistrationKeys.LINK);
  const query = container.resolve(ContainerRegistrationKeys.QUERY);
  const fulfillmentModuleService = container.resolve(Modules.FULFILLMENT);
  const productModuleService = container.resolve(Modules.PRODUCT);
  const salesChannelModuleService = container.resolve(Modules.SALES_CHANNEL);
  const apiKeyModuleService = container.resolve(Modules.API_KEY);
  const storeModuleService = container.resolve(Modules.STORE);
  const regionModuleService = container.resolve(Modules.REGION);
  const taxModuleService = container.resolve(Modules.TAX);
  const stockLocationModuleService = container.resolve(Modules.STOCK_LOCATION);
  const perfumeDetailsService: PerfumeDetailsModuleService = container.resolve(
    PERFUME_DETAILS_MODULE,
  );

  logger.info("Seeding store, region and sales channel (India, INR)...");

  let salesChannel = (
    await salesChannelModuleService.listSalesChannels({ name: "Leyros Online Store" })
  )[0];
  let salesChannelIsNew = false;
  if (!salesChannel) {
    salesChannel = (
      await createSalesChannelsWorkflow(container).run({
        input: { salesChannelsData: [{ name: "Leyros Online Store" }] },
      })
    ).result[0];
    salesChannelIsNew = true;
  }

  let publishableApiKey = (await apiKeyModuleService.listApiKeys({ title: "Storefront" }))[0];
  if (!publishableApiKey) {
    publishableApiKey = (
      await createApiKeysWorkflow(container).run({
        input: {
          api_keys: [{ title: "Storefront", type: "publishable", created_by: "" }],
        },
      })
    ).result[0];
    await linkSalesChannelsToApiKeyWorkflow(container).run({
      input: { id: publishableApiKey.id, add: [salesChannel.id] },
    });
  }
  logger.info(`Publishable API key: ${publishableApiKey.token}`);

  if (!(await storeModuleService.listStores({ name: "Leyros Perfume" }))[0]) {
    await createStoresWorkflow(container).run({
      input: {
        stores: [
          {
            name: "Leyros Perfume",
            supported_currencies: [{ currency_code: "inr", is_default: true }],
            default_sales_channel_id: salesChannel.id,
          },
        ],
      },
    });
  }

  let region = (await regionModuleService.listRegions({ name: "India" }))[0];
  if (!region) {
    region = (
      await createRegionsWorkflow(container).run({
        input: {
          regions: [
            {
              name: "India",
              currency_code: "inr",
              countries: ["in"],
              // Confirm the registered id for our custom mock provider via
              // `GET /store/payment-providers` once the dev server is running
              // (plan §9 Phase 2 verification), then add it here alongside
              // the built-in system default.
              payment_providers: ["pp_system_default"],
            },
          ],
        },
      })
    ).result[0];
  }

  if (!(await taxModuleService.listTaxRegions({ country_code: "in" }))[0]) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "in", provider_id: "tp_system" }],
    });
  }
  logger.info(`India region id (set as MEDUSA_INDIA_REGION_ID in the storefront's .env): ${region.id}`);

  logger.info("Seeding stock location and shipping options...");

  let stockLocation = (
    await stockLocationModuleService.listStockLocations({ name: "Leyros Warehouse" })
  )[0];
  if (!stockLocation) {
    stockLocation = (
      await createStockLocationsWorkflow(container).run({
        input: {
          locations: [
            {
              name: "Leyros Warehouse",
              address: { city: "New Delhi", country_code: "IN", address_1: "" },
            },
          ],
        },
      })
    ).result[0];

    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
    });
    await linkSalesChannelsToStockLocationWorkflow(container).run({
      input: { id: stockLocation.id, add: [salesChannel.id] },
    });
  }

  let shippingProfile = (
    await fulfillmentModuleService.listShippingProfiles({ name: "Default" })
  )[0];
  if (!shippingProfile) {
    shippingProfile = (
      await createShippingProfilesWorkflow(container).run({
        input: { data: [{ name: "Default", type: "default" }] },
      })
    ).result[0];
  }

  let fulfillmentSet = (
    await fulfillmentModuleService.listFulfillmentSets({ name: "India delivery" })
  )[0];
  if (!fulfillmentSet) {
    fulfillmentSet = await fulfillmentModuleService.createFulfillmentSets({
      name: "India delivery",
      type: "shipping",
      service_zones: [
        { name: "India", geo_zones: [{ country_code: "in", type: "country" }] },
      ],
    });
    await link.create({
      [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
      [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
    });
  }

  if (
    !(await fulfillmentModuleService.listShippingOptions({ name: ["Standard", "Express"] }))
      .length
  ) {
    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: "Standard",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: { label: "Standard", description: "3-5 business days.", code: "standard" },
          prices: [{ currency_code: "inr", amount: 99 }, { region_id: region.id, amount: 99 }],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
        {
          name: "Express",
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: fulfillmentSet.service_zones[0].id,
          shipping_profile_id: shippingProfile.id,
          type: { label: "Express", description: "Next business day.", code: "express" },
          prices: [{ currency_code: "inr", amount: 249 }, { region_id: region.id, amount: 249 }],
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    });
  }

  logger.info("Seeding product options and demo catalog...");

  // Named "Bottle Size" (not "Size") because Medusa's create-medusa-app
  // default template also creates a global "Size" product option — the
  // titles collide across the whole product module, not just per-product.
  let sizeOption = (await productModuleService.listProductOptions({ title: "Bottle Size" }))[0];
  if (!sizeOption) {
    sizeOption = (
      await createProductOptionsWorkflow(container).run({
        input: {
          product_options: [
            { title: "Bottle Size", values: ["30ml", "50ml", "100ml", "5ml sample"] },
          ],
        },
      })
    ).result[0];
  }

  interface DemoPerfume {
    title: string;
    handle: string;
    brand: string;
    description: string;
    story: string;
    concentration: "EDT" | "EDP" | "PARFUM";
    family: "floral" | "woody" | "oriental" | "fresh" | "gourmand";
    gender: "feminine" | "masculine" | "unisex";
    intensity: "light" | "moderate" | "strong";
    notesTop: string[];
    notesHeart: string[];
    notesBase: string[];
    perfumer: string;
    tags: string[];
    image: string;
    prices: { "30ml": number; "50ml": number; "100ml": number };
  }

  const demoPerfumes: DemoPerfume[] = [
    {
      title: "Oud Royale",
      handle: "oud-royale",
      brand: "Leyros",
      description: "A commanding oud wrapped in smoked amber and warm spice.",
      story: "Composed as a tribute to the great oud houses, softened for modern wear.",
      concentration: "PARFUM",
      family: "oriental",
      gender: "unisex",
      intensity: "strong",
      notesTop: ["Saffron", "Pink Pepper"],
      notesHeart: ["Oud", "Rose"],
      notesBase: ["Amber", "Sandalwood", "Musk"],
      perfumer: "Amara Lindqvist",
      tags: ["evening", "sensual", "signature"],
      image: "https://images.unsplash.com/photo-1541643600914-78b084683601?w=1200",
      prices: { "30ml": 6500, "50ml": 9800, "100ml": 15800 },
    },
    {
      title: "Velvet Iris",
      handle: "velvet-iris",
      brand: "Leyros",
      description: "Powdery iris and violet over a bed of soft suede musk.",
      story: "An ode to quiet luxury — restrained, elegant, unforgettable.",
      concentration: "EDP",
      family: "floral",
      gender: "feminine",
      intensity: "moderate",
      notesTop: ["Violet Leaf", "Bergamot"],
      notesHeart: ["Iris", "Peony"],
      notesBase: ["Suede", "Musk", "Cedar"],
      perfumer: "Amara Lindqvist",
      tags: ["day", "romantic", "signature"],
      image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=1200",
      prices: { "30ml": 5800, "50ml": 8600, "100ml": 13500 },
    },
    {
      title: "Citrus Verveine",
      handle: "citrus-verveine",
      brand: "Leyros",
      description: "Sun-bright verbena and lemon over a clean vetiver base.",
      story: "A morning ritual bottled — crisp, energising, effortless.",
      concentration: "EDT",
      family: "fresh",
      gender: "unisex",
      intensity: "light",
      notesTop: ["Verbena", "Lemon", "Bergamot"],
      notesHeart: ["Mint", "Green Tea"],
      notesBase: ["Vetiver", "White Musk"],
      perfumer: "Théo Marchand",
      tags: ["day", "casual", "occasion-signature"],
      image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200",
      prices: { "30ml": 4200, "50ml": 6200, "100ml": 9800 },
    },
    {
      title: "Amber Noir",
      handle: "amber-noir",
      brand: "Leyros",
      description: "Dark amber, tobacco leaf and vanilla for a magnetic evening trail.",
      story: "Limited-edition — a study in warmth and depth.",
      concentration: "PARFUM",
      family: "gourmand",
      gender: "masculine",
      intensity: "strong",
      notesTop: ["Cardamom", "Bergamot"],
      notesHeart: ["Tobacco Leaf", "Cacao"],
      notesBase: ["Amber", "Vanilla", "Benzoin"],
      perfumer: "Théo Marchand",
      tags: ["evening", "sensual", "limited"],
      image: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?w=1200",
      prices: { "30ml": 7200, "50ml": 10800, "100ml": 17500 },
    },
  ];

  const uniqueTagValues = [...new Set(demoPerfumes.flatMap((perfume) => perfume.tags))];
  const existingTags = await productModuleService.listProductTags({ value: uniqueTagValues });
  const tagIdByValue = new Map(existingTags.map((tag) => [tag.value, tag.id]));
  const missingTagValues = uniqueTagValues.filter((value) => !tagIdByValue.has(value));
  if (missingTagValues.length) {
    const createdTags = await productModuleService.createProductTags(
      missingTagValues.map((value) => ({ value })),
    );
    for (const tag of createdTags) tagIdByValue.set(tag.value, tag.id);
  }

  const createdProducts: { id: string; handle: string }[] = [];

  for (const perfume of demoPerfumes) {
    let product = (await productModuleService.listProducts({ handle: perfume.handle }))[0];
    if (!product) {
      product = (
        await createProductsWorkflow(container).run({
          input: {
            products: [
              {
                title: perfume.title,
                handle: perfume.handle,
                description: perfume.description,
                status: ProductStatus.PUBLISHED,
                shipping_profile_id: shippingProfile.id,
                images: [{ url: perfume.image }],
                options: [
                  { id: sizeOption.id, title: "Bottle Size", values: ["30ml", "50ml", "100ml"] },
                ],
                tag_ids: perfume.tags.map((value) => tagIdByValue.get(value)!),
                variants: (["30ml", "50ml", "100ml"] as const).map((size) => ({
                  title: size,
                  sku: `${perfume.handle.toUpperCase()}-${size}`,
                  options: { "Bottle Size": size },
                  prices: [{ amount: perfume.prices[size], currency_code: "inr" }],
                })),
                sales_channels: [{ id: salesChannel.id }],
              },
            ],
          },
        })
      ).result[0];

      await perfumeDetailsService.createPerfumeDetails([{
        product_id: product.id,
        concentration: perfume.concentration,
        family: perfume.family,
        gender: perfume.gender,
        intensity: perfume.intensity,
        notes_top: perfume.notesTop,
        notes_heart: perfume.notesHeart,
        notes_base: perfume.notesBase,
        perfumer: perfume.perfumer,
        story: perfume.story,
        is_limited: perfume.tags.includes("limited"),
        sample_eligible: false,
      }]);
    }

    createdProducts.push({ id: product.id, handle: perfume.handle });

    // Discovery sample (plan §3: a real, separate product flagged sample_eligible
    // + sample_of_product_id, credited automatically at checkout — see
    // src/modules/sample-credit/apply-sample-credit.ts).
    const sampleHandle = `${perfume.handle}-sample`;
    let sampleProduct = (await productModuleService.listProducts({ handle: sampleHandle }))[0];
    if (sampleProduct) continue;

    sampleProduct = (
      await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: `${perfume.title} — Discovery Sample (5ml)`,
              handle: sampleHandle,
              description: `A 5ml discovery sample of ${perfume.title}.`,
              status: ProductStatus.PUBLISHED,
              shipping_profile_id: shippingProfile.id,
              images: [{ url: perfume.image }],
              options: [{ id: sizeOption.id, title: "Bottle Size", values: ["5ml sample"] }],
              variants: [
                {
                  title: "5ml sample",
                  sku: `${perfume.handle.toUpperCase()}-SAMPLE-5ML`,
                  options: { "Bottle Size": "5ml sample" },
                  prices: [
                    { amount: Math.round(perfume.prices["30ml"] * 0.12), currency_code: "inr" },
                  ],
                },
              ],
              sales_channels: [{ id: salesChannel.id }],
            },
          ],
        },
      })
    ).result[0];

    await perfumeDetailsService.createPerfumeDetails([{
      product_id: sampleProduct.id,
      concentration: perfume.concentration,
      family: perfume.family,
      gender: perfume.gender,
      intensity: perfume.intensity,
      notes_top: perfume.notesTop,
      notes_heart: perfume.notesHeart,
      notes_base: perfume.notesBase,
      perfumer: perfume.perfumer,
      is_limited: false,
      sample_eligible: true,
      sample_of_product_id: product.id,
    }]);
  }

  // Retire the original demo catalog now that the storefront's redesign
  // (see apps/storefront/src/lib/data/editorial-products.ts) ships its own
  // named line — draft rather than delete, so nothing is destroyed and the
  // Store API (which only lists published products) stops surfacing them.
  const legacyHandles = demoPerfumes.flatMap((p) => [p.handle, `${p.handle}-sample`]);
  const legacyProducts = await productModuleService.listProducts({ handle: legacyHandles });
  const legacyToDraft = legacyProducts.filter((p) => p.status !== ProductStatus.DRAFT);
  if (legacyToDraft.length) {
    await productModuleService.updateProducts(
      { id: legacyToDraft.map((p) => p.id) },
      { status: ProductStatus.DRAFT },
    );
    logger.info(`Drafted ${legacyToDraft.length} legacy demo products.`);
  }

  logger.info("Seeding editorial catalog (matches the storefront redesign)...");

  interface EditorialPerfume {
    title: string;
    handle: string;
    description: string;
    story: string;
    concentration: "EDT" | "EDP" | "PARFUM";
    family: "floral" | "woody" | "oriental" | "fresh" | "gourmand";
    gender: "feminine" | "masculine" | "unisex";
    intensity: "light" | "moderate" | "strong";
    notesTop: string[];
    notesHeart: string[];
    notesBase: string[];
    perfumer: string;
    isLimited: boolean;
    tags: string[];
    images: string[];
    variants: { sizeMl: number; price: number }[];
  }

  // Mirrors apps/storefront/src/lib/data/editorial-products.ts exactly —
  // that file's editorial fallback becomes a true fallback (used only if
  // Medusa is unreachable) once these are the live, published products.
  const editorialPerfumes: EditorialPerfume[] = [
    {
      title: "Nuit Dorée",
      handle: "nuit-doree",
      description:
        "A nocturnal ode to liquid gold, blending rare Kashmiri saffron, aged Mysore sandalwood, velvety Kannauj damask rose, and wild Assam ambergris.",
      story:
        "Composed as twilight in a flacon: luminous saffron gives way to rose and papyrus before settling into an intimate trail of sandalwood, oud, and warm resin.",
      concentration: "PARFUM",
      family: "oriental",
      gender: "unisex",
      intensity: "strong",
      notesTop: ["Atlas saffron", "Calabrian bergamot", "Pink peppercorn"],
      notesHeart: ["Kannauj rose", "Papyrus smoke", "Moroccan cedar"],
      notesBase: ["Mysore sandalwood", "Oud", "Golden benzoin"],
      perfumer: "Henri de Valois",
      isLimited: true,
      tags: ["Collector's Edition", "Bestseller"],
      images: ["/leyros/nuit-doree-hero.jpg", "/leyros/nuit-detail.jpg", "/leyros/cap-detail.jpg"],
      variants: [
        { sizeMl: 50, price: 4800 },
        { sizeMl: 100, price: 7200 },
      ],
    },
    {
      title: "Santal Céleste",
      handle: "santal-celeste",
      description: "Aged Mysore sandalwood oil married with milky rice accord, white cedar, and iris butter.",
      story: "A quiet, milky woods composition built around a single rare sandalwood harvest.",
      concentration: "PARFUM",
      family: "woody",
      gender: "unisex",
      intensity: "moderate",
      notesTop: ["Cardamom", "Bergamot"],
      notesHeart: ["Milky rice", "Iris butter"],
      notesBase: ["Mysore sandalwood", "White cedar"],
      perfumer: "Henri de Valois",
      isLimited: false,
      tags: ["Rare Harvest", "Bestseller"],
      images: ["/leyros/santal-celeste.jpg"],
      variants: [{ sizeMl: 100, price: 5000 }],
    },
    {
      title: "Iris Impérial",
      handle: "iris-imperial",
      description: "Aged Florentine orris in Kannauj cedar, wrapped in violet leaf and mineral musk.",
      story: "An imperial iris, aged for years before it ever reaches the blend.",
      concentration: "PARFUM",
      family: "floral",
      gender: "unisex",
      intensity: "moderate",
      notesTop: ["Violet leaf", "Pink pepper"],
      notesHeart: ["Florentine orris", "Mimosa"],
      notesBase: ["Kannauj cedar", "Mineral musk"],
      perfumer: "Amara Lindqvist",
      isLimited: false,
      tags: ["Extrait de Parfum"],
      images: ["/leyros/iris-imperial.jpg"],
      variants: [{ sizeMl: 100, price: 4600 }],
    },
    {
      title: "Fleur d'Oranger Sauvage",
      handle: "fleur-doranger-sauvage",
      description: "Luminescent Coorg orange blossom and neroli softened by green cardamom and white tea.",
      story: "A wild, sunlit orange blossom picked at dawn in the Coorg hills.",
      concentration: "PARFUM",
      family: "fresh",
      gender: "unisex",
      intensity: "light",
      notesTop: ["Green cardamom", "White tea"],
      notesHeart: ["Orange blossom", "Neroli"],
      notesBase: ["White musk", "Vetiver"],
      perfumer: "Amara Lindqvist",
      isLimited: false,
      tags: ["Extrait de Parfum"],
      images: ["/leyros/fleur-oranger.jpg"],
      variants: [{ sizeMl: 100, price: 3900 }],
    },
    {
      title: "Vétiver de Malabar",
      handle: "vetiver-de-malabar",
      description: "South Indian wild khus root over smoky Himalayan birch, lifted by bitter pink grapefruit.",
      story: "A green, smoky vetiver rooted in South Indian khus and Himalayan birch tar.",
      concentration: "PARFUM",
      family: "woody",
      gender: "unisex",
      intensity: "strong",
      notesTop: ["Pink grapefruit", "Black pepper"],
      notesHeart: ["South Indian khus", "Cedar"],
      notesBase: ["Himalayan birch", "Oakmoss"],
      perfumer: "Théo Marchand",
      isLimited: true,
      tags: ["Limited Harvest"],
      images: ["/leyros/vetiver-malabar.jpg"],
      variants: [{ sizeMl: 100, price: 4200 }],
    },
    {
      title: "Cuir Mystique",
      handle: "cuir-mystique",
      description: "Royal Indian saddle leather warmed with temple frankincense, amber tears, and styrax balm.",
      story: "A leather accord built to feel like a temple at dusk — smoke, resin, and warm hide.",
      concentration: "PARFUM",
      family: "oriental",
      gender: "unisex",
      intensity: "strong",
      notesTop: ["Saffron", "Elemi"],
      notesHeart: ["Royal leather", "Frankincense"],
      notesBase: ["Amber", "Styrax balm"],
      perfumer: "Théo Marchand",
      isLimited: false,
      tags: ["Bespoke Accord", "Bestseller"],
      images: ["/leyros/cuir-mystique.jpg"],
      variants: [{ sizeMl: 100, price: 5200 }],
    },
  ];

  const editorialTagValues = [...new Set(editorialPerfumes.flatMap((p) => p.tags))];
  const existingEditorialTags = await productModuleService.listProductTags({
    value: editorialTagValues,
  });
  const editorialTagIdByValue = new Map(existingEditorialTags.map((tag) => [tag.value, tag.id]));
  const missingEditorialTagValues = editorialTagValues.filter(
    (value) => !editorialTagIdByValue.has(value),
  );
  if (missingEditorialTagValues.length) {
    const createdTags = await productModuleService.createProductTags(
      missingEditorialTagValues.map((value) => ({ value })),
    );
    for (const tag of createdTags) editorialTagIdByValue.set(tag.value, tag.id);
  }

  let editorialCreatedCount = 0;
  for (const perfume of editorialPerfumes) {
    if ((await productModuleService.listProducts({ handle: perfume.handle }))[0]) continue;

    const sizeLabels = perfume.variants.map((v) => `${v.sizeMl}ml`);
    const product = (
      await createProductsWorkflow(container).run({
        input: {
          products: [
            {
              title: perfume.title,
              handle: perfume.handle,
              description: perfume.description,
              status: ProductStatus.PUBLISHED,
              shipping_profile_id: shippingProfile.id,
              images: perfume.images.map((url) => ({ url })),
              options: [{ id: sizeOption.id, title: "Bottle Size", values: sizeLabels }],
              tag_ids: perfume.tags.map((value) => editorialTagIdByValue.get(value)!),
              variants: perfume.variants.map((variant) => ({
                title: `${variant.sizeMl}ml`,
                sku: `LEY-${perfume.handle.toUpperCase()}-${variant.sizeMl}`,
                options: { "Bottle Size": `${variant.sizeMl}ml` },
                prices: [{ amount: variant.price, currency_code: "inr" }],
              })),
              sales_channels: [{ id: salesChannel.id }],
            },
          ],
        },
      })
    ).result[0];

    await perfumeDetailsService.createPerfumeDetails([{
      product_id: product.id,
      concentration: perfume.concentration,
      family: perfume.family,
      gender: perfume.gender,
      intensity: perfume.intensity,
      notes_top: perfume.notesTop,
      notes_heart: perfume.notesHeart,
      notes_base: perfume.notesBase,
      perfumer: perfume.perfumer,
      story: perfume.story,
      is_limited: perfume.isLimited,
      sample_eligible: false,
    }]);

    editorialCreatedCount += 1;
  }

  // Gift wrap (plan §3: a real sellable product added as a cart line item).
  if (!(await productModuleService.listProducts({ handle: "gift-wrap" }))[0]) {
    await createProductsWorkflow(container).run({
      input: {
        products: [
          {
            title: "Gift Wrap",
            handle: "gift-wrap",
            description: "Signature Leyros box wrap with ribbon and card.",
            status: ProductStatus.PUBLISHED,
            shipping_profile_id: shippingProfile.id,
            options: [{ title: "Type", values: ["Standard"] }],
            variants: [
              {
                title: "Gift Wrap",
                sku: "GIFT-WRAP",
                options: { Type: "Standard" },
                prices: [{ amount: 250, currency_code: "inr" }],
              },
            ],
            sales_channels: [{ id: salesChannel.id }],
          },
        ],
      },
    });
  }

  logger.info("Seeding inventory levels...");
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  });
  const { data: existingLevels } = await query.graph({
    entity: "inventory_level",
    filters: { location_id: stockLocation.id },
    fields: ["inventory_item_id"],
  });
  const itemIdsWithLevel = new Set(existingLevels.map((level) => level.inventory_item_id));
  const itemsNeedingLevel = inventoryItems.filter((item) => !itemIdsWithLevel.has(item.id));
  if (itemsNeedingLevel.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: itemsNeedingLevel.map((item) => ({
          location_id: stockLocation.id,
          stocked_quantity: 100,
          inventory_item_id: item.id,
        })),
      },
    });
  }

  logger.info(
    `Seed complete: ${editorialCreatedCount} new editorial perfumes (${editorialPerfumes.length} total), ` +
      `${createdProducts.length} legacy perfumes drafted, gift wrap ready.`,
  );
}
