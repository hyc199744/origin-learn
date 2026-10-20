const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.join(__dirname,'..');
const files=['platform.js','gate.js','ref.js','shell.js','i18n.js','account/account.js','invite/invite.js','help/help.js','anubis-play/app.js','anubis-play/i18n.js','tests/preview-server.cjs','tests/wallet-fixture.js'];
let scripts=0,handlers=0;
for(const file of files){const s=fs.readFileSync(path.join(root,file),'utf8');new vm.Script(s,{filename:file});if(Buffer.byteLength(s)>100*1024)throw new Error('Changed script exceeds 100 KiB: '+file);scripts++;}
for(const file of ['index.html','lottery/index.html','account/index.html','invite/index.html','help/index.html','news/index.html','anubis-play/index.html']){
 const s=fs.readFileSync(path.join(root,file),'utf8');if(!/^<!doctype/i.test(s))throw new Error('Missing doctype: '+file);
 for(const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(!/\bsrc=/.test(m[1])){new vm.Script(m[2],{filename:file+':inline'});scripts++;}}
 for(const m of s.matchAll(/\bon(?:click|change|input|keydown)="([^"]*)"/g)){new vm.Script('(function(event){'+m[1]+'})',{filename:file+':handler'});handlers++;}
 for(const m of s.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)){const css=m[1].replace(/\/\*[\s\S]*?\*\//g,'');if((css.match(/{/g)||[]).length!==(css.match(/}/g)||[]).length)throw new Error('Unbalanced style: '+file);}
 for(const m of s.matchAll(/(?:src|href)="([^"#?]+)(?:\?[^"#]*)?(?:#[^"]*)?"/g)){if(/^(https?:|data:|javascript:)/.test(m[1]))continue;const target=path.resolve(root,path.dirname(file),m[1]);if(!fs.existsSync(target))throw new Error('Missing linked file in '+file+': '+m[1]);}
}
const sharedCss=fs.readFileSync(path.join(root,'platform.css'),'utf8').replace(/\/\*[\s\S]*?\*\//g,'');if((sharedCss.match(/{/g)||[]).length!==(sharedCss.match(/}/g)||[]).length)throw new Error('Unbalanced platform.css');
console.log(JSON.stringify({scriptsCompiled:scripts,handlersCompiled:handlers,htmlPages:7}));
