/** Exact 16-square geometry. These masks are private to Schness's 4×4 rules. */
const PIECE_INDEX = {king:0, knight:1, rook:2, bishop:3};
const KING = new Uint16Array(16), KNIGHT = new Uint16Array(16);
const ROOK = new Uint16Array(16), BISHOP = new Uint16Array(16);
const BETWEEN = Array.from({length:16},()=>new Uint16Array(16));
for(let from=0;from<16;from++)for(let to=0;to<16;to++){
 if(from===to)continue;
 const dy=(to>>2)-(from>>2),dx=(to&3)-(from&3),ay=Math.abs(dy),ax=Math.abs(dx);
 if(Math.max(ay,ax)===1)KING[from]|=1<<to;
 if(ay*ax===2)KNIGHT[from]|=1<<to;
 if(!dx||!dy||ay===ax){
  if(!dx||!dy)ROOK[from]|=1<<to;else BISHOP[from]|=1<<to;
  const step=Math.sign(dy)*4+Math.sign(dx);
  for(let square=from+step;square!==to;square+=step)BETWEEN[from][to]|=1<<square;
 }
}

// Four masks per owner, then total occupancy. No position is retained here.
export function boardMasks(board){
 const masks=new Uint16Array(9);
 for(let i=0;i<16;i++){const o=board[i];if(o){masks[(o.owner==='white'?0:4)+PIECE_INDEX[o.piece]]|=1<<i;masks[8]|=1<<i;}}
 return masks;
}
export function masksAfter(masks,board,player,action){
 const next=masks.slice(),offset=player==='white'?0:4,toBit=1<<action.to,captured=board[action.to];
 if(captured)next[(captured.owner==='white'?0:4)+PIECE_INDEX[captured.piece]]&=~toBit;
 if(action.type==='move'){
  const fromBit=1<<action.from,index=offset+PIECE_INDEX[board[action.from].piece];
  next[index]=(next[index]&~fromBit)|toBit;next[8]&=~fromBit;
 }else next[offset+PIECE_INDEX[action.type==='drop'?action.piece:'king']]|=toBit;
 next[8]|=toBit;return next;
}
export function masksAttack(masks,square,player){
 const offset=player==='white'?0:4;
 if((KING[square]&masks[offset])||(KNIGHT[square]&masks[offset+1]))return true;
 let sliders=(ROOK[square]&masks[offset+2])|(BISHOP[square]&masks[offset+3]);
 while(sliders){const bit=sliders&-sliders,from=31-Math.clz32(bit);if(!(BETWEEN[square][from]&masks[8]))return true;sliders^=bit;}
 return false;
}
export function masksInCheck(masks,player){
 const kings=masks[player==='white'?0:4];
 // Invalid multi-king boards retain the public rules' first-king behavior.
 return kings?masksAttack(masks,31-Math.clz32(kings&-kings),player==='white'?'black':'white'):false;
}
