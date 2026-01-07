export type MessageLike = { id?: string; _id?: string };

const seenIds = new Set<string>();
const cacheByConversation: Record<string, MessageLike[]> = {};

export const messageId = (m: MessageLike): string | undefined => {
  return (m?.id as string) || (m as any)?._id;
};

export const addMessageId = (m: MessageLike): boolean => {
  const id = messageId(m);
  if (!id) return false;
  if (seenIds.has(id)) return false;
  seenIds.add(id);
  return true;
};

export const dedupeList = <T extends MessageLike>(list: T[]): T[] => {
  const out: T[] = [];
  const local = new Set<string>();
  for (const m of list) {
    const id = messageId(m);
    if (!id) {
      out.push(m);
      continue;
    }
    if (local.has(id)) continue;
    local.add(id);
    out.push(m);
  }
  return out;
};

export const mergeIntoConversationCache = (
  conversationId: string,
  incoming: MessageLike[],
): MessageLike[] => {
  const existing = cacheByConversation[conversationId] || [];
  const merged = dedupeList<MessageLike>([...existing, ...incoming]);
  cacheByConversation[conversationId] = merged;
  merged.forEach(addMessageId);
  return merged;
};

export const getConversationCache = (conversationId: string): MessageLike[] => {
  return cacheByConversation[conversationId] || [];
};





