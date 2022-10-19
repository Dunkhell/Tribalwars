/*!
 * 
 *             Script: Faking
 *             Created by: Hermitowski
 *             Version: 4.2.1 (559f6e6e0e7851399baa1d6e72d19643db09e5dd)
 *             License: GNU GENERAL PUBLIC LICENSE VERSION 3 https://www.gnu.org/licenses/gpl-3.0.en.html
 *
 *             You can find sources used to built this script here: https://github.com/RNabla/tribalwars/scripts
 *
 */(()=>{"use strict";async function t(t){"string"!=typeof t&&(t=JSON.stringify(t));const e=(new TextEncoder).encode(t),a=await crypto.subtle.digest("SHA-256",e);return Array.from(new Uint8Array(a)).map((t=>t.toString(16).padStart(2,"0"))).join("")}function e(t){return t<10?`0${t}`:`${t}`}async function a(t){const e=new Promise(((e,a)=>{t.onsuccess=function(t){e(t.target.result)},t.onerror=function(t){a(t)}}));return await e}Error;const i="storage",n="name",s="expiration_time_s",r="readwrite",o="readonly";class _{constructor(t,e){this.data_provider=t,this.database=e}static async get_item_name(e,a){return e+"."+("string"==typeof a?a:await t(a))}async get_item(t,e){const n=await _.get_item_name(t,e),s=await a(this.database.transaction(i,o).objectStore(i).get(n));return this.data_provider.get_current_timestamp_s(),s&&s.expiration_time_s>this.data_provider.get_current_timestamp_s()?s:null}async set_item(t,e,n,s){const o={name:await _.get_item_name(t,e),expiration_time_s:this.data_provider.get_current_timestamp_s()+s,value:n};await a(this.database.transaction(i,r).objectStore(i).put(o))}async get_or_add_item(t,e,n){const s=await _.get_item_name(t,e);let l=await a(this.database.transaction(i,o).objectStore(i).get(s));return(!l||l.expiration_time_s<this.data_provider.get_current_timestamp_s())&&(l=await n(),l.name=s,await a(this.database.transaction(i,r).objectStore(i).put(l))),l.name=s,l}}var l;!function(t){t.config="config",t.building_info="building_info",t.unit_info="unit_info",t.village="village",t.player="player",t.ally="ally"}(l||(l={}));class c{constructor(t,e,a){this.user_namespace=t,this.storage=e,this.data_provider=a,this.regex=new RegExp(/\+/,"g")}async get_world_info_core(t){const e=[];for(const a of t){const t=this.storage.get_or_add_item(c.namespace,a.toString(),(async()=>await this.fetch_from_server(a)));e.push(t)}const a=await Promise.all(e),i={};for(let e=0;e<t.length;e++)i[t[e]]=a[e];return i}async fetch_from_server(t){switch(t){case l.village:return await this.fetch_from_server_map_files("village",(function(t){return{id:t[0],x:parseInt(t[2]),y:parseInt(t[3]),player_id:t[4]}}));case l.player:return await this.fetch_from_server_map_files("player",(function(t){return{id:t[0],name:t[1],ally_id:t[2]}}));case l.ally:return await this.fetch_from_server_map_files("ally",(function(t){return{id:t[0],name:t[1],tag:t[2]}}));case l.building_info:return await this.fetch_from_server_config("building_info");case l.unit_info:return await this.fetch_from_server_config("unit_info");case l.config:return await this.fetch_from_server_config("config")}}async fetch_from_server_map_files(t,e){const a=await fetch(`map/${t}.txt`),i=new Date(a.headers.get("last-modified")),n=(await a.text()).split("\n").filter((t=>t.trim().length>0)).map((t=>t.split(",").map((t=>this.decode(t))))),s=[];for(const t of n)s.push(e(t));let r=(o=i,Math.floor(o.getTime()/1e3)+3600+this.data_provider.get_random_number(15,120));for(var o;r<this.data_provider.get_current_timestamp_s();)r=this.data_provider.get_current_timestamp_s()+3600;return{name:"",expiration_time_s:r,value:s}}async fetch_from_server_config(t){const e=await fetch(`interface.php?func=get_${t}`),a=await e.text(),i=this.get_json_from_xml_string(a);return{name:"",expiration_time_s:this.data_provider.get_current_timestamp_s()+3600,value:i}}decode(t){return decodeURIComponent(t.replace(this.regex," "))}get_json_from_xml_string(t){const e=(new window.DOMParser).parseFromString(t,"text/xml");return this.convert_xml_to_json(e.children[0])}convert_xml_to_json(t){const e={};if(0===t.childElementCount)return t.textContent;for(const a of t.children)e[a.nodeName]=this.convert_xml_to_json(a);return e}convert_to_world_info(t){return{village:t.village?.value,player:t.player?.value,ally:t.ally?.value,config:t.config?.value,building_info:t.building_info?.value,unit_info:t.unit_info?.value}}async get_world_info(t){const e=await this.get_world_info_core(t);return this.convert_to_world_info(e)}async get_item(t){const e=await this.storage.get_item(this.user_namespace,t);return e?e.value:null}async set_item(t,e,a){return await this.storage.set_item(this.user_namespace,t,e,a)}async get_or_compute(e,a,i){const n="string"==typeof i?i:await t(i);return(await this.storage.get_or_add_item(this.user_namespace,n,(async()=>{const t=await this.get_world_info_core(a),n=this.convert_to_world_info(t),s=await e(n,"string"==typeof i?void 0:i);return{name:"",expiration_time_s:Math.min(...a.map((e=>t[e].expiration_time_s))),value:s}}))).value}async get_or_compute_dynamic(e,a,i){const n=await t(e.toString()+JSON.stringify(a));return(await this.storage.get_or_add_item(this.user_namespace,n,(async()=>{const t=await e(a);return{name:"",expiration_time_s:this.data_provider.get_current_timestamp_s()+i,value:t}}))).value}}c.namespace="Hermitowski.MapFiles";const u={ATTACK_TIME:"Wojsko dojdzie __DAY__.__MONTH__ na __HOURS__:__MINUTES__<br/>Cel: __TARGET__ __PLAYER_INFO__",ERROR_FORUM_CONFIG_THREAD_ID:"forum_config.thread_id jest nieprawid\u0142owy",ERROR_FORUM_CONFIG_SPOILER_NAME:"forum_config.spoiler_name jest nieprawid\u0142owy",ERROR_FORUM_CONFIG_TTL:"forum_config.ttl jest nieprawid\u0142owy",ERROR_FORUM_CONFIG_PAGE:"forum_config.page jest nieprawid\u0142owy",ERROR_FORUM_CONFIG_THREAD_DOES_NOT_EXIST:"W\u0105tek nie istnieje",ERROR_FORUM_CONFIG_SPOILER_NONE:"Spoiler o podanej nazwie nie istnieje",ERROR_FORUM_CONFIG_SPOILER_MULTIPLE:"Znaleziono wi\u0119cej ni\u017c jeden spoiler o podanej nazwie",ERROR_FORUM_CONFIG_CODE_SNIPPET_NONE:"Wskazany spoiler nie zawiera konfiguracji",ERROR_FORUM_CONFIG_CODE_SNIPPET_MULTIPLE:"Wskazany spoiler zawiera wi\u0119cej ni\u017c jedn\u0105 konfiguracj\u0119",ERROR_FORUM_CONFIG_CODE_SNIPPET_MALFORMED:"Wskazany spoiler nie zawiera konfiguracji w formacie JSON",ERROR_SCREEN_VILLAGE_OUT_OF_GROUP:"Wioska poza grup\u0105. Przechodz\u0119 do nast\u0119pnej wioski z grupy",ERROR_SCREEN_REDIRECT:"Przechodz\u0119 do przegl\u0105du placu",ERROR_SCREEN_NO_ACTION:"Na tym ekranie nie ma akcji do wykonania",ERROR_CONFIGURATION_MISSING:"Brak konfiguracji u\u017cytkownika",ERROR_CONFIGURATION_OPTION_UNKNOWN:"Skrypt zawiera nieznan\u0105 opcj\u0119",ERROR_TROOPS_NOT_ENOUGH:"Nie uda\u0142o si\u0119 wybra\u0107 wystarczaj\u0105cej liczby jednostek",ERROR_TROOPS_EMPTY_SELECTION:"Wybrane szablony nie pozwalaj\u0105 na wyb\xf3r jednostek",ERROR_TROOPS_EMPTY_TEMPLATES:"Nie wybrano szablon\xf3w z wyborem jednostek",ERROR_POOL_EMPTY:"Obecne ustawienia nie definuj\u0105 \u017cadnych cel\xf3w",ERROR_POOL_EMPTY_SNOBS:"W puli wiosek pozosta\u0142y wioski, le\u017c\u0105ce poza zasi\u0119giem szlachcic\xf3w",ERROR_POOL_EMPTY_BLOCKED_VILLAGES:"W puli wiosek pozosta\u0142y wioski, kt\xf3re zosta\u0142y niedawno wybrane",ERROR_POOL_EMPTY_BLOCKED_PLAYERS:"W puli wiosek pozosta\u0142y wioski, kt\xf3re nale\u017c\u0105 od ostatnio wybranych graczy",ERROR_POOL_EMPTY_NIGHT_BONUS:"W puli wiosek pozosta\u0142y wioski, na kt\xf3re atak doszed\u0142by w bonusie nocnym",ERROR_POOL_EMPTY_DATE_RANGES:"W puli wiosek pozosta\u0142y wioski, na kt\xf3re atak doszed\u0142by poza wybranymi przedzia\u0142ami czasowymi"};class g{static handle_error(t,e){console.error(t);const a=`<h2>WTF - What a Terrible Failure</h2>\n            <p>\n                Co\u015b posz\u0142o nie tak. Je\u017celi jeste\u015b przekonany/a, \u017ce konfiguracja jest prawid\u0142owa, wklej poni\u017csze zakl\u0119cie na forum wraz z kr\xf3tkim opisem czynno\u015bci, kt\xf3re doprowadzi\u0142y do tej katastrofy\n                <textarea rows='12' cols='80'>${t}\n\n${t.stack}</textarea><br/>\n                <a href='${e}'>W\u0105tek na forum</a>\n            </p>`;Dialog.show(g.namespace,a)}static async run(t,e){try{const t=await e();UI.SuccessMessage(t)}catch(e){e instanceof p?(UI.ErrorMessage(e.message),e.href&&(location.href=e.href)):this.handle_error(e,t)}}}g.namespace="Hermitowski.Bootstrap";class p{constructor(t,e){this.message=t,this.href=e}}class h{constructor(t,e,a,i){this.document=t,this.settings=i,this.world_info=e,this.game_data=a,this.selectable_unit_names=a.units.filter((t=>"militia"!==t))}select_troops(){if(0==this.settings.troops_templates.length)throw new p(u.ERROR_TROOPS_EMPTY_TEMPLATES);const t=this.get_available_troops();for(const e of this.settings.troops_templates){const a=this.try_fill_troops(t,e);if(a)return a}throw new p(u.ERROR_TROOPS_NOT_ENOUGH)}try_fill_troops(t,e){const a=JSON.parse(JSON.stringify(e));for(const e in a)if(t[e]<a[e])return a[e],t[e],null;const i=Number(this.world_info.config.game.fake_limit);if(0==i)return a;if(5==a.spy&&Object.keys(a).filter((t=>"spy"!==t)).every((t=>0==a[t])))return a;const n=Math.floor(this.game_data.village.points*i*.01),s=this.count_population(a);for(const t of this.selectable_unit_names)Object.prototype.hasOwnProperty.call(a,t)||(a[t]=0);const r=this.settings.fill_troops.split(",");let o=n-s;for(const e of r){const i=e.split(":"),n=i[0];if(!this.selectable_unit_names.includes(n))continue;const s=Number(this.world_info.unit_info[n].pop),r=[t[n]-a[n]];i.length>1&&r.push(Number(i[1])),this.settings.fill_exact||r.push(Math.ceil(o/s));const _=Math.min(...r);_>0&&(a[n]+=_,o-=s*_)}return o<=0?a:null}get_available_troops(){const t={};for(const e of this.selectable_unit_names)t[e]=Number(this.document.querySelector(`#unit_input_${e}`).dataset.allCount),Object.prototype.hasOwnProperty.call(this.settings.safeguard,e)&&(t[e]=Math.max(0,t[e]-this.settings.safeguard[e]));return t}count_population(t){return Object.keys(t).map((e=>t[e]*Number(this.world_info.unit_info[e].pop))).reduce(((t,e)=>t+e),0)}}class m{constructor(t,e){this.settings=e,this.map_files=t}async pool_get(){const t={allies:this.settings.allies,ally_tags:this.settings.ally_tags,ally_ids:this.settings.ally_ids,players:this.settings.players,player_ids:this.settings.player_ids,include_barbarians:this.settings.include_barbarians,boundaries_box:this.settings.boundaries_box,boundaries_circle:this.settings.boundaries_circle,coords:this.settings.coords},e=await this.map_files.get_or_compute((async(t,e)=>{const a=e.players.split(",").map((t=>t.trim().toLowerCase())),i=e.player_ids.split(",").map((t=>t.trim())),n=e.allies.split(",").map((t=>t.trim().toLowerCase())),s=e.ally_tags.split(",").map((t=>t.trim().toLowerCase())),r=e.ally_ids.split(",").map((t=>t.trim())),o=new Set(t.ally.filter((t=>n.includes(t.name.toLowerCase())||s.includes(t.tag.toLowerCase())||r.includes(t.id))).map((t=>t.id))),_=new Set(t.player.filter((t=>a.includes(t.name.toLowerCase())||o.has(t.ally_id)||i.includes(t.id))).map((t=>t.id))),l=new Set,c=[];let u=t.village.filter((t=>e.include_barbarians&&t.player_id===w||_.has(t.player_id)));e.boundaries_box.length&&(u=u.filter((t=>this.is_in_any_boundary_box(t,e.boundaries_box)))),e.boundaries_circle.length&&(u=u.filter((t=>this.is_in_any_boundary_circle(t,e.boundaries_circle))));for(const e of u){const a=this.get_village_as_target(t,e);c.push(a),l.add(1e3*e.x+e.y)}const g=new RegExp(/\d{1,3}\|\d{1,3}/g),p=e.coords.match(g);if(null!=p)for(const e of p.map((t=>t.split("|").map(Number)))){const a=1e3*e[0]+e[1];if(!l.has(a)){const i=t.village.find((t=>t.x==e[0]&&t.y==e[1]));if(i){const e=this.get_village_as_target(t,i);c.push(e),l.add(a)}}}return c}),[l.ally,l.player,l.village],t);if(0===e.length)throw new p(u.ERROR_POOL_EMPTY);return e}get_village_as_target(t,e){const a=e.player_id!==w?t.player.find((t=>t.id==e.player_id)):null,i=null!=a&&a.ally_id!==b?t.ally.find((t=>t.id==a.ally_id)):null,n=a?a.name:null,s=i?i.tag:null;return[e.x,e.y,e.player_id,n,s]}is_in_any_boundary_box(t,e){for(const a of e)if(a.min_x<=t.x&&t.x<=a.max_x&&a.min_y<=t.y&&t.y<=a.max_y)return!0;return!1}is_in_any_boundary_circle(t,e){for(const a of e){const e=a.x-t.x,i=a.y-t.y;if(e*e+i*i<=a.r*a.r)return!0}return!1}}class d{static calculate_distance(t,e){return Math.hypot(t.village.x-e[0],t.village.y-e[1])}static calculate_arrival_time(t,e,a,i){const n=d.calculate_distance(t,e);return new Date(1e3*(i+n*a*60))}static get_troops_speed(t,e){let a=0;for(const i in e)Object.prototype.hasOwnProperty.call(e,i)&&0!==e[i]&&(a=Math.max(Number(t.unit_info[i].speed),a));if(0===a)throw new p(u.ERROR_TROOPS_EMPTY_SELECTION);return a}}class f{constructor(t,e,a,i){this.world_info=t,this.game_data=a,this.data_provider=e,this.settings=i,this.timestamp_s=this.data_provider.get_current_timestamp_s()}apply_filter(t,e){const a=d.get_troops_speed(this.world_info,e);return t=this.apply_night_bonus(t,e,a),this.apply_date_ranges(t,a)}apply_night_bonus(t,e,a){const i=Object.keys(e).filter((t=>"spy"!==t)).every((t=>0==e[t]));if("1"===this.world_info.config.night.active&&this.settings.skip_night_bonus&&!i){const e=Number(this.world_info.config.night.start_hour),i=Number(this.world_info.config.night.end_hour);if(0===(t=t.filter((t=>{if(t[2]===w)return!0;const n=d.calculate_arrival_time(this.game_data,t,a,this.timestamp_s).getHours();return e<i&&0==e?n>=i:e<i?n>i&&n<e:e>i&&0==i?n<e:n<e&&n>=i}))).length)throw new p(u.ERROR_POOL_EMPTY_NIGHT_BONUS)}return t}apply_date_ranges(t,e){if(this.settings.date_ranges.length>0){const a=t;for(const i of this.settings.date_ranges){let n=null;if(-1!=i[0][0]&&-1!=i[1][0]){const t=new Date(i[0][2],i[0][1]-1,i[0][0],i[0][3],i[0][4]),a=new Date(i[1][2],i[1][1]-1,i[1][0],i[1][3],i[1][4]);n=i=>{const n=d.calculate_arrival_time(this.game_data,i,e,this.timestamp_s);return t<=n&&n<=a}}else{const t=this.get_minutes(i[0]),a=this.get_minutes(i[1]);n=i=>{const n=d.calculate_arrival_time(this.game_data,i,e,this.timestamp_s),s=this.get_minutes([-1,-1,-1,n.getHours(),n.getMinutes()]);return t<=s&&s<=a}}if((t=a.filter(n)).length>0)break}if(0==t.length)throw new p(u.ERROR_POOL_EMPTY_DATE_RANGES)}return t}get_minutes(t){return 60*t[3]+t[4]}}class y{constructor(t,e,a,i){this.map_files=t,this.game_data=a,this.data_provider=e,this.settings=i}async apply_blocking(t){return t=await this.pool_apply_blocking_local(t),await this.pool_apply_blocking_global(t)}async add_to_block_tables(t){this.settings.blocking_local&&await this.block_table_add_entry(t,this.blocking_local_get_key(),this.settings.blocking_local.time_s);for(const e of this.settings.blocking_global)await this.block_table_add_entry(t,this.blocking_global_get_key(e.name),e.time_s)}async pool_apply_blocking_local(t){return this.settings.blocking_local&&(t=await this.pool_apply_block_table(t,this.blocking_local_get_key(),this.settings.blocking_local.count,this.settings.blocking_local.block_players)),t}async pool_apply_blocking_global(t){for(const e of this.settings.blocking_global)t=await this.pool_apply_block_table(t,this.blocking_global_get_key(e.name),e.count,e.block_players);return t}blocking_local_get_key(){return"instance"===this.settings.blocking_local.scope?{village_id:this.game_data.village.id,settings:this.settings}:`blocking.l.${this.game_data.village.id}`}blocking_global_get_key(t){return`blocking.g.${t}`}async pool_apply_block_table(t,e,a,i){const n=await this.block_table_get(e),s=new Map,r=new Map,o=function(t){return 1e3*t[0]+t[1]};for(const t of n){const e=o(t[1]);if(s.has(e)?s.set(e,s.get(e)+1):s.set(e,1),i){const e=t[1][2];e!=w&&(r.has(e)?r.set(e,r.get(e)+1):r.set(e,1))}}if(i){if(0===(t=t.filter((t=>{const e=t[2];return(r.get(e)||0)<a}))).length)throw new p(u.ERROR_POOL_EMPTY_BLOCKED_PLAYERS)}else if(0===(t=t.filter((t=>{const e=o(t);return(s.get(e)||0)<a}))).length)throw new p(u.ERROR_POOL_EMPTY_BLOCKED_VILLAGES);return t}async block_table_get(t){let e=await this.map_files.get_item(t)||[];const a=this.data_provider.get_current_timestamp_s();let i=0;for(;i<e.length&&!(e[i][0]>=a);i++);return i==e.length?e=[]:i>0&&(e=e.slice(i)),e}async block_table_add_entry(t,e,a){const i=await this.block_table_get(e),n=[this.data_provider.get_current_timestamp_s()+a,[t[0],t[1],t[2]]];i.push(n),await this.map_files.set_item(e,i,a)}}const w="0",b="0";class R{constructor(t,e,a,i,n){this.settings=n,this.world_info=t,this.map_files=e,this.data_provider=a,this.game_data=i}async select_target(t){const e=new m(this.map_files,this.settings);let a=await e.pool_get();a=await this.pool_apply_troops_constraints(a,t);let i=null;this.settings.blocking_enabled&&(i=new y(this.map_files,this.data_provider,this.game_data,this.settings),a=await i.apply_blocking(a)),a=new f(this.world_info,this.data_provider,this.game_data,this.settings).apply_filter(a,t);const n=a[this.data_provider.get_random_number(0,a.length)],s=d.get_troops_speed(this.world_info,t);return this.settings.blocking_enabled&&i.add_to_block_tables(n),{x:n[0],y:n[1],player_name:n[3],ally_tag:n[4],arrival_date:d.calculate_arrival_time(this.game_data,n,s,this.data_provider.runtime_timestamp_s)}}pool_apply_troops_constraints(t,e){if(e.snob>0&&0===(t=t.filter((t=>d.calculate_distance(this.game_data,t)<Number(this.world_info.config.snob.max_dist)))).length)throw new p(u.ERROR_POOL_EMPTY_SNOBS);return t}}class O{static map_configuration(t){return{safeguard:O.as_troops(t.safeguard,{}),troops_templates:O.as_array(t.troops_templates,O.as_troops),fill_exact:O.as_boolean(t.fill_exact,!1),fill_troops:O.as_string(t.fill_troops,"spear,sword,axe,archer,spy,light,marcher,heavy,ram,catapult"),coords:O.as_string(t.coords,""),players:O.as_string(t.players,""),player_ids:O.as_string(t.player_ids,""),allies:O.as_string(t.allies,""),ally_tags:O.as_string(t.ally_tags,""),ally_ids:O.as_string(t.ally_ids,""),include_barbarians:O.as_boolean(t.include_barbarians,!1),boundaries_circle:O.as_array(t.boundaries,O.as_boundary_circle),boundaries_box:O.as_array(t.boundaries,O.as_boundary_box),blocking_enabled:O.as_boolean(t.blocking_enabled,!1),blocking_local:O.as_blocking_local(t.blocking_local,null),blocking_global:O.as_array(t.blocking_global,O.as_blocking_global),skip_night_bonus:O.as_boolean(t.skip_night_bonus,!0),date_ranges:O.as_array(t.date_ranges,O.as_date_range),changing_village_enabled:O.as_boolean(t.changing_village_enabled,!0)}}static as_string(t,e){return"string"==typeof t?t:e}static as_number(t,e){if("number"==typeof t)return t;if("string"==typeof t){const e=Number(t);if(!isNaN(e))return e}return e}static as_troops(t,e){if("object"==typeof t){const e={};for(const a of["spear","sword","axe","archer","spy","light","marcher","heavy","ram","catapult","knight","snob"])if(Object.prototype.hasOwnProperty.call(t,a)){const i=O.as_number(t[a],null);null!=i&&(e[a]=i)}return e}return e}static as_array(t,e){const a=[];if(Array.isArray(t))for(let i=0;i<t.length;i++){const n=e(t[i],null);null!=n&&a.push(n)}return a}static as_boolean(t,e){return"boolean"==typeof t?t:"string"==typeof t?"true"===t.trim().toLowerCase():e}static as_boundary_circle(t,e){if("object"==typeof t){const e=O.as_number(t.x,null),a=O.as_number(t.y,null),i=O.as_number(t.r,null);if(null!=e&&null!=a&&null!=i)return{x:e,y:a,r:i}}return e}static as_boundary_box(t,e){if("object"==typeof t){const e=O.as_number(t.min_x,null),a=O.as_number(t.max_x,null),i=O.as_number(t.min_y,null),n=O.as_number(t.max_y,null);if(null!=e&&null!=a&&null!=i&&null!=n)return{min_x:e,max_x:a,min_y:i,max_y:n}}return e}static as_date_range_part(t,e){if("string"==typeof t){const e=t.match(/\d+/g);if(null!=e&&(2===e.length||5===e.length))return[-1,-1,-1,...e.map(Number)].slice(-5)}return e}static as_date_range(t,e){if("string"==typeof t){const e=t.split("-");if(2===e.length){const t=[O.as_date_range_part(e[0],null),O.as_date_range_part(e[1],null)];if(null!=t[0]&&null!=t[1])return t}}return e}static as_blocking_local(t,e){if("object"==typeof t){const e=O.as_number(t.time_s,null),a=O.as_number(t.count,null),i=O.as_boolean(t.block_players,null),n="instance"===O.as_string(t.scope,null)?"instance":null;if(null!=e&&null!=a&&null!=i)return{time_s:e,count:a,block_players:i,scope:n}}return e}static as_blocking_global(t,e){if("object"==typeof t){const e=O.as_number(t.time_s,null),a=O.as_number(t.count,null),i=O.as_boolean(t.block_players,null),n=O.as_string(t.name,null);if(null!=e&&null!=a&&null!=i&&null!=n)return{time_s:e,count:a,block_players:i,name:n}}return e}}class E{constructor(t,e){this.tribalwars=t,this.map_files=e}async get_settings(t){if("object"!=typeof t)throw new p(u.ERROR_CONFIGURATION_MISSING);const e=this.try_get_forum_config(t.forum_config);return null!=e&&(t=await this.load_config_from_forum(e)),O.map_configuration(t)}try_get_forum_config(t){if("object"==typeof t){const e=O.as_number(t.thread_id,null);if(null==e)throw new p(u.ERROR_FORUM_CONFIG_THREAD_ID);const a=O.as_string(t.spoiler_name,null);if(null==a)throw new p(u.ERROR_FORUM_CONFIG_SPOILER_NAME);return{thread_id:e,page:O.as_number(t.page,0),spoiler_name:a,time_to_live_s:O.as_number(t.time_to_live_s,3600)}}return null}async load_config_from_forum(t){return await this.map_files.get_or_compute_dynamic((async t=>{const e=[...(await this.tribalwars.fetchDocument("GET","forum",{screenmode:"view_thread",thread_id:t.thread_id,page:t.page})).querySelectorAll("div.forum-container")].pop();if(!e)throw new p(u.ERROR_FORUM_CONFIG_THREAD_DOES_NOT_EXIST);const a=e.querySelectorAll(`div.spoiler > input[value="${t.spoiler_name}"]`);if(0==a.length)throw new p(u.ERROR_FORUM_CONFIG_SPOILER_NONE);if(a.length>1)throw new p(u.ERROR_FORUM_CONFIG_SPOILER_MULTIPLE);const i=a[0].parentElement.querySelectorAll("pre");if(0==i.length)throw new p(u.ERROR_FORUM_CONFIG_CODE_SNIPPET_NONE);if(i.length>1)throw new p(u.ERROR_FORUM_CONFIG_CODE_SNIPPET_MULTIPLE);const n=i[0].innerText;try{return JSON.parse(n)}catch{throw new p(u.ERROR_FORUM_CONFIG_CODE_SNIPPET_MALFORMED)}}),t,t.time_to_live_s)}}class k{constructor(t,e,a,i,n){this.namespace=t,this.data_provider=e,this.map_files=a,this.document=i,this.tribalwars=n,this.game_data=n.getGameData()}async main(t){this.check_screen();const e=await this.get_settings(t),a=await this.map_files.get_world_info([l.config,l.unit_info]);let i=null,n=null;try{i=this.get_troops(a,e),n=await this.get_target(a,e,i)}catch(t){if(e.changing_village_enabled&&t instanceof p){const e=this.document.querySelector("#village_switch_right");e&&(t.href=e.href)}throw t}return this.input_data(i,n)}check_screen(){const t=this.document.querySelector(".jump_link");if(t)throw new p(u.ERROR_SCREEN_VILLAGE_OUT_OF_GROUP,t.href);if("place"!==this.game_data.screen||!this.document.querySelector("#command-data-form")){const t=this.tribalwars.buildURL("GET","place",{mode:"command"});throw new p(u.ERROR_SCREEN_REDIRECT,t)}if(this.document.querySelector("#troop_confirm_go")||this.document.querySelector("#troop_confirm_submit"))throw new p(u.ERROR_SCREEN_NO_ACTION)}async get_settings(t){const e=new E(this.tribalwars,this.map_files);return await e.get_settings(t)}get_troops(t,e){return new h(this.document,t,this.game_data,e).select_troops()}async get_target(t,e,a){const i=new R(t,this.map_files,this.data_provider,this.game_data,e);return await i.select_target(a)}input_data(t,a){for(const e in t)this.document.querySelector(`#unit_input_${e}`).value=t[e]>0?t[e]:"";const i=this.document.querySelector(".target-input-field");i?i.value=`${a.x}|${a.y}`:(this.document.querySelector("#inputx").value=`${a.x}`,this.document.querySelector("#inputy").value=`${a.y}`);let n="";a.player_name&&(n+=a.player_name),a.ally_tag&&(n+=` [${a.ally_tag}]`);return u.ATTACK_TIME.replace("__DAY__",e(a.arrival_date.getDate())).replace("__MONTH__",e(a.arrival_date.getMonth()+1)).replace("__HOURS__",e(a.arrival_date.getHours())).replace("__MINUTES__",e(a.arrival_date.getMinutes())).replace("__PLAYER_INFO__",n).replace("__TARGET__",`${a.x}|${a.y}`)}}class v{querySelector(t){return document.querySelector(t)}querySelectorAll(t){return document.querySelectorAll(t)}}class N{getGameData(){return window.game_data}buildURL(t,e,a){return TribalWars.buildURL(t,e,a)}async fetchDocument(t,e,a){const i=this.buildURL(t,e,a),n=await fetch(i),s=await n.text(),r=document.createElement("document");return r.innerHTML=s,r}async fetchJSON(t,e,a){const i=this.buildURL(t,e,a),n=await fetch(i);return await n.json()}}class S{constructor(){this.runtime_timestamp_s=this.get_current_timestamp_s()}get_current_timestamp_s(){return Math.floor(Date.now()/1e3)}get_random_number(t,e){return Math.floor(Math.random()*(e-t)+t)}}!async function(){await g.run("https://forum.plemiona.pl/index.php?threads/hermitowskie-fejki.125294/",(async()=>{const t="Hermitowski.Faking",e=new S,o=await class{static async create_instance(t,e){const o=await class{static async create_instance(t){const e=window.indexedDB.open("Hermitowski.Storage",1);e.onupgradeneeded=function(t){const e=t.target.result.createObjectStore(i,{keyPath:n,autoIncrement:!1});e.createIndex(n,n,{unique:!0}),e.createIndex(s,s,{unique:!1})};const o=await a(e);return o.transaction(i,r).objectStore(i).index(s).openCursor(IDBKeyRange.upperBound(t.runtime_timestamp_s)).onsuccess=function(t){const e=t.target.result;e&&(e.delete(),e.continue())},new _(t,o)}}.create_instance(e);return new c(t,o,e)}}.create_instance(t,e),l=new v,u=new N,g=new k(t,e,o,l,u);return await g.main("object"==typeof HermitowskieFejki?HermitowskieFejki:void 0)}))}()})();