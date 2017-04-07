'use strict';
//Because

var canvas = document.getElementById('canvas');
var context = canvas.getContext("2d");

//Brown - '#df4b26'
var curColor = '#FF0000';
var curTool = "pen";// pen, eraser, pan, text
/*
Possible tools:
Pen - draw to the screen
Eraser - Pen but always white
Pan - For non-touch screen users to navigate. Probably won't be implemented, they can move around in other ways.
Text - For drawing Text to the canvas.
Not yet implemented, but planned:
Image - For putting a picture on the canvas
*/
var curSize = 2;
var Drawers = {
    me: new Array()//Comes included
};
//~~Josh~~ Duplicate array which stores
//  1. Text X
//  2. Text Y
//  3. Text String
//If I add text input compatibility I will use this
var Texters = {
    me: new Array()
};
/*
Structure:

Drawers contains references to all those who draw
Texters contains those who text
Each person contains the objects they have created.
People who draw have paths
People who make text have text objects
(Note: one person can be part of both groups)
paths contain points, points have a location, size, and color
Text objects contain a point, text, and size.
*/

// Camera - Tells Location and Scale to look at canvas
var camera = {
    x:0,
    y:0,
    scale:1
};

// ~~~~~ Icon selection ~~~~~

// I used to hate jquery. Why would people use this?
// But now my eyes have been opened to the glory of jquery.
// ...
// I love you, jquery.

// Add event listeners to the main menu
// Each menu item opens/closes its associated tray.
$('.tray_trigger').on('click',function(){
    //Which tray should we toggle?
    var trayname = $(this).data('tray');
    //Toggle desired Tray, Lower all other trays.
    $('.tray').each(function(){
        if($(this).data('type')==trayname){
            //Turn this tray on, or off if it's already selected.
            $(this).toggleClass('tray_active');
        }else{
            //make sure this tray is off.
            $(this).removeClass('tray_active');
        }
    });
});

//Add event listeners to Tray objects.
//Objects either perform an action or change the behavior of drawing.
$('.tray_object').on('click',function(){
    //Get the type of item clicked and the value it contains.
    var value = $(this).data('value');
    var type = $(this).parent().data('type');
    //Detect tray closings
    if(value=='tray_close'){
        $(this).parent().removeClass('tray_active');
        return;
    }
    if(type=='color'){
        curColor = value;
        curTool = "pen";
    }else if(type=='size'){
        curSize = value;
        curTool = "pen";
    }else if(type == 'options'){
        if(value == 'Save'){
            saveAsPNG();
        }
        if(value == 'Text'){
            //~~Josh~~ All this does right now is prevent drawing
            // Ethan - we'll implement the actual behavior on click, this line is all that needs to be here.
            curTool = "text";
        }
    }else{
        console.log('Something went wrong - Tray Object clicked with no type');
    }
});

// ~~~~~ Functions - utility, drawing, math stuff. ~~~~~

//Erase everything, re-draw everything.
function redraw(){
    draw(false);
}
//Draw any points that haven't been drawn yet.
function update(){
    draw(true);
}
//Draw the Drawings to the screen - Draw Every point, or just the ones that haven't been drawn yet, depending on args.
//@args (boolean) partial - Draw everything, or just what needs to be drawn?
function draw(partial){
    //Depending on args, clear the screen.
    if(!partial)context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    //we need to remember the location and scale for later. I don't remember why.
    context.save();
    //Set the Translation and Scale
    context.translate(-camera.x,camera.y);
    context.scale(camera.scale,camera.scale);

    //*//Debug Switch
    //<debug>
    /*/
        //Draw a Cyan rectangle at 100,100 canvas space
        context.strokeStyle = '#00FFFF';
        var debugCanvasPoint = CanvasToWorld({x:100,y:100});
        context.strokeRect(debugCanvasPoint.x,debugCanvasPoint.y,100/camera.scale,100/camera.scale);
        //Draw a Purple rectangle at 100,100 world space.
        context.strokeStyle = '#FF00FF';
        context.strokeRect(100,100,100,100);/*
    </debug>    */

    //Loop through all the drawers
    for(var drawerk in Drawers){
        //Loop through all the paths of this particular drawer
        for(var pathk in Drawers[drawerk]){
            var path = Drawers[drawerk][pathk];
            if(path.points.length==0){
                //This path doesn't have any points in it yet. Move on to the next path.
                continue;
            }
            if(!partial || path.drawn < path.points.length-1){//If everything, Draw. If partial, Only draw if needed.
                //Start a new Path.
                context.beginPath();
                //Set the color
                context.strokeStyle = path.color;
                //Set the size
                context.lineWidth = path.size;
                //Default Settings
                context.lineCap = 'round';
                //determine the starting point
                //I don't really know how this next bit works.
                var i = partial?path.drawn:0;
                //Move to the Starting Point.
                var j = i==0? 0:i-1;
                context.moveTo(path.points[j].x,path.points[j].y);
                for(i;i<path.points.length;i++){//Draw a Line to Each Point. TODO don't line to the first point.
                    context.lineTo(path.points[i].x,path.points[i].y);
                }
                //Update the drawn variable to reflect that all points have been drawn.
                path.drawn = path.points.length;
                //Draw the Path to the screen.
                context.stroke();
            }
        }
    }
    //Reset to Normal Translation and Scale
    context.restore();
}

