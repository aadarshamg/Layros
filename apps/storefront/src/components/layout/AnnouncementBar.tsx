import { DEFAULT_ANNOUNCEMENT_MESSAGES } from "@/lib/site-defaults";

/**
 * The scrolling store-announcement strip. Other pages show it at the top of
 * the header; the homepage shows it between the Buy 2 Get 1 Free section and
 * New Arrivals instead, so the header sits cleanly over the hero film.
 */
export function AnnouncementBar({ messages }: { messages?: string[] }) {
  const announcements = messages?.length ? messages : DEFAULT_ANNOUNCEMENT_MESSAGES;
  return (
    <div className="announcement" aria-label="Store announcements">
      <div className="announcement-track">
        <div className="announcement-group">
          {announcements.map((message) => <span key={message}>{message}</span>)}
        </div>
        <div className="announcement-group" aria-hidden="true">
          {announcements.map((message) => <span key={`repeat-${message}`}>{message}</span>)}
        </div>
      </div>
    </div>
  );
}
