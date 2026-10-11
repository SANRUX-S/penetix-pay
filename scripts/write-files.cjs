const fs=require('node:fs'),path=require('node:path');
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdout.write('Ready for app files on stdin.\n');
let buffer='';process.stdin.on('data',chunk=>{buffer+=chunk.toString();let files;try{files=JSON.parse(buffer)}catch{return}try{const root=process.cwd();for(const [file,content]of Object.entries(files)){const target=path.resolve(root,file);if(!target.startsWith(root+path.sep))throw Error('Outside app workspace');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,content,'utf8')}process.stdout.write('Wrote '+Object.keys(files).length+' app files.\n');process.exit(0)}catch(error){process.stderr.write(error.message);process.exit(1)}});
