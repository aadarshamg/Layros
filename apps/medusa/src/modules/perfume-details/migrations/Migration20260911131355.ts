import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260911131355 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "perfume_details" drop constraint if exists "perfume_details_product_id_unique";`);
    this.addSql(`create table if not exists "perfume_details" ("id" text not null, "product_id" text not null, "concentration" text check ("concentration" in ('EDT', 'EDP', 'PARFUM')) not null, "family" text check ("family" in ('floral', 'woody', 'oriental', 'fresh', 'gourmand')) not null, "gender" text check ("gender" in ('feminine', 'masculine', 'unisex')) not null, "intensity" text check ("intensity" in ('light', 'moderate', 'strong')) not null, "notes_top" text[] not null default '{}', "notes_heart" text[] not null default '{}', "notes_base" text[] not null default '{}', "perfumer" text null, "story" text null, "is_limited" boolean not null default false, "sample_eligible" boolean not null default false, "sample_of_product_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "perfume_details_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_perfume_details_product_id_unique" ON "perfume_details" ("product_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_perfume_details_deleted_at" ON "perfume_details" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "perfume_details" cascade;`);
  }

}
