import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {handler} from '../server.js';

async function withServer(fn){const s=http.createServer(handler);await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;try{await fn(`http://127.0.0.1:${port}`)}finally{await new Promise(r=>s.close(r))}}

test('health endpoint works',()=>withServer(async base=>{const r=await fetch(base+'/api/health');assert.equal(r.status,200);const d=await r.json();assert.equal(d.ok,true);assert.equal(d.agent,'TILKI CORE')}));

test('frontend loads',()=>withServer(async base=>{const r=await fetch(base);assert.equal(r.status,200);assert.match(await r.text(),/TILKI CORE/)}));

test('local task command works',()=>withServer(async base=>{const r=await fetch(base+'/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({message:'add task verify github agent'})});assert.equal(r.status,200);const d=await r.json();assert.match(d.reply,/Task created/);assert.ok(d.state.tasks.some(x=>x.title==='verify github agent'))}));
