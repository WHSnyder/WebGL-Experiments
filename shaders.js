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

uniform float clicktime;
uniform vec3 clickpos;

uniform float flag;


varying vec3 color;


void main(){

    float speed = 1.0;
    float dietime = 10.0;
    float timediff = timevar - clicktime;

    float wavedist = speed * timediff;


    vec3 vertposnormed = normalize(vertpos);
    float between = abs(acos(dot(vertposnormed, normalize(clickpos))));

    float vertdist = (between / M_PI) * 6.7 * 2.0;


    float mag = cos(vertdist - wavedist);//clamp((vertdist - wavedist), M_PI / -2.0, M_PI / 2.0)),0.0,1.0);

    if (wavedist > 15.0){
        mag = 0.0;
    }


    vec3 sined = vec3(cos(timevar/2.0), 0.0, sin(timevar/2.0));
    vec3 norm = normalize(normal);


    vec4 newvertpos = vec4(vertpos + 10.0 * mag * vertposnormed,1.0);//vec3(sin(vertpos.x), cos(vertpos.y), tan(vertpos.z)), 1.0);



    vec3 lcolor = vec3(abs(sin(timevar)), 0.0, abs(cos(timevar)));

    float dotprod = max(dot(sined, norm), 0.0);



    color = vertcolor * lcolor * dotprod;

    if (flag < 0.0){
        color = mag * vec3(1.0,1.0,1.0) + color;
    }



    gl_Position = frustmat * viewmat * newvertpos;
    gl_PointSize = 20.0;

}`;




var fs_shell = `

precision mediump float;


uniform vec2 mousepos;

varying vec3 color;


void main(){

    float dist = length(gl_FragCoord.xy - mousepos);
    vec4 addit = vec4(0.0,0.0,0.0,0.0);

    if (dist > 50.0 && dist < 150.0){
        addit = vec4(0.1,0.1,0.1,0.0);
    }

    gl_FragColor = vec4(color, 1.0) + addit;

}`;










