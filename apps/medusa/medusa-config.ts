import { loadEnv, defineConfig, Modules } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

// Supabase Storage is S3-compatible (see plan §2 step 2) — only registered
// once these are set, so local dev without a Supabase project still works
// against local disk storage.
const hasSupabaseStorage =
  !!process.env.SUPABASE_S3_ENDPOINT &&
  !!process.env.SUPABASE_S3_BUCKET &&
  !!process.env.SUPABASE_S3_ACCESS_KEY_ID &&
  !!process.env.SUPABASE_S3_SECRET_ACCESS_KEY

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    },
  },
  modules: [
    {
      resolve: './src/modules/perfume-details',
    },
    {
      resolve: './src/modules/reviews',
    },
    {
      resolve: '@medusajs/medusa/payment',
      options: {
        providers: [
          {
            resolve: './src/modules/mock-payment',
            id: 'mock',
          },
        ],
      },
    },
    ...(hasSupabaseStorage
      ? [
          {
            resolve: '@medusajs/medusa/file',
            options: {
              providers: [
                {
                  resolve: '@medusajs/medusa/file-s3',
                  id: 's3',
                  options: {
                    file_url: process.env.SUPABASE_S3_PUBLIC_URL,
                    access_key_id: process.env.SUPABASE_S3_ACCESS_KEY_ID,
                    secret_access_key: process.env.SUPABASE_S3_SECRET_ACCESS_KEY,
                    region: process.env.SUPABASE_S3_REGION || 'us-east-1',
                    bucket: process.env.SUPABASE_S3_BUCKET,
                    endpoint: process.env.SUPABASE_S3_ENDPOINT,
                    additional_client_config: {
                      forcePathStyle: true,
                    },
                  },
                },
              ],
            },
          },
        ]
      : []),
  ],
})
