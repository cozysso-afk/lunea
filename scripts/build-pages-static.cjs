'use strict';
// Publish the current index/loader dependency closure without rewriting either.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),OUT=path.join(ROOT,'dist-pages');
function references(text){
  const refs=new Set();
  for(const m of text.matchAll(/['"`]([^'"`\r\n<>]*?\.(?:html|js|json|webmanifest|png|jpe?g|svg|webp|ico|css)(?:\?[^'"`\s<>]*)?)['"`]/gi)){
    let value=m[1];
    if(/^(?:https?:|data:|blob:)/i.test(value)||value.includes('${'))continue;
    if(!/^(?:\.\/)?[\w./ -]+\.(?:html|js|json|webmanifest|png|jpe?g|svg|webp|ico|css)(?:\?|$)/i.test(value))continue;
    if(value.startsWith('/')||value.includes('../'))throw Error('Root/parent asset URL: '+value);
    // Bare RWS filenames are arguments to the external Wikimedia resolver.
    // Local scripts and explicitly relative paths remain strict dependencies.
    if(!value.startsWith('./')&&!value.startsWith('assets/')&&!/\.js(?:\?|$)/i.test(value)&&!fs.existsSync(path.join(ROOT,value.split('?')[0])))continue;
    value=value.split('?')[0].replace(/^\.\//,'');
    if(value.startsWith('/')||value.includes('..'))throw Error('Root/parent asset URL: '+value);
    refs.add(value);
  }
  return [...refs];
}
function plan(root=ROOT){
  const files=new Set(),queue=['index.html'];
  while(queue.length){
    const file=queue.shift();if(files.has(file))continue;
    const abs=path.join(root,file);
    if(!fs.existsSync(abs))throw Error('Missing runtime dependency: '+file);
    if(!fs.statSync(abs).isFile())throw Error('Not a runtime file: '+file);
    files.add(file);
    if(/\.(?:html|js|json|webmanifest|css)$/.test(file))queue.push(...references(fs.readFileSync(abs,'utf8')));
  }
  // Dynamic card-code paths resolve within assets or to root card images.
  function images(dir,prefix=''){
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
      const name=prefix+entry.name;if(entry.isSymbolicLink())throw Error('Symlink: '+name);
      if(entry.isDirectory()){if(prefix||entry.name==='assets')images(path.join(dir,entry.name),name+'/');}
      else if(/\.(?:png|jpe?g|webp|svg|ico|json|webmanifest)$/i.test(name)&&!['vercel.json','package.json','package-lock.json','lunea-build.json'].includes(name))files.add(name);
    }
  }
  images(root);
  return [...files].sort();
}
function build(){
  const files=plan();fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
  for(const file of files){const dest=path.join(OUT,file);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(ROOT,file),dest);}
  fs.writeFileSync(path.join(OUT,'.nojekyll'),'');
  if(!fs.readFileSync(path.join(OUT,'index.html')).equals(fs.readFileSync(path.join(ROOT,'index.html'))))throw Error('Index changed');
  console.log('Pages artifact: '+files.length+' files; index byte-identical; no injected scripts');
  return files;
}
module.exports={references,plan,build};if(require.main===module)build();
