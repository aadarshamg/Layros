import { getSessionCustomerId } from "@/lib/auth/session";
import { ensureReferralCode, getCustomerRewards } from "@/lib/rewards";
import { REFERRAL_DISCOUNT, REFERRAL_MIN_ORDER } from "@/lib/checkout/coupons";
import { formatInr } from "@/lib/format";
import { CopyCode } from "./CopyCode";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.leyros.in").replace(/\/$/, "");

export default async function RewardsPage() {
  const customerId = await getSessionCustomerId();
  if (!customerId) return null;
  const [referralCode, rewards] = await Promise.all([ensureReferralCode(customerId), getCustomerRewards(customerId)]);
  const shareText = referralCode
    ? `I love Leyros perfumes. Use my code ${referralCode} for ${formatInr(REFERRAL_DISCOUNT)} off your first order of ${formatInr(REFERRAL_MIN_ORDER)}+: ${siteUrl}`
    : "";

  return (
    <div className="account-rewards">
      <section>
        <h2>Refer a friend</h2>
        <p>Your friend gets {formatInr(REFERRAL_DISCOUNT)} off their first order of {formatInr(REFERRAL_MIN_ORDER)} or more. Once it&apos;s delivered, you get a {formatInr(REFERRAL_DISCOUNT)} coupon too.</p>
        {referralCode ? (
          <div className="account-referral">
            <CopyCode code={referralCode} />
            <a className="account-referral-share" href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">Share on WhatsApp</a>
          </div>
        ) : (
          <p>Your code isn&apos;t available right now. Please try again later.</p>
        )}
      </section>

      <section>
        <h2>Your coupons</h2>
        {rewards.length === 0 ? (
          <p>No coupons yet. Refer a friend, or review a fragrance after delivery, to earn one.</p>
        ) : (
          <ul className="account-reward-list">
            {rewards.map((reward) => (
              <li key={reward.code}>
                <CopyCode code={reward.code} />
                <span>
                  {reward.label}
                  {reward.minOrderAmount ? ` · on orders of ${formatInr(reward.minOrderAmount)}+` : ""}
                  {reward.expiresAt ? ` · use by ${new Date(reward.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
