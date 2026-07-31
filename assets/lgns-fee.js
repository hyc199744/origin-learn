/* LGNS 手续费实时刷新：从链上读 feeRatio/PRECISION，替换页面里带 data-lgns-fee-* 的数字。
   读不到就保留页面里的静态兜底值（当前 5%），不谎称实时。 */
(function(){
  "use strict";
  function setAll(attr,val){
    var nodes=document.querySelectorAll("["+attr+"]");
    for(var i=0;i<nodes.length;i++)nodes[i].textContent=val;
  }
  try{
    fetch("https://count.web3origin.com/lgns/fee",{cache:"no-store"}).then(function(r){return r.json();}).then(function(d){
      if(!d)return;
      var sell=(d.sellPct!=null?d.sellPct:null),buy=(d.buyPct!=null?d.buyPct:null);
      if(sell!=null)setAll("data-lgns-fee-sell",sell+"%");
      if(buy!=null)setAll("data-lgns-fee-buy",buy+"%");
      if(d.feeRatio!=null)setAll("data-lgns-fee-ratio",d.feeRatio);
      if(d.precision!=null)setAll("data-lgns-fee-precision",d.precision);
      var t=document.querySelectorAll("[data-lgns-fee-time]");
      if(t.length){
        var txt;
        if(d.checkedAt&&d.ok!==false){txt=(d.cached?"链上读取":"链上实时读取")+" · 更新于 "+new Date(d.checkedAt).toLocaleString();}
        else{txt="链上暂时读取失败，下方为最近一次核验值，请以交易当时链上数据为准";}
        for(var j=0;j<t.length;j++)t[j].textContent=txt;
      }
    }).catch(function(){});
  }catch(e){}
})();
