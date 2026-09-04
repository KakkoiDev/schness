export function chooseHostCandidate(selfId, peers) {
  return [...peers.entries()]
    .filter(([id, peer]) => peer?.waiting === true && selfId < id)
    .map(([id]) => id)
    .sort()[0] ?? null;
}

export function colorsForPair(hostId, guestId) {
  if (!(hostId < guestId)) throw new Error('The lower peer id must host the match');
  return { [hostId]: 'white', [guestId]: 'black' };
}

export function roomIsFull(peers) {
  return [...peers.values()].filter((peer) => peer?.waiting === false).length >= 2;
}
