var vs_shell = `

#define M_PI 3.1415926535897932384626433832795

precision mediump float;

attribute vec3 vertpos;
attribute vec3 normal;
uniform vec3 vertcolor;


uniform vec3 lightcolor;
uniform vec3 lightdir;

uniform mat4 viewmat;
uniform mat4 frustmat;

uniform float timevar;

varying vec3 color;

void main(){

	vec3 sined = vec3(cos(timevar),0.0,sin(timevar));

	vec3 norm = normalize(normal);

	vec3 lcolor = lightcolor * .3;

	float dotprod = max(dot(sined, norm), 0.0);

	color = vec3(abs(sin(timevar)) * vertcolor.r, vertcolor.g, abs(cos(timevar)) * vertcolor.b) * lcolor * dotprod;

    gl_Position = frustmat * viewmat * vec4(vertpos + vec3(0.2 * sin(timevar + vertpos.x * vertpos.y)), 1.0);
    gl_PointSize = 20.0;

}`;


var fs_shell = `

precision mediump float;

varying vec3 color;


void main(){

    gl_FragColor = vec4(color, 1.0);

}`;



var vs_shadow = `

precision mediump float;

attribute vec3 position;

uniform mat4 lightView;
uniform mat4 lightProj;

void main(){

    gl_Position = lightProj * lightView * vec4(position, 1.0);
}`;


var fs_shadow = `

precision mediump float;

void main(){

    gl_FragColor = vec4(gl_FragCoord.z,0.0,0.0,1.0);
}`;



var vs_lit = `

precision mediump float;

attribute vec3 position;
attribute vec3 color;

uniform mat4 playerview;
uniform mat4 playerfrust;

uniform mat4 lightview;
uniform mat4 lightfrust;

uniform vec3 lightcolor;

varying vec4 posfromlight;
varying vec3 fragcolor;


void main(){

    fragcolor = lightcolor * color;
    gl_Position = vec4(position, 1.0);   
    posfromlight = lightfrust * lightview * vec4(position, 1.0); 
}`;



var fs_lit = `

precision mediump float;

uniform sampler2D shadowmap;

varying vec4 posfromlight;
varying vec3 fragcolor;

void main(){

    vec3 shadowcoord = vec3(posfromlight.xyz/posfromlight.w)/2.0 + 0.5; //cant grasp why the /2 + .5 but is prolly just unimportant tex map index thing..
    float depthtosun = texture2D(shadowmap, shadowcoord.xy);

    float vismult = (shadowcoord.z > depthtosun + 0.005) ? 0.7 : 1.0;
    gl_FragColor = vec4(fragcolor.rgb * vismult, 1.0);
}`;




function initShader(gl, shaderVar, shaderText){

    gl.shaderSource(shaderVar, shaderText);
    gl.compileShader(shaderVar);

    if (!gl.getShaderParameter(shaderVar, gl.COMPILE_STATUS)){
        console.error("shader compilation failed", gl.getShaderInfoLog(shaderVar));
        return -1;
    }
    return 0;
}



function generateProgram(gl, vs, fs){

	var vshader = gl.createShader(gl.VERTEX_SHADER);
    var fshader = gl.createShader(gl.FRAGMENT_SHADER);

    initShader(gl, vshader, vs);
    initShader(gl, fshader, fs);

    var prog = gl.createProgram();

    gl.attachShader(prog, vshader);
    gl.attachShader(prog, fshader);

    gl.linkProgram(prog);

    return prog;
}



var shader_lit_object = generateProgram(gl, vs_shell, fs_shell);
var shader_shadow_cast = generateProgram(gl, vs_shadow, fs_shadow);



function shadeLitObj(object, color, disp, light, shadowmap){

        	




}











var shaders = new Map();

