//Confine the camera to a limited scale, when we zoom too far in or out the universe starts to break down.
var checkScale = function(){
    if(camera.scale>3760)camera.scale=3760;
    if(camera.scale<2.342e-36)camera.scale=2.342e-36;
}

//Make a new path
var makeNewPath = function(){
    return {
        color: curColor,
        size: curSize/camera.scale,//TODO consider
        points: new Array(),
        drawn:0//Used for the Update Function Optimization
    };
}

//Save the current view as a PNG file
var saveAsPNG = function(){
    //Depends on canvas-toBlob.js and FileSaver.js
    canvas.toBlob(function(blob) {
        saveAs(blob, "output.png");
    }, "image/png");
}

/*
Spaces:
Page space - A point relative to the screen
Canvas space - A point relative to the Canvas

Note - Canvas and Page are the same, as long as the canvas covers the entire screen.

World space - A point relative to the world displayed on the canvas. World space scales and moves so the canvas sees different parts.
*/

//Convert Page space to World space.
//@args point{x,y} in page space - pageX, pageY
var pageToWorld = function(point){//converts Page X, Y to World X, Y
    return CanvasToWorld(pageToCanvas(point));
}
//Convert Page space to Canvas space.
//@args point{x,y} in page space - pageX, pageY
var pageToCanvas = function(point){//converts Page X, Y to canvas~ish X, Y
    var offset = $('#canvas').offset();
    var x = point.x-offset.left;
    var y = point.y-offset.top;
    return {
        x:x,
        y:y
    };
}
//Convert Canvas space to World space
//ALWAYS CLONE YOUR ARGUMENTS. ***.
var CanvasToWorld = function(pointeh){
    //Clone the object because *** Javascript.
    var point = clone(pointeh);
    point.x+=camera.x;
    point.y-=camera.y;
    point.x/=camera.scale;
    point.y/=camera.scale;
    return point;
}
//Convert World space to Canvas space
var WorldToCanvas = function(pointeh){//Scale out of world, un-apply offset.
    var point = clone(pointeh);//See above. This really *** pisses me off.
    point.x*=camera.scale;
    point.y*=camera.scale;
    point.x-=camera.x;
    point.y+=camera.y;
    return point;
}

//Recursive Object Cloning Method from Stack Overflow
//TODO - hide that we got this from Stack Overflow.
var clone = function(obj){
    var copy;
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;
    copy = {};
    for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
    }
    return copy;
}

// ~~~~~ Two-Finger Guestures - Pan and Scale ~~~~~
 //The current guesture. {camera, point1, point2, average, distance}
