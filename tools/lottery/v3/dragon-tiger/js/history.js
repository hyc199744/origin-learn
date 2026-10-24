(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DTHistory=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  // Bead plate: six rows; top to bottom, then left to right. All cells come from actual rounds.
  function beadPlate(history,rows=6){return history.map((r,i)=>({row:i%rows,col:Math.floor(i/rows),result:r.result,round:r.round}));}
  function stats(counts){return ['dragon','tie','tiger'].map(side=>({side,count:counts[side],percent:counts.total?100*counts[side]/counts.total:0}));}
  return {beadPlate,stats};
});
