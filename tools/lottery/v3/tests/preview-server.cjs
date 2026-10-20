/* 仅供本地 QA：页面全部使用模拟钱包/RPC/WS，不连接生产资金。 */
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webp':'image/webp','.jpg':'image/jpeg','.mp3':'audio/mpeg','.json':'application/json'};
http.createServer((req,res)=>{
 const url=new URL(req.url,'http://terminal.local');
 if(url.pathname==='/__qa/responsive'){
  const route=url.searchParams.get('page')||'/account/';if(!['/account/','/invite/','/lottery/','/anubis-play/','/'].includes(route)){res.writeHead(400);res.end();return;}
  res.setHeader('content-type',mime['.html']);res.end('<!doctype html><html><head><title>ANUBIS PLAY responsive QA</title><style>body{background:#18231d;color:#fff;font:14px system-ui;padding:12px}section{margin-bottom:24px}iframe{border:1px solid #657b6c;display:block;background:#0c1412}</style></head><body><h1>Responsive QA · simulated wallet only</h1>'+[[390,844],[844,390],[820,900]].map(size=>'<section><h2>'+size.join(' × ')+'</h2><iframe title="QA '+size.join('x')+'" width="'+size[0]+'" height="'+size[1]+'" src="'+route+'"></iframe></section>').join('')+'</body></html>');return;
 }
 if(url.pathname==='/__qa/mock.js'){res.setHeader('content-type',mime['.js']);res.end(fs.readFileSync(path.join(__dirname,'wallet-fixture.js')));return;}
 let file=path.resolve(root,'.'+decodeURIComponent(url.pathname));if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 try{if(fs.statSync(file).isDirectory())file=path.join(file,'index.html');let b=fs.readFileSync(file);res.setHeader('content-type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('cache-control','no-store');if(file.endsWith('.html'))b=b.toString().replace('<head>','<head><script src="/__qa/mock.js"></script>');res.end(b);}catch(e){res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT)||4173,'0.0.0.0',()=>console.log('QA preview ready; all wallet, RPC and game-service activity is simulated.'));
