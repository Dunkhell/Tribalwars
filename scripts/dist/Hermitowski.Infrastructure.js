/*!
 * 
 *             Script: Infrastructure
 *             Created by: Hermitowski
 *             Version: 2.0.0.0 (3e46486b000594f003e292ca280401e55a9af218)
 *             License: GNU GENERAL PUBLIC LICENSE VERSION 3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 *             You can find sources used to built this script here: https://github.com/RNabla/tribalwars/scripts
 *
 */(()=>{"use strict";const t={t:function(t){if(!window["Hermitowski.Tracing"]||!window["Hermitowski.Tracing"][t])return{log:function(){},i:function(){},o:function(){}};const n=(new Error).stack.split("\n").slice(1),e="color: green;",a=function(){var e=(new Error).stack.split("\n").slice(2);const a=[`%c${t}`];for(var o=1;o<=e.length;o++)if(n.length-o<0||n.length-o>=0&&e[e.length-o]!=n[n.length-o]){const t=i(e[e.length-o]);t.length>0&&a.push(t)}return a.push(""),a},i=function(t){let n=t.split("@")[0];const e=n.split("async*");return e.length>1&&(n=e[1]),n=n.trim(),n},o={};return{log:function(){const t=a();console.log.apply(void 0,[t.join(" | "),e,...arguments])},i:function(){const t=a(),n=i(t[0]);o[n]=Date.now(),console.group.apply(void 0,[t.join(" | "),e,"Entry",...arguments])},o:function(){const t=a(),n=i(t[0]),r=o[n],c=[t.join(" | "),e,`Exit | Elapsed time: ${Date.now()-r} [ms]`];arguments.length>0&&c.push(` Returning: ${arguments[0]}`),console.log.apply(void 0,c),console.groupEnd()}}}};async function n(t){"string"!=typeof t&&(t=JSON.stringify(t));const n=(new TextEncoder).encode(t),e=await crypto.subtle.digest("SHA-256",n);return Array.from(new Uint8Array(e)).map((t=>t.toString(16).padStart(2,"0"))).join("")}function e(t){return parseInt((void 0!==t?t.getTime():Date.now())/1e3)}async function a(t){const n=new Promise(((n,e)=>{t.onsuccess=function(t){n(t.target.result)},t.onerror=function(t){e(t)}}));return await n}function i(t,n){return Math.floor(Math.random()*(n-t)+t)}const o="name",r="value",c="expiration_time_s",s={t:async function(){const e="Hermitowski.Storage",i=t.t(e),s="storage",u="readwrite",f="readonly",w="relaxed";i.i(arguments),i.log("Opening database");const y=window.indexedDB.open(e,1);y.onupgradeneeded=function(t){const n=t.target.result.createObjectStore(s,{keyPath:o,autoIncrement:!1});n.createIndex(o,o,{unique:!0}),n.createIndex(c,c,{unique:!1})};const d=await a(y),l=function(){return parseInt(Date.now()/1e3)};i.log("Deleting expired items");var g=d.transaction(s,u).objectStore(s).index(c).openCursor(IDBKeyRange.upperBound(l()));g.onsuccess=function(t){var n=t.target.result;n&&(i.log(n),n.delete(),n.continue())};const m=async function(t,e){return t+"."+("string"==typeof e?e:await n(e))};return i.o(),{u:async function(t,n){i.i(arguments);const e=await m(t,n),o=await a(d.transaction(s,f,{durability:w}).objectStore(s).get(e));return i.log(e,o,l()),i.o(),o&&o.l>l()?o:null},g:async function(t,n,e,f){i.i(arguments);const w=await m(t,n),y={[o]:w,[c]:l()+f,[r]:e};i.log(y),await a(d.transaction(s,u).objectStore(s).put(y)),i.o()},m:async function(t,n,e){i.i(arguments);const o=await m(t,n);let r=await a(d.transaction(s,f,{durability:w}).objectStore(s).get(o));return(!r||r.l<l())&&(r=await e(),r.name=o,i.log("created instance",r),await a(d.transaction(s,u,{durability:w}).objectStore(s).put(r))),r.name=n,i.log("returning",r),i.o(),r}}}},u={t:async function(a){const u="Hermitowski.MapFiles",f=t.t(u),w=await s.t(a),y=async function(t){f.i(arguments);var n=[];for(const a of t){var e=w.m(u,a,(async function(){return await d(a)}));n.push(e)}var a=await Promise.all(n),i={};for(const t of a)i[t.name]=t;return f.o(),i},d=async function(t){switch(t){case"village":return await l(t,(t=>({id:t[0],x:parseInt(t[2]),y:parseInt(t[3]),p:t[4]})));case"player":return await l(t,(t=>({id:t[0],name:t[1],_:t[2]})));case"ally":return await l(t,(t=>({id:t[0],name:t[1],tag:t[2]})));case"building_info":case"unit_info":case"config":return await g(t);default:throw new Error(`Not supported entity name - ${t}`)}},l=async function(t,n){f.i(arguments);const a=await fetch(`map/${t}.txt`),s=new Date(a.headers.get("last-modified")),u=await a.text(),w=u.split("\n"),y=w.filter((t=>t.trim().length>0)).map((t=>t.split(",").map((t=>p(t))))),d=[];for(const t of y)d.push(n(t));let l=e(s)+3600+i(15,120);return l<e()&&(l=e()+3600),f.o(),{[o]:"",[c]:l,[r]:d}},g=async function(t){f.i(arguments);const n=await fetch(`interface.php?func=get_${t}`),a=await n.text(),i=_(a);return f.o(),{[o]:"",[c]:e()+3600,[r]:i}},m=new RegExp(/\+/,"g"),p=function(t){return decodeURIComponent(t.replace(m," "))},_=function(t){const n=(new window.DOMParser).parseFromString(t,"text/xml");return v(n.children[0])},v=function(t){let n={};if(0===t.childElementCount)return t.textContent;for(const e of t.children)n[e.nodeName]=v(e);return n};return{v:async function(t){f.i(arguments);const n=await y(t);for(const e of t)n[e]=n[e].value;return f.o(),n},u:async function(t){const n=await w.u(a,t);return n?n.value:null},g:async function(t,n,e){return await w.g(a,t,n,e)},h:async function(t,e,i){f.i(arguments);const s="string"==typeof i?i:await n(i),u=async function(){f.i(arguments);const n=await y(e),a={};for(const t of e)a[t]=n[t].value;f.log("Passing following arguments into factory method",a,i);const s=await t(a,i);f.log("Computed result",s);const u=Math.min(...Object.keys(n).map((t=>n[t].l)));f.log("Expiration time set to",u);const w={[o]:"",[c]:u,[r]:s};return f.o(),w};var d=await w.m(a,s,u);return f.o(),d.value},D:async function(t,i,s){f.i();const u=await n(t.toString()+JSON.stringify(i));f.log("Digest: ",u);var y=await w.m(a,u,(async function(){f.i();const n=await t(i),a=e()+s;f.log("Expiration time set to",a);const u={[o]:"",[c]:a,[r]:n};return f.o(),u}));return f.o(),y.value}}}},f="Logger",w="Storage",y="MapFiles",d="Hermitowski.Infrastructure";window[d]=window[d]||{},window[d][f]=t,window[d][w]=s,window[d][y]=u})();