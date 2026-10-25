export const VARIANTS = Object.freeze(Object.fromEntries([0,1].flatMap(delay=>[1,2,3].map(cap=>[
  `charges-${cap}-delay-${delay}`,Object.freeze({experiment:'balance-bench',bankCapacity:4,allowCheckingDrops:true,captureDelay:delay,checkChargeCap:cap})
]))));
export const VARIANT_IDS = Object.freeze(Object.keys(VARIANTS));
export function description(r) {
  return `Four-slot capture bank, overflow returns to captured side. Capture/return cooldown ${r.captureDelay} owner turns. Initial reserves ready. Checking-drop charges start at 0, cap ${r.checkChargeCap}; each non-checking-drop own play action restores one. Checking drop spends one with no same-turn recharge. King placement does not charge; board checks cost nothing. Drop-mate allowed when charged. Normal checkmate, stalemate and repetition rules.`;
}
