import { NavView } from "@/components/layout/NavView";
import { Footer } from "@/components/layout/Footer";
import { SiteMotion } from "@/components/layout/SiteMotion";
import { JsonLd } from "@/components/seo/JsonLd";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/jsonld/organization";
import { CartProvider } from "@/lib/cart-context";
import { CartDrawer } from "@/components/checkout/CartDrawer";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { AuthProvider } from "@/lib/auth-context";
import { getCurrentCustomer } from "@/lib/auth/session";
import { getStoreSettings } from "@/lib/data/store-settings";
import "../globals.css";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [customer, storeSettings] = await Promise.all([getCurrentCustomer(), getStoreSettings()]);
  return (
    <>
      <JsonLd data={organizationJsonLd({ email: storeSettings.contactEmail, phone: storeSettings.contactPhone })} />
      <JsonLd data={websiteJsonLd()} />
      <AuthProvider initialCustomer={customer}>
        <CartProvider>
          <SiteMotion />
          <NavView announcementMessages={storeSettings.announcementMessages} />
          <main className="flex-1">{children}</main>
          <Footer
            contactEmail={storeSettings.contactEmail}
            contactPhone={storeSettings.contactPhone}
            brandAddress={storeSettings.brandAddress}
            googleRating={storeSettings.googleRating}
            googleReviewCount={storeSettings.googleReviewCount}
            googleReviewsUrl={storeSettings.googleReviewsUrl}
          />
          <CartDrawer />
        </CartProvider>
      </AuthProvider>
      <WhatsAppButton number={storeSettings.whatsappNumber} suggestedMessage={storeSettings.whatsappSuggestedMessage} />
    </>
  );
}
