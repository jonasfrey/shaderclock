
import {
    f_add_css,
    f_s_css_prefixed,
    o_variables, 
    f_s_css_from_o_variables
} from "https://deno.land/x/f_add_css@1.1/mod.js"

import {
    f_o_html__and_make_renderable,
}
from 'https://deno.land/x/f_o_html_from_o_js@2.9/mod.js'

import {
    f_o_webgl_program,
    f_delete_o_webgl_program,
    f_resize_canvas_from_o_webgl_program,
    f_render_from_o_webgl_program
} from "https://deno.land/x/handyhelpers@4.0.7/mod.js"

let o_state = {

}
o_variables.n_rem_font_size_base = 1. // adjust font size, other variables can also be adapted before adding the css to the dom
o_variables.n_rem_padding_interactive_elements = 0.5; // adjust padding for interactive elements 
f_add_css(
    `
    body{
        min-height: 100vh;
        min-width: 100vw;
        /* background: rgba(0,0,0,0.84);*/
        display:flex;
        justify-content:center;
    }
    canvas{
        width: 100%;
        height: 100%;
        position:fixed;
        z-index:-1;
    }
 
    ${
        f_s_css_from_o_variables(
            o_variables
        )
    }
    `

);




// it is our job to create or get the cavas
let o_canvas = document.createElement('canvas'); // or document.querySelector("#my_canvas");
// just for the demo 
// o_canvas.style.position = 'fixed';
// o_canvas.style.width = '100vw';
// o_canvas.style.height = '100vh';
let o_webgl_program = f_o_webgl_program(
    o_canvas,
    `#version 300 es
    in vec4 a_o_vec_position_vertex;
    void main() {
        gl_Position = a_o_vec_position_vertex;
    }`, 
    `#version 300 es
    precision mediump float;
    in vec2 o_trn_nor_pixel;
    out vec4 fragColor;
    uniform float n_sec_utc;
    uniform vec2 o_vec2_scale_canvas;

    void main() {
        vec2 iResolution = o_vec2_scale_canvas;
        vec2 fragCoord = gl_FragCoord.xy*iResolution.xy;
        vec4 iDate = vec4(0., 0., 0., n_sec_utc);
        
        // Normalized pixel coordinates (from 0 to 1)
        vec2 o_trn = (fragCoord.xy-iResolution.xy*.5)/min(iResolution.y, iResolution.x);
        o_trn*=1.2;
    
        float n_sec = iDate.w;
        float n_sec_mod = mod(n_sec , 60.);
        float n_sec_mod_nor = n_sec_mod / 60.;
        float n_min_mod = floor(mod(n_sec, 60.*60.));
        float n_min_mod_nor = n_min_mod / (60.*60.);
        float n_hou_mod = floor(mod(n_sec, 60.*60.*12.));
        float n_hou_mod_nor = n_hou_mod / (60.*60.*12.);
        
        float n_aa = (1./(iResolution.x+iResolution.y)/2.)*8.;
        float n_its = 3.;
        float n_it_nor_one = 1./n_its;
        
        vec4 o_col = vec4(0.);
        
        float n_tau = 6.2831;
        for(float n_it_nor = 0.; n_it_nor < 1.; n_it_nor+=n_it_nor_one){
            float n_it = floor(n_it_nor*n_its);
            float n_radius = 0.5-(n_it_nor*(.5));
            float n = length(o_trn);
            float n_ang_nor = 1.-fract((atan(o_trn.y, o_trn.x)/n_tau)+.75);
            float n_mod_nor = n_sec_mod_nor;
            if(n_it == 1.){
                n_mod_nor = n_min_mod_nor;
            }
            if(n_it == 2.){
                n_mod_nor = n_hou_mod_nor;
            }
            float n_s = smoothstep(
                n_mod_nor+n_aa*(1./n),
                n_mod_nor,
                n_ang_nor
            );
            n = (n-n_radius)/n_radius;
            n = 1.-abs(n);
            n = pow(n, 10.);
            n = clamp(n, 0., 1.);
            o_col += vec4(n_s*n);
    
        }
        
        fragColor = o_col;
        fragColor = vec4(o_trn.x);

    }`
)
document.body.appendChild(o_canvas);
window.addEventListener('resize', ()=>{
    // this will resize the canvas and also update 'o_scl_canvas'
    f_resize_canvas_from_o_webgl_program(
        o_webgl_program,
        window.innerWidth, 
        window.innerHeight
    )

    o_webgl_program?.o_ctx.uniform2f(o_state.o_ufloc__o_vec2_scale_canvas,
        window.innerWidth, 
        window.innerHeight
    );

    f_render_from_o_webgl_program(o_webgl_program);

});

let n_id_raf = 0;

o_state.o_ufloc__n_ts_ms_utc = o_webgl_program?.o_ctx.getUniformLocation(o_webgl_program?.o_shader__program, 'n_ts_ms_utc');
o_state.o_ufloc__o_vec2_scale_canvas = o_webgl_program?.o_ctx.getUniformLocation(o_webgl_program?.o_shader__program, 'o_vec2_scale_canvas');

let f_raf = function(){

    o_webgl_program?.o_ctx.uniform1f(o_state.o_ufloc__n_ts_ms_utc, new Date().getTime());

    f_render_from_o_webgl_program(o_webgl_program);

    n_id_raf = requestAnimationFrame(f_raf)

}
n_id_raf = requestAnimationFrame(f_raf)
