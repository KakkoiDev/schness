const base = {experiment:'balance-bench',bankCapacity:4,allowCheckingDrops:false,captureDelay:1};
export const VARIANTS = Object.freeze(Object.fromEntries([
  ['control-delay-1-1', {}],
  ['delay-1-0', {returnDelay:0}],
  ['delay-1-2', {returnDelay:2}],
  ['sliders-range-2', {sliderRange:2}],
  ['three-check', {checkTarget:3}],
  ['five-check', {checkTarget:5}],
  ['center-hold', {centerHold:true}],
  ['mandatory-captures', {mandatoryCaptures:true}],
  ['home-half-drops', {homeHalfDrops:true}],
].map(([id,extra])=>[id,Object.freeze({...base,...extra})])));
export const VARIANT_IDS = Object.freeze(Object.keys(VARIANTS));
export function description(r) {
  const extra = r.checkTarget ? `Win after ${r.checkTarget} checking actions; checkmate also wins.`
    : r.centerHold ? 'Win by holding the same central square with your king through one opponent reply without being in check. A checking reply cancels the claim; checkmate also wins.'
    : r.sliderRange ? 'Rook and bishop move AND attack range is capped at two squares.'
    : r.mandatoryCaptures ? 'A king-safe capture is compulsory whenever any exists.'
    : r.homeHalfDrops ? 'All drops restricted to own half; board moves unrestricted.'
    : 'Normal checkmate objective and unrestricted board range.';
  return `Four-slot capture bank; overflow returns to captured side; quiet drops. Captures cool one owner turn; returned overflow cools ${r.returnDelay ?? 1} owner turns. Initial reserves ready. Full delay on arrival, ticking only after later owner actions. ${extra}`;
}
