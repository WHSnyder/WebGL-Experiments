var current_time = 0;






var dir = 0;

var n = 0;

var currTime, timePassed;

var clicktime = 0;
var clickpos = vec3.fromValues(0.0,0.0,6.7);


var mouseInitialized = false;
var deltamX = 0, delatmY = 0;
var mouseRead = false;






function mouseHandler(e){

    mouseRead = false;

    if (!mouseInitialized){
        deltamX = 0;
        deltamY = 0;
        mouseInitialized = true;
    }
    else {
        deltamX = e.pageX - mouseX;
        deltamY = e.pageY - mouseY;
    }

    mouseX = e.pageX;
    mouseY = e.pageY;
}





var keyMap = new Map();

keyMap.set(87, false);//forward
keyMap.set(65, false);//left
keyMap.set(68, false);//right
keyMap.set(83, false);//backward
keyMap.set(71, false);//go
keyMap.set(84, false);//terminate

function keydown(event) {
    
    if (event.keyCode == 71 && !keyMap.get(71)){
        cont = 1;
        console.log("pressed g...");

        //window.requestAnimationFrame(updateWorld);
    }
    else if (event.keyCode == 84){
        cont = 0;
        keyMap.set(71, false);
    }
    else if (event.keyCode == 87){
        //updatefps = 1;
    }
    keyMap.set(event.keyCode, true);
}


function keyup(event) {

    if (event.keyCode != 71){
        keyMap.set(event.keyCode, false);
    }
}


window.addEventListener("keydown", keydown, false);
window.addEventListener("keyup", keyup, false);
window.addEventListener("mousemove", mouseHandler, false);
//window.addEventListener("click", updateClick, false);