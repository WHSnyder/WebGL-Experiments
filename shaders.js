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

	color = vertcolor * lcolor * dotprod;

    gl_Position = frustmat * viewmat * vec4(vertpos + vec3(0.2 * sin(timevar + vertpos.x * vertpos.y)), 1.0);
    gl_PointSize = 20.0;

}`;




var fs_shell = `

precision mediump float;

varying vec3 color;

void main(){

    gl_FragColor = vec4(color, 1.0);

}`;










