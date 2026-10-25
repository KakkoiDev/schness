export const VARIANTS = Object.freeze(Object.fromEntries([0,1].flatMap(delay=>[
  [`quiet-delay-${delay}`,{experiment:'balance-bench',bankCapacity:4,allowCheckingDrops:false,captureDelay:delay}],
  [`checking-delay-${delay}`,{experiment:'balance-bench',bankCapacity:4,allowCheckingDrops:true,captureDelay:delay}],
  [`no-drop-mate-delay-${delay}`,{experiment:'balance-bench',bankCapacity:4,allowCheckingDrops:true,captureDelay:delay,noDropMate:true}],
].map(([id,r])=>[id,Object.freeze(r)]))));
export const VARIANT_IDS = Object.freeze(Object.keys(VARIANTS));
export function description(r) {
  const drops = !r.allowCheckingDrops ? 'Drops cannot check.' : r.noDropMate ? 'Drops may check but may not immediately checkmate; opponent must have a legal reply under this same ruleset. Normal board moves may mate.' : 'Drops may check and immediately checkmate.';
  return `Four-slot capture bank; overflow returns to captured side. Captured and returned pieces wait ${r.captureDelay} owner turns, excluding arrival turn; initial reserves ready. ${drops} Ordinary checkmate, stalemate and threefold repetition; forced wait only outside check without other legal actions and with cooling reserves.`;
}
