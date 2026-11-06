import {mkdir,writeFile,rename} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
const platform={win32:'windows',linux:'linux',darwin:'darwin'}[process.platform],arch={x64:'amd64',arm64:'arm64',ia32:'386'}[process.arch];
if(!platform||!arch)throw Error('Plateforme non prise en charge. Voir https://developers.cloudflare.com/tunnel/downloads/');
const windows=process.platform==='win32',name=`cloudflared-${platform}-${arch}${windows?'.exe':process.platform==='darwin'?'.tgz':''}`;
const directory=fileURLToPath(new URL('../.tools/',import.meta.url));await mkdir(directory,{recursive:true});
if(process.platform==='darwin')throw Error('Sur macOS, installer cloudflared avec Homebrew : brew install cloudflared');
const response=await fetch('https://github.com/cloudflare/cloudflared/releases/latest/download/'+name);if(!response.ok)throw Error('Téléchargement Cloudflare indisponible.');
const destination=fileURLToPath(new URL('../.tools/cloudflared'+(windows?'.exe':''),import.meta.url)),temporary=destination+'.download'+(windows?'.exe':'');
await writeFile(temporary,new Uint8Array(await response.arrayBuffer()),{mode:0o700});
if(windows){const quoted=temporary.replaceAll("'","''");execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command',`$sig = Get-AuthenticodeSignature -LiteralPath '${quoted}'; if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.Subject -notlike '*Cloudflare*') { exit 1 }`],{windowsHide:true,encoding:'utf8'});}
await rename(temporary,destination);console.log('Cloudflared installé dans .tools. Le bouton « Activer le lien Internet » est prêt.');
