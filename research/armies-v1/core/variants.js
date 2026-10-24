// All multisets of two, three or four current non-king piece types; symmetric sides.
const variants={};
for(const total of [2,3,4])for(let rooks=0;rooks<=total;rooks++)for(let bishops=0;bishops<=total-rooks;bishops++){
 const knights=total-rooks-bishops;const army=[...Array(rooks).fill('rook'),...Array(bishops).fill('bishop'),...Array(knights).fill('knight')];
 const id=`army-${'R'.repeat(rooks)}${'B'.repeat(bishops)}${'N'.repeat(knights)}`;
 variants[id]=Object.freeze({allowCheckingDrops:false,army:Object.freeze(army)});
}
export const VARIANTS=Object.freeze(variants);
export const VARIANT_IDS=Object.freeze(Object.keys(variants));
export function description(r){return `Classic Schness 4×4, quiet drops, captures return to current owner. Both sides: king plus ${r.army.join(', ')}. Starting reserves ready. No new piece movements or victory conditions. Frozen Sharp v2 depth 4.`;}
