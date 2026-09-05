import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
try{process.loadEnvFile?.(path.join(__dirname,'.env'));}catch{}
const PORT=Number(process.env.PORT||3000);
const DATA=path.join(__dirname,'data');
const STATE=path.join(DATA,'state.json');
const PUBLIC=path.join(__dirname,'public');
const APPS={github:'https://github.com/',gmail:'https://mail.google.com/',calendar:'https://calendar.google.com/',linkedin:'https://www.linkedin.com/',chatgpt:'https://chatgpt.com/'};

const fresh=()=>({tasks:[],notes:[],activity:[],history:[]});
async function load(){await mkdir(DATA,{recursive:true});try{return {...fresh(),...JSON.parse(await readFile(STATE,'utf8'))}}catch{return fresh()}}
async function save(s){await mkdir(DATA,{recursive:true});await writeFile(STATE,JSON.stringify(s,null,2))}
function activity(s,text,type='system'){s.activity.unshift({id:crypto.randomUUID(),text,type,at:new Date().toISOString()});s.activity=s.activity.slice(0,50)}
function task(s,title){const t={id:crypto.randomUUID(),title:String(title).trim(),done:false,createdAt:new Date().toISOString()};s.tasks.unshift(t);activity(s,`Created task: ${t.title}`,'task');return t}
function note(s,text){const n={id:crypto.randomUUID(),text:String(text).trim(),createdAt:new Date().toISOString()};s.notes.unshift(n);activity(s,`Saved note: ${n.text}`,'note');return n}
function safeState(s){const x={...s};delete x.history;return x}
function reply(res,status,data,type='application/json; charset=utf-8'){res.writeHead(status,{'content-type':type,'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(type.startsWith('application/json')?JSON.stringify(data):data)}
async function body(req){let raw='';for await(const c of req){raw+=c;if(raw.length>1_000_000)throw new Error('Request too large')}return raw?JSON.parse(raw):{}}

function localCommand(input,s){
  let m=input.match(/^(?:add|create)(?: a)? task\s+(.+)$/i)||input.match(/^remind me(?: to)?\s+(.+)$/i);if(m){const t=task(s,m[1]);return {handled:true,text:`Task created: ${t.title}`}}
  m=input.match(/^(?:remember|note)\s+(.+)$/i);if(m){const n=note(s,m[1]);return {handled:true,text:`Saved to memory: ${n.text}`}}
  if(/^(show|list)?\s*(my )?tasks$/i.test(input)){const open=s.tasks.filter(x=>!x.done);return {handled:true,text:open.length?open.map((x,i)=>`${i+1}. ${x.title}`).join(' | '):'You have no open tasks.'}}
  if(/^(what do you remember|memory|notes)$/i.test(input)){return {handled:true,text:s.notes.length?s.notes.slice(0,8).map((x,i)=>`${i+1}. ${x.text}`).join(' | '):'Memory is empty.'}}
  m=input.match(/^(?:complete|finish) task\s+(.+)$/i);if(m){const q=m[1].toLowerCase();const open=s.tasks.filter(x=>!x.done);const t=/^\d+$/.test(q)?open[Number(q)-1]:open.find(x=>x.title.toLowerCase().includes(q));if(!t)return {handled:true,text:'I could not find that open task.'};t.done=true;t.completedAt=new Date().toISOString();activity(s,`Completed task: ${t.title}`,'task');return {handled:true,text:`Completed: ${t.title}`}}
  m=input.match(/^(?:open|launch)\s+(github|gmail|calendar|linkedin|chatgpt)$/i);if(m){const name=m[1].toLowerCase();activity(s,`Open ${name}`,'action');return {handled:true,text:`Opening ${name}.`,actions:[{type:'open_url',url:APPS[name]}]}}
  if(/^(help|capabilities|what can you do)$/i.test(input))return {handled:true,text:'I can manage tasks and memory, open supported apps, take voice commands, and use OpenAI for natural conversation when a server-side key is configured.'};
  return {handled:false};
}

const tools=[
 {type:'function',name:'create_task',description:'Create a local task.',strict:true,parameters:{type:'object',properties:{title:{type:'string'}},required:['title'],additionalProperties:false}},
 {type:'function',name:'save_note',description:'Save information to local memory.',strict:true,parameters:{type:'object',properties:{text:{type:'string'}},required:['text'],additionalProperties:false}},
 {type:'function',name:'open_app',description:'Open a supported web app.',strict:true,parameters:{type:'object',properties:{app:{type:'string',enum:Object.keys(APPS)}},required:['app'],additionalProperties:false}}
];
function runTool(s,c){let a={};try{a=JSON.parse(c.arguments||'{}')}catch{};if(c.name==='create_task'){const t=task(s,a.title||'Untitled');return [[{type:'function_call_output',call_id:c.call_id,output:JSON.stringify({ok:true,task:t})}],[]]};if(c.name==='save_note'){const n=note(s,a.text||'');return [[{type:'function_call_output',call_id:c.call_id,output:JSON.stringify({ok:true,note:n})}],[]]};if(c.name==='open_app'&&APPS[a.app])return [[{type:'function_call_output',call_id:c.call_id,output:JSON.stringify({ok:true,app:a.app})}],[{type:'open_url',url:APPS[a.app]}]];return [[{type:'function_call_output',call_id:c.call_id,output:JSON.stringify({ok:false})}],[]]}
async function openai(payload){const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${process.env.OPENAI_API_KEY}`,'content-type':'application/json'},body:JSON.stringify(payload)});if(!r.ok)throw new Error(`OpenAI ${r.status}: ${(await r.text()).slice(0,250)}`);return r.json()}
function outputText(r){return (r.output||[]).flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('\n').trim()}
async function aiTurn(input,s){const model=process.env.OPENAI_MODEL||'gpt-5.6-luna';const instructions='You are TILKI CORE, a concise Jarvis-style personal assistant. Use tools when the user requests supported actions. Never claim unsupported external actions succeeded.';let current=[...s.history.slice(-8).map(x=>({role:x.role,content:x.content})),{role:'user',content:input}];let r=await openai({model,instructions,tools,tool_choice:'auto',input:current});const actions=[];for(let i=0;i<3;i++){const calls=(r.output||[]).filter(x=>x.type==='function_call');if(!calls.length)break;const outs=[];for(const c of calls){const [toolOut,acts]=runTool(s,c);outs.push(...toolOut);actions.push(...acts)}current=[...current,...(r.output||[]),...outs];r=await openai({model,instructions,tools,tool_choice:'auto',input:current})}return {text:outputText(r)||'Done.',actions}}

async function handler(req,res){try{const u=new URL(req.url,`http://${req.headers.host||'localhost'}`);if(u.pathname==='/api/health')return reply(res,200,{ok:true,agent:'TILKI CORE',aiConfigured:Boolean(process.env.OPENAI_API_KEY),model:process.env.OPENAI_MODEL||'gpt-5.6-luna'});if(u.pathname==='/api/state'){const s=await load();return reply(res,200,safeState(s))}if(u.pathname==='/api/chat'&&req.method==='POST'){const {message}=await body(req);const input=String(message||'').trim();if(!input)return reply(res,400,{error:'Message required'});const s=await load();const local=localCommand(input,s);let text=local.text,mode='local',actions=local.actions||[];if(!local.handled){if(process.env.OPENAI_API_KEY){try{const a=await aiTurn(input,s);text=a.text;actions=a.actions;mode='ai'}catch(e){text=`AI error: ${e.message}`;mode='ai-error'}}else text='Local mode is active. I can manage tasks, notes and app shortcuts. Add OPENAI_API_KEY in .env for full AI conversation.'}s.history.push({role:'user',content:input},{role:'assistant',content:text});s.history=s.history.slice(-16);await save(s);return reply(res,200,{reply:text,mode,actions,state:safeState(s)})}if(u.pathname==='/api/tasks'&&req.method==='POST'){const {title}=await body(req);const s=await load();const t=task(s,title);await save(s);return reply(res,201,{task:t,state:safeState(s)})}if(u.pathname==='/api/notes'&&req.method==='POST'){const {text}=await body(req);const s=await load();const n=note(s,text);await save(s);return reply(res,201,{note:n,state:safeState(s)})}const file=u.pathname==='/'?'index.html':u.pathname.replace(/^\//,'');const full=path.join(PUBLIC,file);if(!full.startsWith(PUBLIC))return reply(res,403,'Forbidden','text/plain');const data=await readFile(full);const ext=path.extname(full);const mime=ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript; charset=utf-8':'text/css; charset=utf-8';return reply(res,200,data,mime)}catch(e){if(e.code==='ENOENT')return reply(res,404,'Not found','text/plain');return reply(res,500,{error:e.message})}}

export {handler};
if(process.argv[1]===fileURLToPath(import.meta.url)){http.createServer(handler).listen(PORT,'0.0.0.0',()=>console.log(`TILKI CORE online: http://localhost:${PORT}`))}
