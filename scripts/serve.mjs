import {fileURLToPath} from 'node:url';
import {createGameServer} from '../server/http-server.mjs';

const root = fileURLToPath(new URL('../public/', import.meta.url));
const port=Number(process.env.PORT||8000),directory=fileURLToPath(new URL('../.local-games/',import.meta.url));
const {server,tunnel}=createGameServer({root,directory,port});
server.listen(port,'127.0.0.1',()=>console.log(`Sk8 Heroes : http://127.0.0.1:${port}`));
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{tunnel.stop();server.close(()=>process.exit());});
