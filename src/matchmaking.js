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

/**
 * What the waiting card says, given how long it has waited and whether any
 * relay is answering. One line that rewrites itself in place: it used to be a
 * status row plus two paragraphs that appeared underneath on failure, each
 * carrying its own "Play the bot instead" button — three buttons for one job,
 * on a card that grew taller the worse things got.
 */
export function searchMessage(waited, stalled) {
  /*
   * A dead relay pool outranks everything else, whenever it is detected.
   * Trystero never reports a transport failure, so without this a blocked list
   * looks exactly like a friend who has not clicked yet — and saying "nothing
   * here can tell" over a stalled card contradicts it outright.
   */
  if (stalled) return 'Still listening — no relay is answering yet';
  if (waited < 20_000) return 'Listening for a second player';
  if (waited < 90_000) return 'Still listening — no one has opened the link yet';
  /*
   * The failure the app cannot see. Peers exchange nothing until WebRTC is up,
   * and the bundled config carries STUN and no TURN, so a pair behind
   * symmetric NAT never connects however long they wait. This names the
   * possibility without claiming to have detected anything, because it has not.
   */
  return 'Nothing yet. Check both browsers opened this exact link, and that neither network blocks a direct connection.';
}
