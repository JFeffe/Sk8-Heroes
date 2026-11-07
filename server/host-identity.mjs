import path from 'node:path';
import {createHash} from 'node:crypto';
import {APP_VERSION} from '../public/release-notes.js';

// Only returned to localhost: distinguish another checkout or an older server.
export function hostIdentity(root){
 const resolved=path.resolve(root),normalized=process.platform==='win32'?resolved.toLowerCase():resolved;
 return createHash('sha256').update(normalized).update(APP_VERSION).digest('hex');
}
