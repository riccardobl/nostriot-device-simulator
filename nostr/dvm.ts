import { EventTemplate } from "npm:nostr-tools";

export function getServiceAnnouncementEvent(
  name: string,
  about: string,
  dvmKind: number,
  serviceAnnouncementTags?: { [key: string]: string[] },
): EventTemplate {
  const eventContent = JSON.stringify({
    "name": name,
    "about": about,
  });
  return {
    kind: 31990,
    created_at: Math.floor(Date.now() / 1000),
    content: eventContent,
    tags: [
      ["k", dvmKind.toString()],
      ...Object.entries(serviceAnnouncementTags || {}).map(([key, value]) => {
        return [key, ...value];
      }),
    ],
  };
}
