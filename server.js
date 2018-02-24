var express = require('express');

var app = express();
var server = app.listen(process.env.PORT || 4000);

app.use(express.static('public'));


console.log("Socket server for MoBlit is running.");
// require and load dotenv
var dotenv = require('dotenv');
dotenv.config({path: __dirname + '/.env'});
var key = process.env.MY_API_KEY;


var socket = require('socket.io');

var io = socket(server);
var people = 0;
var stockIDs = [];

io.sockets.on('connection', newConnection);


function newConnection(socket){
  socket.emit('getkey', key);
  var newAnim = {animid: socket.id, posX: -1, posY: -1};
  stockIDs.push(newAnim);
  console.log('new connection:' + socket.id);
  people++;
  console.log(people + " people in the moblitz.");
  console.log(stockIDs);
  socket.emit('hello', people);
  socket.emit('yourID', socket.id);
  socket.emit('getOthersID', stockIDs);
  socket.broadcast.emit('sendMyID', socket.id);

  socket.on('newPeople', function(){
    console.log("new people data sent.");
    socket.broadcast.emit('addPeople', people);
  })

  socket.on('disconnect', newDisConnection);

  function newDisConnection(){
    //var indexIDout = stockIDs.indexOf(socket.id);
    var indexIDout = stockIDs.map(function(e) { return e.animid; }).indexOf(socket.id);
    stockIDs.splice(indexIDout, 1);
    console.log("disconnected:" + socket.id);
    people--;
    console.log('new disconnection');
    console.log(people + " people left in the moblitz.");
    socket.broadcast.emit('byebye', people);
    socket.broadcast.emit('spliceID', socket.id);
  }

  socket.on('sendPos', function(data){
    var indexIDto = stockIDs.map(function(e) { return e.animid; }).indexOf(data.name);
    stockIDs[indexIDto].posX = data.posX;
    stockIDs[indexIDto].posY = data.posY;
    var newData = stockIDs[indexIDto];
    socket.broadcast.emit('getPos', newData);
  });

  socket.on('sendChat', function(data){
    socket.broadcast.emit('broadcastChat', data);
  });

  socket.on('mouse', mouseMsg);

  function mouseMsg(data){
    socket.broadcast.emit('mouse', data);
    console.log('sending points');
  }

  socket.on('mouseReleased', mouseMsg);

  function mouseMsg(data){
    socket.broadcast.emit('mouseReleased', data);
    console.log('new path');
  }

  socket.on('IDhasReleased', function(idR){
    var indexIDto = stockIDs.map(function(e) { return e.animid; }).indexOf(idR);
    stockIDs[indexIDto].posX = -1;
    stockIDs[indexIDto].posY = -1;
    socket.broadcast.emit('thisIDreleased', idR);
  });

  socket.on('popDrawing', popDrawingAbroad);

  function popDrawingAbroad(){
    socket.broadcast.emit('popDrawingAbroad');
    console.log('safety pop drawing detected.');
  }

  socket.on('saved', reloadOthers);

  function reloadOthers(data){
    socket.broadcast.emit('saved', data);
    console.log('saved');
  }

  socket.on('cleared', clearThere);

  function clearThere(){
    socket.broadcast.emit('cleared');
    console.log('cleared');
  }

  socket.on('ready', weAreReady);

  function weAreReady(data){
    socket.broadcast.emit('ready', data);
    console.log('ready');
  }

  socket.on('pushReadyData', function(data){
    socket.broadcast.emit('sentReadyData', data);
  })

  socket.on('undo', abroadUndo);

  function abroadUndo(){
    socket.broadcast.emit('undo');
    console.log('undo');
  }

  socket.on('guide', sendGuide);

  function sendGuide(data){
    socket.broadcast.emit('guide', data);
    console.log('guide send');
  }
}
