export const MAX_CHAT_LENGTH = 280;

export function createChatMessage(value) {
  if (typeof value !== 'string') throw new Error('Message must be text.');
  const text = value.trim();
  if (!text) throw new Error('Enter a message first.');
  if (text.length > MAX_CHAT_LENGTH) throw new Error(`Messages can be at most ${MAX_CHAT_LENGTH} characters.`);
  return { v: 1, text };
}

export function parseChatMessage(payload) {
  if (!payload || payload.v !== 1 || typeof payload.text !== 'string') {
    throw new Error('Invalid chat message.');
  }
  return createChatMessage(payload.text);
}
