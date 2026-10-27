import {boardMasks,maskAttackers,masksInCheck} from './board-masks.js';
const values={king:0,rook:500,bishop:320,knight:300};
const enemy=c=>c==='white'?'black':'white';
// Ordering heuristic only: alternate legal king-safe captures on one square.
// Drops elsewhere, variant turn rights, repetition and future deployment are
// deliberately absent. This must never adjudicate a result or prune a move.
export function estimateExchange(p,a){
 if(!['move','drop'].includes(a.type))return 0;
 const board=p.board.slice(),counts={white:p.banks.white.length,black:p.banks.black.length};
 const transfer=p.rules?.experiment==='capture-bank',materialBank=['capture-bank','permanent-loss'].includes(p.rules?.experiment);
 const gain=(victim,side)=>values[victim.piece]+20+(transfer?(counts[side]<p.rules.bankCapacity?values[victim.piece]:-values[victim.piece]):0);
 const take=(victim,side)=>{if(transfer){const owner=counts[side]<p.rules.bankCapacity?side:victim.owner;counts[owner]++;return owner;}return null;};
 const target=a.to,side=p.turn,victim=board[target];
 let initial=victim?gain(victim,side):a.type==='drop'?(materialBank?20:values[a.piece]+20):0;
 if(victim)take(victim,side);
 if(a.type==='move'){board[target]=board[a.from];board[a.from]=null;}else{board[target]={owner:side,piece:a.piece};counts[side]--;}
 function recapture(who){
  const victim=board[target];if(!victim||victim.piece==='king')return 0;
  const masks=boardMasks(board);let attackers=maskAttackers(masks,target,who),best=0;
  while(attackers){const bit=attackers&-attackers,from=31-Math.clz32(bit);attackers^=bit;
   const attacker=board[from];board[from]=null;board[target]=attacker;
   if(!masksInCheck(boardMasks(board),who)){
    const value=gain(victim,who),owner=take(victim,who);
    best=Math.max(best,value-recapture(enemy(who)));
    if(owner)counts[owner]--;
   }
   board[from]=attacker;board[target]=victim;
  }
  return best;
 }
 return initial-recapture(enemy(side));
}
