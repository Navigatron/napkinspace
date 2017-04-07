var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

// Allow clients to grab static css and js
app.use(express.static('public'));
// Send client html.
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client.html')
})

//Setup Server Behavior
io.sockets.on('connection', function(socket){
  console.log('CNCT:'+socket.id);
  //When the client disconnects
  socket.on('disconnect', function(){
      console.log('DSCT:'+socket.id);
  });
  //New Path
  socket.on('newPath', function(data){
      console.log('NPTH:'+socket.id);
      data.sender = socket.id;
      socket.broadcast.emit('newPath',data);
  });
  //New points for a path
  socket.on('draw', function(data){
      console.log('DRAW:'+socket.id);
      data.sender = socket.id;
      socket.broadcast.emit('draw',data);
  });
  //Delete a Path
  socket.on('delPath', function(){
      console.log('DPTH:'+socket.id);
      socket.broadcast.emit('delPath',{sender:socket.id});
  });
  socket.on('nuke', function(){
      console.log('NUKE:'+socket.id);
      socket.broadcast.emit('nuke');
  });
});

//Make it live
var port = (typeof process.env.PORT == 'undefined')?8080:process.env.PORT;
http.listen(port, function(){
  console.log('listening on port '+port);
});
