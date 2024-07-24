
import {
    f_websersocket_serve,
    f_v_before_return_response__fileserver
} from "https://deno.land/x/websersocket@1.0.3/mod.js"

import {
    O_ws_client
} from "./classes.module.js"
import { ensureDir } from "https://deno.land/std@0.224.0/fs/ensure_dir.ts";

import { f_o_config } from "./functions.module.js";
import {
    f_a_o_entry__from_s_path
} from "https://deno.land/x/handyhelpers@4.0.7/mod.js"

let s_path_abs_file_current = new URL(import.meta.url).pathname;
let s_path_abs_folder_current = s_path_abs_file_current.split('/').slice(0, -1).join('/');
const b_deno_deploy = Deno.env.get("DENO_DEPLOYMENT_ID") !== undefined;

let a_o_ws_client = []

// let o_config = await f_o_config();
// console.log({o_config});

let s_api_key = `rtrjRM`
let s_path_abs_folder_cached_shaders = './localhost/cached_shaders';
if(!b_deno_deploy){

    await ensureDir(s_path_abs_folder_cached_shaders)// deno deploy is read only...
}

let f_handler = async function(o_request){

    // websocket 'request' handling here
    if(o_request.headers.get('Upgrade') == 'websocket'){

        const {
            socket: o_socket,
            response: o_response
        } = Deno.upgradeWebSocket(o_request);
        let o_ws_client = new O_ws_client(
            crypto.randomUUID(),
            o_socket
        )
        a_o_ws_client.push(o_ws_client);

        o_socket.addEventListener("open", (o_e) => {
            console.log({
                o_e, 
                s: 'o_socket.open called'
            })
        });

        o_socket.addEventListener("message", async (o_e) => {
            console.log({
                o_e, 
                s: 'o_socket.message called'
            })
            let v_data = o_e.data;
            a_o_ws_client
                .filter(o=>o!=o_ws_client)  // send to all other clients, comment out to send to all clients
                .forEach(o=>{
                    o.o_socket.send('message was received from a client')

                })
        });
        o_socket.addEventListener("close", async (o_e) => {
            a_o_ws_client.splice(a_o_ws_client.indexOf(o_ws_client), 1);
            console.log({
                o_e, 
                s: 'o_socket.close called'
            })
        });

        return o_response;
    }
    // normal http request handling here
    let o_url = new URL(o_request.url);
    if(o_url.pathname == '/'){
        return new Response(
            await Deno.readTextFile(
                `${s_path_abs_folder_current}/localhost/client.html`
            ),
            { 
                headers: {
                    'Content-type': "text/html"
                }
            }
        );
    }
    if(o_url.pathname == '/f_a_o_shader'){
        let n_ms_now = new Date().getTime();
        let n_ms_cache = 1000*60*5;
        let o_resp = await fetch(`https://www.shadertoy.com/api/v1/shaders/query/shaderclockdenodev?key=${s_api_key}`)
        let o = await o_resp.json();
        // console.log(o)
        let a_s_id_shader = o.Results;
        let a_o_entry = []
        if(!b_deno_deploy){
            a_o_entry = await f_a_o_entry__from_s_path(s_path_abs_folder_cached_shaders);
        }
        let a_o_shader = await Promise.all(a_s_id_shader.map(async s=>  {
            let b_update = false;
            let o_entry = a_o_entry.find(o=>{
                return o.name.includes(s) // name is `${s_id_shader}_${n_ms_ts}` McsyD2_1721819206283.json
            });
            let o = null;

            if(o_entry){
                let n_ms = o_entry.name.split('_').pop();
                let n_ms_delta = Math.abs(n_ms-n_ms_now);
                if(n_ms_delta > n_ms_cache){
                    b_update = true
                }else{
                    o = JSON.parse(await Deno.readTextFile(o_entry.s_path_file));
                }
            }else{
                b_update = true
            }

            if(b_update){
                let o_resp = await fetch(`https://www.shadertoy.com/api/v1/shaders/${s}?key=${s_api_key}`)
                o = await o_resp.json();
                let s_name_file_shader = `${o.Shader.info.id}_${n_ms_now}.json`
                if(!b_deno_deploy){
                    await Deno.writeTextFile(
                        `${s_path_abs_folder_cached_shaders}/${s_name_file_shader}`, 
                        JSON.stringify(o)
                    )
                }
            }
            return o
        }));
        // await Deno.writeTextFile('./localhost/a_o_shader.json', JSON.stringify(a_o_shader))
        // console.log(a_o_shader)

        return new Response(
            JSON.stringify(a_o_shader),
            { 
                headers: {
                    'Content-type': "application/json"
                }
            }
        );
    }

    return f_v_before_return_response__fileserver(
        o_request,
        `${s_path_abs_folder_current}/localhost/`
    )

}

let s_name_host = Deno.hostname(); // or maybe some ip adress 112.35.8.13
let b_development = s_name_host != 'the_server_name_here';
let s_name_host2 = (b_development) ? 'localhost': s_name_host;
// let o_info_certificates = {
//     s_path_certificate_file: './self_signed_cert_1c86856d-8ef3-487f-ac14-e79e59ad59c0.crt',
//     s_path_key_file: './self_signed_key_1c86856d-8ef3-487f-ac14-e79e59ad59c0.key'
// }
await f_websersocket_serve(
    [
        {
            n_port: 8080,
            b_https: false,
            s_hostname: s_name_host,
            f_v_before_return_response: f_handler
        },
        ...[
            (!b_deno_deploy) ? {
                // ...o_info_certificates,
                n_port: 8443,
                b_https: true,
                s_hostname: s_name_host,
                f_v_before_return_response: f_handler
            } : false
        ].filter(v=>v)   
    ]
);