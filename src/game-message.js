import { actionKey, applyAction, legalActions, positionKey } from './rules.js';

export function makeActionMessage(position, action) {
  const wanted = actionKey(action);
  const legal = legalActions(position).find((candidate) => actionKey(candidate) === wanted);
  if (!legal) throw new Error('Cannot send an illegal action');
  const next = applyAction(position, legal);
  return { type: 'action', action: legal, before: positionKey(position), after: positionKey(next) };
}

export function applyActionMessage(position, message) {
  if (!message || message.type !== 'action' || typeof message.before !== 'string' ||
      typeof message.after !== 'string' || !message.action) throw new Error('Malformed game message');
  if (message.before !== positionKey(position)) throw new Error('Peer position is out of sync');
  const wanted = actionKey(message.action);
  const legal = legalActions(position).find((candidate) => actionKey(candidate) === wanted);
  if (!legal) throw new Error('Peer sent an illegal action');
  const next = applyAction(position, legal);
  if (message.after !== positionKey(next)) throw new Error('Peer position hash does not match');
  return next;
}