var guesture = {};
//Called when a guesture is started.
//@args point1{x,y}, point2{x,y} - points in canvas space.
var guestureStart = function(point1, point2, first){
    //Two fingers don't happen at the same time. Delete the temporary path the first finger started.
    if(first){//Don't start deleting stuff if this is the second onwards guesture.
        Drawers.me.pop();
        socket.emit('delPath');
    }
    //Guestures are about comparing the finger positions to where they started.
    //As such, we need to record their initial positions And the Camera initials, which the guestures will be changing.
    guesture.camera = clone(camera);
    guesture.point1 = point1;
    guesture.point2 = point2;
    guesture.average = {
        x:(point1.x+point2.x)/2,
        y:(point1.y+point2.y)/2
    };
    guesture.averageWorld = CanvasToWorld(guesture.average);
    guesture.distance = Math.sqrt((point2.x-point1.x)*(point2.x-point1.x)+(point2.y-point1.y)*(point2.y-point1.y));
}
//Called when two or more fingers are dragged on a touch screen.
//I'm actually rather proud of this function right here.
//@args, Points in Canvas Space
var guestureDrag = function(point1, point2){
    //Get the average Position
    var averageX = (point1.x+point2.x)/2;
    var averageY = (point1.y+point2.y)/2;
    //Get the Distance
    var distance = Math.sqrt((point2.x-point1.x)*(point2.x-point1.x)+(point2.y-point1.y)*(point2.y-point1.y));
    //Compare Average positions, set new offset.
    // camera.x = guesture.camera.x-(averageX-guesture.average.x);
    // camera.y = guesture.camera.y+(averageY-guesture.average.y);

    //Set scale
    camera.scale = guesture.camera.scale * (distance/guesture.distance);
    checkScale();

    //reset offsets
    camera.x = guesture.camera.x;
    camera.y = guesture.camera.y;

    var whereWeAre = WorldToCanvas(guesture.averageWorld);
    var whereWeNeedToBe = {x:averageX,y:averageY};

    camera.x -= whereWeNeedToBe.x - whereWeAre.x;
    camera.y += whereWeNeedToBe.y - whereWeAre.y;

    //Changing the offset and/or scale affects things that are already drawn, so we have to redraw everything.
    redraw();
}
var guestureStop = function(){
    //TODO - what needs to be done here? I don't think anything. hmm.
}
// ~~~~~ Event Handlers, Called by Listeners ~~~~~
// Start Using a Tool at a point in Transformed Canvas Space.
var handleStart = function(point){
    if(curTool == 'pen'){
        //Start a New Path.
        var newPath = makeNewPath();
        //Add the current point to the Path.
        newPath.points.push(point);
        //Add the Path to the Drawer (me)
        Drawers.me.push(newPath);
        socket.emit('newPath',{color:newPath.color,size:newPath.size});
        socket.emit('draw',point);
    }else if(curTool == 'eraser'){
        //Start a New Path.
        var newPath = makeNewPath();
        //This is the eraser, so set the color to white
        newPath.color = '#FFFFFF';
        //Add the current point to the Path.
        newPath.points.push(point);
        //Add the Path to the Drawer (me)
        Drawers.me.push(newPath);
        socket.emit('newPath',{color:newPath.color,size:newPath.size});
        socket.emit('draw',point);
    }else if(curTool == pan){
        console.log('The PAN tool is not yet supported.');//TODO
    }else if(curTool == "text"){
        //TODO What do we do here
    }//else spooky witchcraft.
    update();
}
//Adds points to the current path.
//@args point{x,y} transformed canvas space
var handleDrag = function(point){
    if(curTool == 'pen' || curTool == 'eraser'){//The difference between pen and eraser (color) is established at path start.
        var curPath = Drawers.me[Drawers.me.length-1];
        curPath.points.push(point);
        socket.emit('draw',point);
    }else if(curTool == pan){
        //TODO
    }//else spooky witchcraft.
    update();
}
var handleStop = function(){
    /*/There's really not much to do here.
    if(curTool == 'pen'){
    }else if(curTool == 'eraser'){
    }else if(curTool == pan){
    }//else spooky witchcraft.//*/
}
// ~~~~~ Event Listeners ~~~~~
// ~~~ Touch Screens ~~~
var guesturing = false;
var fingersOnScreen = 0;
canvas.addEventListener("touchstart",function(e){
    if(e.touches.length == 1){
        //There is one finger on the screen.
        fingersOnScreen = 1;
        //If it's not because of a guesture, then it's because of a drag - share it.
        if(!guesturing)handleStart(pageToWorld({x:e.touches[0].pageX,y:e.touches[0].pageY}));
    }else if(e.touches.length == 2){
        //There are two fingers on the screen.
        if(fingersOnScreen==0){//If we're on a god damn iPhone and the first finger didn't register, don't delete the most recent path.
            guesturing = true;
        }
        fingersOnScreen = 2;
        //Tell guestureStart if this is the first guesture in this touch action, so it can compensate if not.
        guestureStart(pageToCanvas({x:e.touches[0].pageX,y:e.touches[0].pageY}),pageToCanvas({x:e.touches[1].pageX,y:e.touches[1].pageY}),!guesturing);
        guesturing = true;
    }//else - More than two fingers. Ignore, we don't care about them.
});
canvas.addEventListener('touchmove',function(e){
    //Browsers want to go back a page on a swipe. We don't want that.
    e.preventDefault();
    if(e.touches.length == 1){
        //There is one finger - Make sure we aren't on the tail end of a guesture, then proceed.
        if(!guesturing)handleDrag(pageToWorld({x:e.touches[0].pageX,y:e.touches[0].pageY}));
    }else{
        //there is more than one finger
        guestureDrag(pageToCanvas({x:e.touches[0].pageX,y:e.touches[0].pageY}),pageToCanvas({x:e.touches[1].pageX,y:e.touches[1].pageY}));
    }
});
canvas.addEventListener('touchend',function(e){
    fingersOnScreen = e.touches.length;
    if(e.touches.length == 0){
        guesturing = false;//Reset the Guesturing Flag.
        //The last finger has been removed
        //Did we end a draw or a guesture?
        //Guesture end would have been caught before now
        //It's probably a Draw End.
        //If not, just make sure the handleStop doesn't add Empty paths to the drawer.
        //handleStop(pageToWorld({x:e.touches[0].pageX,y:e.touches[0].pageY}));//TODO Make sure this is Okay if we ended a guesture, not a Drawing.
        //Note - There are no cords for a finger thats no longer there
    }else if(e.touches.length == 1){
        //One finger has been removed, There is still a finger remaining.
        //guestureStop(pageToWorld({x:e.touches[0].pageX,y:e.touches[0].pageY}));
    }//else there were three or more fingers on the screen. We don't care about any more than two.
});
//It looks like this is never fired.
canvas.addEventListener('touchcancel',function(e){
    console.log('cancel');//Just going to leave this like this for now. Not much we can do with this.
});

