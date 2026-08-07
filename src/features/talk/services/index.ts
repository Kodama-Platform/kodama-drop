/**
 * Service boundary singleton.
 *
 * The entire Talk app imports `talkService` from here. Swapping the mock for
 * the centralized backend is a one-line change in this file.
 */

import type { TalkService } from "@/features/talk/services/talk-service";
import { MockTalkService } from "@/features/talk/mock/mock-talk-service";

export type { TalkService } from "@/features/talk/services/talk-service";

export const talkService: TalkService = new MockTalkService();
