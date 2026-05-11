import { restGet } from "../client.js";
import { bootstrap, printJson, requireToken } from "../util.js";

interface FeedItem {
  feedItemId: string;
  createdDate: string;
  sender?: { name?: string; loginId?: string };
  receivers?: string[];
  body?: string;
  images?: unknown[];
  likes?: unknown[];
  comments?: unknown[];
  isPinned?: boolean;
  seen?: boolean;
}

interface FeedResponse {
  feedItems?: FeedItem[];
}

export async function feedCommand(opts: {
  limit?: number;
  pages?: number;
  author?: string;
  mentions?: string;
}): Promise<void> {
  const config = await bootstrap();
  requireToken(config);

  const maxPages = opts.pages ?? 5;
  const all: FeedItem[] = [];
  let cursor: string | undefined;
  let olderThan: string | undefined;

  for (let i = 0; i < maxPages; i++) {
    const page = await restGet<FeedResponse>(config, "/api/feed/feed/feed", {
      cursor,
      olderThan,
      heightTarget: 1254,
    });
    const items = page.feedItems ?? [];
    if (items.length === 0) break;
    all.push(...items);
    if (opts.limit && all.length >= opts.limit) break;
    const last = items[items.length - 1];
    cursor = last.feedItemId;
    olderThan = last.createdDate;
  }

  const filtered = all.filter((item) => {
    if (opts.author) {
      const name = (item.sender?.name ?? "").toLowerCase();
      if (!name.includes(opts.author.toLowerCase())) return false;
    }
    if (opts.mentions) {
      const needle = opts.mentions.toLowerCase();
      const hit = (item.receivers ?? []).some((r) => r.toLowerCase().includes(needle));
      if (!hit) return false;
    }
    return true;
  });

  printJson(opts.limit ? filtered.slice(0, opts.limit) : filtered);
}