//~~Josh~~ This will allow the S key to save the camera as an image
//I should also consider making this CTRL + S
document.onkeypress = function(evt) {
    evt = evt || window.event;
    var charCode = evt.keyCode || evt.which;
    var charStr = String.fromCharCode(charCode);
    if(charStr == 's'){
        saveAsPNG();
    }
};

// ~~~ Mouse ~~~ DONE TODO - mouse zoom in out on scroll, mouse pan?

var mouseDown=0;
$('#canvas').mousedown(function(e){
    e.preventDefault();
    mouseDown++;//Don't delete things when you're tired.
    handleStart(pageToWorld({x:e.pageX,y:e.pageY}));
});
$('#canvas').mousemove(function(e){
    if(mouseDown){
        handleDrag(pageToWorld({x:e.pageX,y:e.pageY}));
    }
});
$('#canvas').mouseup(function(e){
    if(mouseDown)mouseDown--;
    //handleStop(pageToWorld({x:e.touches[0].pageX,y:e.touches[0].pageY}));
});
$('#canvas').mouseleave(function(e){
    if(mouseDown)mouseDown--;
    //handleStop(pageToWorld({x:e.touches[0].pageX,y:e.touches[0].pageY}));
});

// ~~~~~ Establish Network and Define Reactions to Events ~~~~~
//HEY SERVER! Here I am :)
var socket = io.connect()
//Server said hi!
socket.on('connect',function(){
    console.log('Connected! ID is'+socket.io.engine.id);
});

//Someone made a new path.
//@args color and size and sender
socket.on('newPath',function(data){
    //Do we have a record of this sender?
    if(!Drawers[data.sender]){
        //If not, create a slot for them.
        Drawers[data.sender] = new Array();
    }
    //Create a new Path for the sender
    Drawers[data.sender].push({
        color: data.color,
        size: data.size,
        points: new Array(),
        drawn: 0
    });
});
//Someone did some drawing
//@args X and Y and Sender
socket.on('draw',function(data){
    //Add a point to the user's current path
    if(!Drawers[data.sender]){
        console.log('Got Points for a Sender I don\'t Know!');
        //Discarding these points is probably the best option - you miss out on one line at most.
        //Alternative - Save them somewhere, ask the server for the path data.
        //When the server responds, Push the points.
        //The problem with that is that it will require the server to save every user's most recent path data.
        return;
    }
    //This line of code here. mmmmmm.
    Drawers[data.sender][Drawers[data.sender].length-1].points.push({x:data.x,y:data.y});
    update();
});
//Someone wants to remove their most recent path. Probably because two finger zoom creates and deletes a path every time.
//@args Sender
socket.on('delPath',function(data){
    //Remove the user's most recent path.
    Drawers[data.sender].pop();
    redraw();
});
//Sometimes it's useful to just erase everyones screen. This isn't exposed to the public, however
//Anyone with JS knowledge can trigger it.
socket.on('nuke',function(){
    Drawers = {};
    Drawers.me = new Array();
    //TODO reset Texters and/or Objectors etc.
    redraw();
});

//use socket.emit to send data to the server

//TODO - should this come before we connect to the server?
// ~~~~~ Page Setup ~~~~~
var resizeCanvas = function(){
    $('#canvas')[0].width = window.innerWidth;//-96;
    $('#canvas')[0].height = window.innerHeight;
    console.log('resized');
};
window.onresize = function(){
    resizeCanvas();
    redraw();
};

window.onload = function(){
    //Draw all those circles in the size tray.
    $('#tray_size').children().each(function(){
        $(this)[0].width = 64;
        $(this)[0].height = 64;
        var ctx = $(this)[0].getContext("2d");
        ctx.arc(32,32,$(this).data('value'),0,2*Math.PI)
        ctx.fill();
    });
    resizeCanvas();
    redraw();
    //Draw option text in the options tray.
    $('#tray_options').children().each(function(){
        $(this)[0].width = 64;
        $(this)[0].height = 64;
        var ctx = $(this)[0].getContext("2d");
        ctx.font = "20px Arial";
        ctx.fillText($(this).data('value'),0,20);
    });
    resizeCanvas();
    redraw();
};
