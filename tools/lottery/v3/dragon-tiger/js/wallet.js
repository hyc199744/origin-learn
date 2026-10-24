(function(root){
  'use strict';
  const CHAIN={chainId:6714,hex:'0x1a3a',token:'0x4d1d808a081fdac440703b3765fc61f8028c06b8',decimals:9};
  class Wallet{
    constructor(onChange){this.provider=null;this.address='';this.chainId='';this.connected=false;this.pending=false;this.onChange=onChange||(()=>{});this.error='';this.discovered=[];
      if(typeof window!=='undefined'){window.addEventListener('eip6963:announceProvider',e=>{if(e.detail?.provider&&!this.discovered.some(x=>x.provider===e.detail.provider))this.discovered.push(e.detail);});window.dispatchEvent(new Event('eip6963:requestProvider'));}
    }
    providers(){const out=this.discovered.map(d=>({name:d.info.name,provider:d.provider}));for(const [name,p] of [['OKX Wallet',root.okxwallet],['TokenPocket',root.tokenpocket?.ethereum],['钱包浏览器',root.ethereum]])if(p?.request&&!out.some(x=>x.provider===p))out.push({name,provider:p});return out;}
    async connect(index=0){if(this.pending)return;const candidate=this.providers()[index];if(!candidate)throw Error('未检测到钱包。请在 OKX / TP 等钱包 DApp 浏览器打开，试玩可直接继续。');this.pending=true;this.error='';this.onChange();try{if(this.provider!==candidate.provider){this.detach();this.provider=candidate.provider;this.accountsHandler=a=>{this.address=a[0]||'';this.connected=!!this.address;this.onChange();};this.chainHandler=c=>{this.chainId=c;this.onChange();};this.disconnectHandler=()=>{this.connected=false;this.address='';this.onChange();};this.provider.on?.('accountsChanged',this.accountsHandler);this.provider.on?.('chainChanged',this.chainHandler);this.provider.on?.('disconnect',this.disconnectHandler);}const accounts=await this.provider.request({method:'eth_requestAccounts'});this.address=accounts[0]||'';this.connected=!!this.address;this.chainId=await this.provider.request({method:'eth_chainId'});}catch(e){this.error=e.code===4001?'你已取消钱包连接，可继续试玩':(e.message||'钱包连接失败，请重试');throw Error(this.error);}finally{this.pending=false;this.onChange();}}
    detach(){if(this.provider){this.provider.removeListener?.('accountsChanged',this.accountsHandler);this.provider.removeListener?.('chainChanged',this.chainHandler);this.provider.removeListener?.('disconnect',this.disconnectHandler);}}
    async switchChain(){if(!this.provider)throw Error('请先连接钱包');try{await this.provider.request({method:'wallet_switchEthereumChain',params:[{chainId:CHAIN.hex}]});this.chainId=await this.provider.request({method:'eth_chainId'});this.onChange();}catch(e){throw Error(e.code===4902?'钱包尚未添加 Anubis，请使用官方网络配置添加后重试':e.code===4001?'已取消切换网络':(e.message||'网络切换失败，请重试'));}}
    disconnect(){this.detach();this.provider=null;this.connected=false;this.address='';this.chainId='';this.onChange();}
    correctChain(){return Number(this.chainId)===CHAIN.chainId;}
  }
  // Explicit future integration contract. No guessed ABI; every write fails closed.
  class ChainAdapter{
    constructor(){this.mode='unconfigured';}
    async getRound(){throw Error('未配置龙虎合约 ABI 与可信结算源');}
    async getBetStatus(){throw Error('未接入链上下注状态');}
    async getSettlementStatus(){throw Error('未接入链上结算状态');}
    async recoverRound(){throw Error('未接入链上恢复接口');}
    async placeBet(){throw Error('真实下注未开放');}
    async claim(){throw Error('真实结算未开放');}
  }
  root.DTWallet={Wallet,ChainAdapter,CHAIN};
})(typeof globalThis!=='undefined'?globalThis:this);
