
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

import {
    f_s_hms__from_n_ts_ms_utc,
} from "https://deno.land/x/date_functions@1.4/mod.js"

let a_o_shader = await(await fetch('./f_a_o_shader')).json(); 
let n_idx_a_o_shader = parseInt(Math.random()*a_o_shader.length)
let o_state = {
    n_idx_a_o_shader,
    a_o_shader,
    o_shader: a_o_shader[n_idx_a_o_shader],
}

window.o_state = o_state
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
        align-items:flex-start;
    }
    canvas{
        width: 100%;
        height: 100%;
        position:fixed;
        z-index:-1;
    }
    #o_el_time{
        margin:1rem;
        background: rgba(0, 0, 0, 0.4);
        padding: 1rem;
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
document.body.appendChild(o_canvas);


let f_s_glsl_from_o_shader = function(
    o_shader
){

    let s_code = o_shader.Shader.renderpass[0].code;
    console.log(s_code)
    let n_idx1 = s_code.indexOf('//IMPORTANT START')
    let n_idx2 = s_code.indexOf('//IMPORTANT END', n_idx1);
    if(n_idx1 != -1 && n_idx2!=-1){
        return `
        // const vec4 iMouse = iMouse;
        // const float iTime = iDate.w;
        // const vec2 iResolution = iResolution;
        // const vec2 fragCoord = gl_FragCoord.xy;
        // const vec4 iDate = iDate;
        ${s_code.substring(0, n_idx1)}
        void main() {
        ${s_code.substring(n_idx2)}
        `
    }else{
        return 'shader could not be rewritten to fit into the app'
    }
}
let o_webgl_program = null;
let f_update_shader = function(){

    if(o_webgl_program){
        f_delete_o_webgl_program(o_webgl_program)
    }
    o_webgl_program = f_o_webgl_program(
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
        uniform vec4 iMouse;
        uniform float iTime;
        uniform vec2 iResolution;
        uniform vec4 iDate;
    
        ${o_state.o_shader.Shader.renderpass[0].code}
        
        void main() {
            vec2 fragCoord = gl_FragCoord.xy;
            mainImage(fragColor, fragCoord);  
        }
        `
    )
    o_state.o_ufloc__iResolution = o_webgl_program?.o_ctx.getUniformLocation(o_webgl_program?.o_shader__program, 'iResolution');
    o_state.o_ufloc__iDate = o_webgl_program?.o_ctx.getUniformLocation(o_webgl_program?.o_shader__program, 'iDate');
    o_state.o_ufloc__iMouse = o_webgl_program?.o_ctx.getUniformLocation(o_webgl_program?.o_shader__program, 'iMouse');
    o_state.o_ufloc__iTime = o_webgl_program?.o_ctx.getUniformLocation(o_webgl_program?.o_shader__program, 'iTime');

    f_resize()
}

// just for the demo 
// o_canvas.style.position = 'fixed';
// o_canvas.style.width = '100vw';
// o_canvas.style.height = '100vh';
let f_resize = function(){
    if(o_webgl_program){
        // this will resize the canvas and also update 'o_scl_canvas'
        f_resize_canvas_from_o_webgl_program(
            o_webgl_program,
            window.innerWidth, 
            window.innerHeight
        )
    
        o_webgl_program?.o_ctx.uniform2f(o_state.o_ufloc__iResolution,
            window.innerWidth, 
            window.innerHeight
        );
    
        f_render_from_o_webgl_program(o_webgl_program);
    }
}

window.addEventListener('resize', ()=>{
    f_resize();
});

let n_id_raf = 0;


let mouseX = 0;
let mouseY = 0;
let clickX = 0;
let clickY = 0;
let isMouseDown = false;

// Event listener for mouse move
o_canvas.addEventListener('mousemove', (event) => {
    mouseX = event.clientX;
    mouseY = event.clientY;
});

// Event listener for mouse down
o_canvas.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    clickX = event.clientX;
    clickY = event.clientY;
});

// Event listener for mouse up
o_canvas.addEventListener('mouseup', () => {
    isMouseDown = false;
});

let o_el_time = document.createElement('div');
o_el_time.id = 'o_el_time'
document.body.appendChild(o_el_time);

let n_ms_update_time_last = 0;
let n_ms_update_time_delta_max = 1000;
let f_raf = function(){

    if(o_webgl_program){
        let o_date = new Date();
        let n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value = (o_date.getTime()/1000.)%(60*60*24)
        // n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value = (60*60*24)-1 //test
        o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__iDate,
            o_date.getUTCFullYear(),
            o_date.getUTCMonth(), 
            o_date.getUTCDate(),
            n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value
        );
        o_webgl_program?.o_ctx.uniform4f(o_state.o_ufloc__i_mouse,
            isMouseDown ? mouseX : 0.0,
            isMouseDown ? mouseY : 0.0,
            clickX,
            clickY
        );
        o_webgl_program?.o_ctx.uniform1f( o_state.o_ufloc__iTime,
            n_sec_of_the_day_because_utc_timestamp_does_not_fit_into_f32_value
        );
       
        let s_time = `${f_s_hms__from_n_ts_ms_utc(o_date.getTime(), 'UTC')}.${((o_date.getTime()/1000)%1).toFixed(3).split('.').pop()}`
        o_el_time.innerText = `UTC: ${s_time}`
    
        let n_ms = window.performance.now()
        let n_ms_delta = Math.abs(n_ms_update_time_last - n_ms);
        if(n_ms_delta > n_ms_update_time_delta_max){
            document.title = `${s_time.split('.').shift()} Shader-Clock` 
            n_ms_update_time_last = n_ms;
        }
        f_render_from_o_webgl_program(o_webgl_program);
    }

    n_id_raf = requestAnimationFrame(f_raf)

}
n_id_raf = requestAnimationFrame(f_raf)


let n_id_timeout = 0;
window.onpointermove = function(){
    clearTimeout(n_id_timeout);
    o_el_time.style.display = 'block'
    n_id_timeout = setTimeout(()=>{
        o_el_time.style.display = 'none'
    },5000)
}
window.onpointerdown = function(){
    o_state.n_idx_a_o_shader = (o_state.n_idx_a_o_shader+1)% o_state.a_o_shader.length;
    o_state.o_shader = o_state.a_o_shader[o_state.n_idx_a_o_shader]
    f_update_shader();
}
f_update_shader()