import { EventTemplate, VerifiedEvent } from "npm:nostr-tools";

export function getServiceAnnouncementEvent(
  name: string,
  about: string,
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
      ["k", "5107"],
      ...Object.entries(serviceAnnouncementTags || {}).map(([key, value]) => {
        return [key, ...value];
      }),
    ],
  };
}

export interface JobRequestInputData {
  data: string;
  inputType: string;
  relay: string;
}

export function getJobRequestInputData(
  jobRequestEvent: EventTemplate,
): JobRequestInputData {
  const inputTag = jobRequestEvent.tags.find((tag) => tag[0] === "i");
  if (!inputTag) {
    throw new Error("No i tag found in the event");
  }
  const inputData: JobRequestInputData = {
    data: inputTag[1] ? inputTag[1] : "",
    inputType: inputTag[2] ? inputTag[2] : "",
    relay: inputTag[3] ? inputTag[3] : "",
  };

  return inputData;
}

export function getJobResultEvent(
  jobRequestEvent: VerifiedEvent,
  payload: string,
): EventTemplate {
  const jobRequestInputData: JobRequestInputData = getJobRequestInputData(
    jobRequestEvent,
  );

  const eventContent: EventTemplate = {
    content: payload,
    kind: 6107,
    tags: [
      ["request", jobRequestInputData.data],
      ["e", jobRequestEvent.id, jobRequestInputData.relay],
      ["i", jobRequestEvent.tags[0][1]],
      ["p", jobRequestEvent.pubkey],
    ],
    created_at: Math.floor(Date.now() / 1000),
  };
  return eventContent;
}
