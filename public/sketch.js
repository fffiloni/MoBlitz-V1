var database;
var socket;
var playing = false;
var waitDB = false;
var nframe;
var tm;
var peopleIn = 0;
var yourID;
var peopleReady = 0;

var drawing = [];
var colorChoice;
var sliderR, sliderV, sliderB;
var csR = 255;
var csB = 255;
var csR = 255;

var setR = 255;
var setV = 255;
var setB = 255;
var paletteHandle = [];
var palette = [];
var socketToSave = [];
var predrawing = [];
var guidePath = [];
var currentPath = [];
var ableToDraw = true;
var ableToSend = true;
var isDrawing = false;
var socketDrawings = [];
var othersIDs = [];
var strangerIsDrawing = {posX: -1, posY: -1};

var storeKeys = [];
var timelinePos = 0;
var posKey;
var onionPos;
var onionKey;
var dataReady = [];
var keyToUpdate;

var optionPressed = false;
var deleteAble = false;

function preload(){
  console.log("WELCOME ON MOBLITZ!");
  var wlcm = createP('Welcome On MoBlitz!');
  wlcm.parent('console');

  console.log("This is an alpha version. Please be gentle.");
  console.log("This sketch will only fire essential logs in the console. For a more verbose one, please replace your sketch with the 'sketchVerbose' one.");

  socket = io.connect('http://localhost:4000');//https://moblitz.herokuapp.com/
	// Initialize Firebase
	socket.on('getkey', function(data){
    var key = data;
  })

  var config = {
    apiKey: key,
    authDomain: "",
    databaseURL: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: ""
  };
  firebase.initializeApp(config);
	database = firebase.database();

	var ref = database.ref('drawings');
	ref.on('value', gotData, errData);

}

function setup() {

  //socket.on('mouse', strangerDrawing);
  socket.on('mouseReleased', newDrawing);
  socket.on('saved', clearOthers);
  socket.on('cleared', clearBroadPath);
  socket.on('ready', frameReady);
  socket.on('sentReadyData', saveReadyData);
  socket.on('undo', abroadUndo);
  socket.on('guide', sendGuide);
  socket.on('popDrawingAbroad', popDrawingAbroad);
  socket.on('hello', function(data){
    peopleIn = data;
    socket.emit('newPeople');
    console.log("helllloooooo. There is " + data + " people in the room." + peopleIn);
    var msg = createP("helllloooooo. There is " + data + " people in the room.");
    msg.parent('console');
    updateScroll();
    if (peopleIn === 1){
      var msg2 = createP("You know what? You are the only animator connected. Great, you don't have to wait for others to go forward! Enjoy!");
      msg2.parent('console');
      updateScroll();
    } else {
      var msg3 = createP("You are NOT alone. So you'll have to wait for everybody before being able to draw on the next frame.");
      msg3.parent('console');
      updateScroll();
    }
  })
  socket.on('yourID', function(data){
    yourID = data;
    //socket.emit('newPeople');
    console.log("Your ID is " + yourID);
  })
  socket.on('addPeople', function(data){
    console.log("Another people joined the room. You are " + data + " in the room.");
    var msg = createP("Another people joined the room. You are " + data + " in the room.");
    msg.parent('console');
    updateScroll();
    peopleIn = data;
    if (peopleIn === 2){
      var msg2 = createP("You are NOT alone anymore. So you'll have to wait for everybody before being able to draw on the next frame. That's part of the game!");
      msg2.parent('console');
      updateScroll();
    }

  })
  socket.on('byebye', function(data){
    peopleIn = data;
    console.log("Quelqu'un s'en va, nous ne sommes plus que " + peopleIn + " | " + data + " on server.")
    var msg = createP("Quelqu'un s'en va, nous ne sommes plus que " + peopleIn + " | " + data + " on server.");
    msg.parent('console');
    updateScroll();
    if (peopleIn === 1){
      var msg2 = createP("You're alone! Great, now you can go forward without waiting for others to be ready. Just hit 'Save & Next' button when you're ready to go forward.");
      msg2.parent('console');
      updateScroll();
    }
  })
  socket.on('spliceID', function(data){
    var indexIDout = othersIDs.map(function(e) { return e.animid; }).indexOf(data);
    othersIDs.splice(indexIDout, 1);
  })
  socket.on('getOthersID', function(data){
    othersIDs = data;
    console.log(othersIDs);
  })
  socket.on('sendMyID', function(data){
    var addAnID = {animid: data, posX: 0, posY: 0};
    othersIDs.push(addAnID);
    console.log(othersIDs);
  })
  socket.on('getPos', function(data){
    var indexIDto = othersIDs.map(function(e) { return e.animid; }).indexOf(data.animid);
    othersIDs[indexIDto].posX = data.posX;
    othersIDs[indexIDto].posY = data.posY;
    //strangerIsDrawing = data;
  })
  socket.on('thisIDreleased', function(idR){
    var indexIDto = othersIDs.map(function(e) { return e.animid; }).indexOf(idR);
    othersIDs[indexIDto].posX = 0;
    othersIDs[indexIDto].posY = 0;
  })
  socket.on('broadcastChat', function(data){
    var chatmsg = createP(data.name + ": " + data.msg);
    chatmsg.parent('chat');
    updateScroll();
  })



	canvas = createCanvas(720, 405);
  console.log(screen.width);
  console.log(screen.height);
	canvas.parent('canvascontainer');

  canvas.mousePressed(startPath);
	canvas.mouseReleased(function(){
    if(currentPath.length === 0){
      console.log("OUPS | SLOW DOWN JOLLY JUMPER!");
      ableToDraw = false;
      endPath();
      drawing.pop();

      socket.emit('popDrawing');
      //setTimeout(function(){
      ableToDraw = true;
      //}, 2000);
    }

    else if (currentPath.length === 1){
      console.log("OUPS | SLOW DOWN JOLLY JUMPER!");
      ableToDraw = false;
      var safetyPoint = currentPath[0];
      currentPath.push(safetyPoint);
      endPath();
      drawing.pop();
      socket.emit('popDrawing');
      //setTimeout(function(){
      ableToDraw = true;
      //}, 2000);
    } else {
      endPath();
    }

  });



  //frameRate(60);

  //Colors RGB/RVB i used V for G because french
  colorChoice = createElement('div');
  colorChoice.style('width', '40px');
  colorChoice.style('height', '10px');
  colorChoice.style('margin-right', '10px');
  colorChoice.style('display', 'inline-block');
  colorChoice.style('border-radius', '20px');

  sliderR = createSlider(0, 255, 255);
  sliderV = createSlider(0, 255, 255);
  sliderB = createSlider(0, 255, 255);

  sliderR.style('width', '50px');
  sliderV.style('width', '50px');
  sliderB.style('width', '50px');
  colorChoice.parent('colors');
  sliderR.parent('colors');
  sliderV.parent('colors');
  sliderB.parent('colors');

  sliderR.mousePressed(function(){
    setR = null;
    setV = null;
    setB = null;

  });

  sliderV.mousePressed(function(){
    setR = null;
    setV = null;
    setB = null;

  });
  sliderB.mousePressed(function(){
    setR = null;
    setV = null;
    setB = null;

  });

	// var saveButton = select('#saveButton');
	// saveButton.mousePressed(saveDrawing);
	var clearButton = select('#clearButton');
	clearButton.mousePressed(clearDrawing);

  background(0);


}

function updateScroll(){
    var element = document.getElementById("console");
    element.scrollTop = element.scrollHeight;
}
//setInterval(updateScroll,1000);

//Socket Functions Part
function popDrawingAbroad(){
  socketDrawings.pop();
}

// function strangerDrawing(data){
//   strangerIsDrawing.push(data);
//   //console.log(strangerIsDrawing);
// }

function newDrawing(data){
  console.log("Socket function 'newDrawing' fired.");
  console.log("We've got data from socket. (currentPath data).");
  console.log(data);
  strangerIsDrawing = {posX: -1, posY: -1};
  socketDrawings.push(data);
  //dataReady.push(data);
  //console.log(dataReady);
}

function areYouReady(){

  if (ableToSend){
    $( ".controlBtns" ).addClass( "hide" );
    $( ".waitingText" ).removeClass( "hide" );
    ableToDraw = false;
    console.log("You said you're ready, so you can't draw until next fresh frame.");
    var name = document.getElementById('animatorName').value;
    if (name === ""){name = yourID;}
    var you = createElement('p', 'You are ready for the next frame.');
    you.parent('console');
    updateScroll();
    clearOnion();
    console.log("We will now emit 'ready' on Socket.");
    peopleReady++;

    if(peopleReady !== peopleIn){
      if(ableToSend){
        socket.emit('ready', name);
        if (drawing.length !== 0){
          socket.emit('pushReadyData', drawing);
        }
        ableToSend = false;
      }

    } else if (peopleReady === peopleIn && ableToSend) {
      saveDrawing();
      var clearReady = document.getElementById('peopleReady');
      clearReady.innerHTML = "";
      $( ".controlBtns" ).removeClass( "hide" );
      $( ".waitingText" ).addClass( "hide" );
      ableToDraw = true;
      peopleReady = 0;
      clearDrawing();
    }
  }

}

function frameReady(data){
  var people = createElement('p', data + ' est OK pour image suivante');
  people.parent('console');
  peopleReady++;
  console.log(peopleReady);
  console.log(peopleIn);


  // if(peopleReady === (peopleIn - 1)){
  //   console.log("Tout le monde est prêt. On attend que le chef sauvegarde.");
  // }

}
function saveReadyData(data){
  console.log(data);
  var received = data;
  for (var i = 0; i < received.length; i++){
    dataReady.push(received[i]);
  }

}

function clearOthers(data){
  console.log("We fired a Socket function 'clearOthers'.");
  waitDB = true;
  dataReady = [];
  socketDrawings = [];
	drawing = [];
  storeKeys[0].push(data);

	storeKeys.splice(1, 1);
  console.log(storeKeys);
	timelinePos = storeKeys[0].length - 1;
  //onionKey = storeKeys[0].length - 2;
  var clearReady = document.getElementById('peopleReady');
  clearReady.innerHTML = "";
  $( ".controlBtns" ).removeClass( "hide" );
  $( ".waitingText" ).addClass( "hide" );

  waitDB = false;
  clearDrawing();

  ableToDraw = true;
  peopleReady = 0;
  ableToSend = true;

  var msg = createP('Frame has been saved ! Back on track for the next one !');
  msg.parent('console');
  updateScroll();
}

function clearBroadPath(){
  console.log("We fired a Socket function 'clearBroadPath'.");

  socketDrawings = [];
  //dataReady = [];
}

//Main Drawing On Canvas Part
function startPath(){
  if (ableToDraw){
    //console.log("——");
    //console.log("You started a new path!");
    isDrawing = true;
  	currentPath = [];
  	drawing.push(currentPath);
    //console.log("A new array of points is pushed in 'drawing'");
    //console.log(currentPath);
  }
}

function endPath(){

    //console.log("You released the pen, and ended this path!");
    //console.log("There is " + drawing.length + " paths in 'drawing' now.");

    if (ableToDraw){
      console.log("We will now send 'currentPath' to Socket.");
      socket.emit('mouseReleased', currentPath);
      socket.emit('IDhasReleased', yourID);
    }
  	isDrawing = false;

}

function storeColor(){
  //palette = [];
  var color1 = {red: csR, green: csV, blue: csB}
  palette.push(color1);
  //console.log(palette);
  console.log("The color has been added to the Palette.");
  getColor();
}

function getColor(){
  paletteHandle = [];
  paletteHandle = palette;
  //console.log(paletteHandle);
  var elts = selectAll('.pltcolor');
	for (var i=0; i < elts.length; i++){
		elts[i].remove();
	}
  paletteHandle.forEach(function(couleur){
    //console.log(couleur);

    var span = createElement('span');
		var plt = createA('#', '');
		plt.class('pltcolor');

    // ahref.mouseOver(showAnim);
    plt.mousePressed(function(){
      //console.log(couleur);
      setR = couleur.red;
      setV = couleur.green;
      setB = couleur.blue;
      //console.log(setR, setV, setB);
    });

		span.parent(plt);

		plt.parent('colors');
    plt.class("pltcolor");
    plt.style("background", "rgb(" + couleur.red + "," + couleur.green + "," + couleur.blue + ")");

  });
}

function draw() {

  background(0);
  //grid super heavy, not optimised here
  // for(gridy = 0; gridy < canvas.height; gridy += 20){
  //   for (i = 0; i < canvas.width; i +=20){
  //     //if (i != canvas.width){
  //       stroke(40);
  //       ellipse(i, gridy, 1, 1);
  //     //}
  //   }
  // }
  othersIDs.forEach(function(e){
    stroke(255,0,0);
    ellipse(e.posX, e.posY, 1, 1);
    stroke(150);
    textSize(10);
    textStyle(NORMAL);
    strokeWeight(1);
    text('' + e.animid + '', e.posX + 5, e.posY - 5);
  });

  //console.log(strangerIsDrawing.posX);

  //safetyborder
  stroke(40);
  line(20, 20, canvas.width-20, 20);
  line(20, canvas.height - 20, canvas.width-20, canvas.height - 20);
  line(20, 20, 20, canvas.height - 20);
  line(canvas.width - 20, 20, canvas.width - 20, canvas.height - 20);

  //save controls behavior
  if(peopleIn == 1){
    $( ".frameReady" ).addClass( "hide" );
    $( ".saveButton").removeClass( "hide" );

  } else {
    $( ".frameReady" ).removeClass( "hide" );
    $( ".saveButton").addClass( "hide" );
  }


  if(keyIsDown(OPTION)){
    optionPressed = true;
    //console.log("You are holding the 'Option' key.");
  }

  if(keyIsDown(69)){
    deleteAble = true;
    //console.log("You are holding the 'E' key.");
  }

  if(setR === null){csR = sliderR.value();}else{csR = setR;}
  if(setV === null){csV = sliderV.value();}else{csV = setV;}
  if(setB === null){csB = sliderB.value();}else{csB = setB;}


  colorChoice.style('background', 'rgb(' + csR + ',' + csV + ',' + csB + ')' );

	if (isDrawing) {
		var point = {
			x: mouseX,
			y: mouseY,
      csR: csR,
      csV: csV,
      csB: csB
		}
		currentPath.push(point);
    //console.log("Pushing points in the 'currentPath' array.");
    // var name = document.getElementById('animatorName').value;
    // if (name === ""){name = yourID;}
    var name = yourID;
    var posX = mouseX;
    var posY = mouseY;
    var strangerPos = {posX: posX, posY: posY, name: name};
    socket.emit('sendPos', strangerPos);
	}

	beginShape();
	strokeWeight(2);
	noFill();

  //Shows Guidelines if there any data in guidePath array
  if (guidePath.length !== 0){
    for (var o = 0; o < guidePath.length; o++){
  		var guide = guidePath[o];
  		for (var i = 0; i < guide.length; i++){
  			var gpath = guide[i];
  			stroke(0, 0, 150);
  			beginShape();
  			for (var j = 0; j < gpath.length; j++){
  				vertex(gpath[j].x, gpath[j].y);
  			}
  			endShape();
  		}
  	}
  }


  //Shows OnionLayer if there any data in predrawing array
  if (predrawing.length !== 0){
    for (var o = 0; o < predrawing.length; o++){
  		var onion = predrawing[o];
  		for (var i = 0; i < onion.length; i++){
  			var opath = onion[i];
  			stroke(100);
  			beginShape();
  			for (var j = 0; j < opath.length; j++){
  				vertex(opath[j].x, opath[j].y);
  			}
  			endShape();
  		}
  	}
  }

  //Shows the current drawing if there any data in drawing array
	for (var i = 0; i < drawing.length; i++){
		var path = drawing[i];
		beginShape();
		for (var j = 0; j < path.length; j++){
      //takes colors data form each point in database
      stroke(path[j].csR, path[j].csV, path[j].csB);
			vertex(path[j].x, path[j].y);
		}
		endShape();
	}

  //Shows Drawings from others people if there any data in socketDrawings array
  for (var i = 0; i < socketDrawings.length; i++){
		var path = socketDrawings[i];
		stroke(255, 0, 0);
    //Displays in RED
		beginShape();
		for (var j = 0; j < path.length; j++){
      //stroke(path[j].csR, path[j].csV, path[j].csB, 90);
			vertex(path[j].x, path[j].y);
		}
		endShape();
	}

  //Shows Drawings data from others people who are ready to go next frame
  if (dataReady.length !== 0){
    for (var i = 0; i < dataReady.length; i++){
  		var path = dataReady[i];
  		stroke(0, 255, 0);
      //Displays in GREEN
  		beginShape();
  		for (var j = 0; j < path.length; j++){
  			vertex(path[j].x, path[j].y);
  		}
  		endShape();
  	}
  }

  // for (var i = 0; i < strangerIsDrawing.length; i++){
	// 	var path = strangerIsDrawing[i];
	// 	stroke(255, 0, 0);
	// 	beginShape();
	// 	for (var j = 0; j < path.length; j++){
	// 		vertex(path[j].x, path[j].y);
	// 	}
	// 	endShape();
	// }

}
// Closing the DRAW function

// ———————————————————————————
//How we handle drawings Part

function saveDrawing(){
  //console.log("——");
  //console.log("We just fired 'saveDrawing'!");

  for (var i = 0; i < dataReady.length; i++){
    drawing.push(dataReady[i]);
  }

	var ref = database.ref('drawings');
  var data;
  if (drawing[0] == null){
    //console.log("No path found, so we set default value to avoid breaking.");
    data = {
      name: "Sylvain",
      drawing: [[{x: 0, y: 0, csR: 0, csV: 0, csB: 0}]]
    }
  } else {
    //console.log("Data OK | Setting data to be sent in DB.");
    data = {
  		name: "Sylvain",
  		drawing: drawing
  	}
  }

  //console.log("We push data in the DB.");
	var result = ref.push(data);
	storeKeys[0].push(result.key);
	storeKeys.splice(1, 1);

  //console.log("We update the local storeKeys array.");

  //When everything is saved in DB, we clear all the arrays
  dataReady = [];
	predrawing = [];
  socketDrawings = [];
	drawing = [];
  //We put the timeline's cursors on the right spot
	timelinePos = storeKeys[0].length - 1;
  onionKey = storeKeys[0].length - 2;
  //console.log("Timeline Position: " + timelinePos + " | Onion Position: " + onionKey );

	clearOnion();
  ////console.log("spotted clearOnion");
  var clearReady = document.getElementById('peopleReady');
  clearReady.innerHTML = "";
  console.log("Success! Your new frame has been saved!");
  var msg = createP('Frame has been saved ! Back on track for the next one !');
  msg.parent('console');
  updateScroll();
  socket.emit('saved', result.key);
  clearDrawing();
}//Closing saveDrawing function

function gotData(data){
  //console.log("—— gotData fired.");
  //console.log("We have new data from Database!");
  waitDB = false;
	//We clear the listing of drawings
	var elts = selectAll('.listing');
	for (var i=0; i < elts.length; i++){
		elts[i].remove();
	}
  //console.log("We updated the timeline (listing).");

	var drawings = data.val();
	var keys = Object.keys(drawings);
	storeKeys.push(keys);
  //console.log("Let's see the content of 'storeKeys':");
  //console.log(storeKeys);

	posKey = storeKeys[0][timelinePos];
	onionPos = storeKeys[0].length - 1;
	document.getElementById('onionkey').value = keys[onionPos];

	//showOnion();
  //We load the list of drawings from DB
	for (var i = 0; i < keys.length; i++){
		var key = keys[i];

		var span = createElement('span');
		span.id(key);
		var ahref = createA('#', '');
		ahref.class('listing');
		ahref.id(key);

    ahref.mouseOver(showAnim);
    ahref.mousePressed(showDrawing);

		span.parent(ahref);
		ahref.parent('drawinglist');
	}
  var spancurrent = createElement('span');
  spancurrent.class('listing current');
  spancurrent.parent('drawinglist');
  spancurrent.mousePressed(clearDrawing);
  clearDrawing();
  //clearDrawing(); à corriger car quand on update ça clear les autres.
}

function errData(){
	////console.log(err);
}

function showDrawing(key){
  //console.log("——");
  //console.log("We just fired 'showDrawing'!");
	if (key instanceof MouseEvent){
		var key = this.id();
    //console.log("The key is instance of MouseEvent");
	}

	var ref = database.ref('drawings/' + key);
  //console.log("We try to fire 'oneDrawing'.");
	ref.on('value', oneDrawing, errData);

	function oneDrawing(data){
    if(!waitDB){
      //console.log("It's OK, we don't have to wait for DB (waitDB is " + waitDB + ")");
      //console.log("oneDrawing success!");
  		var dbdrawing = data.val();
  		drawing = dbdrawing.drawing;
      keyToUpdate = key;
      //console.log("Key displayed: " + key);
      //console.log("Key to update loaded: " + keyToUpdate);
  		//console.log(drawing);

      $( ".listing" ).removeClass( "activedraw" );
      $( "#" + key ).addClass( "activedraw" );
      clearOnion();
      //console.log("Onion Cleared");
      //console.log("Now updating TL and Onion positions...");


      timelinePos = storeKeys[0].indexOf(key);
      onionPos = timelinePos - 1;
      document.getElementById('onionkey').value = storeKeys[0][onionPos];
      //console.log('Index in storeKeys: ' + storeKeys[0].indexOf(key) + ' | Timeline Position: ' +  timelinePos + ' | Onion Position: ' + onionPos);
    } else {//console.log("We wait for gotData ...");
    }

  }
}

function clearDrawing(){
  //console.log("——");
  //console.log("We just fired 'clearDrawing'!");
  keyToUpdate = null;
  $( ".listing" ).removeClass( "activedraw" );
  //dataReady = [];
	drawing = [];
  //console.log("Now, drawing array is very empty.");
  //console.log("We will next load the last drawing as an onion layer...");
  clearOnion();
  onionPos = storeKeys[0].length - 1;
	document.getElementById('onionkey').value = storeKeys[0][onionPos];
  socket.emit('cleared');
	showOnion();
  console.log("Pad has been cleared. Back on track for next frame.");
}

function undoLastPath(){
  drawing.pop();
  //console.log("——");
  //console.log("You deleted the last path in 'drawing'.");
  //console.log("So, there is " + drawing.length + " paths in 'drawing' now.");
}
function abroadUndo(){
  console.log("We fired a Socket function 'abroadUndo'.");
  socketDrawings.pop();
}

function showOnion(){
  //console.log("——");
  //console.log("We just fired 'showOnion'!");

  var key = document.getElementById('onionkey').value;

	var ref = database.ref('drawings/' + key);
	ref.on('value', oneOnion, errData);

	function oneOnion(data){
    if(!waitDB){
      //console.log("It's OK, we don't have to wait for DB (waitDB is " + waitDB + ")");
      //console.log("oneOnion success!");
		  var dbonion = data.val();
		  if (dbonion !== null){predrawing.push(dbonion.drawing);}
    } else {
      //console.log("We wait for DB info before showing OnionSkin.");
    }
	}

  $( "#showOnion" ).addClass( "hide" );
  $( "#clearOnion" ).removeClass( "hide" );
}

function clearOnion(){
	predrawing = [];
  $( "#clearOnion" ).addClass( "hide" );
  $( "#showOnion" ).removeClass( "hide" );
}

function keyPressed() {

  if (keyCode === LEFT_ARROW) {
    //console.log("——");
    timelinePos -= 1;
		if (timelinePos < 1){timelinePos = storeKeys[0].length - 1;}
		posKey = storeKeys[0][timelinePos];
    onionPos = timelinePos - 1;
    document.getElementById('onionkey').value = storeKeys[0][onionPos];
		//console.log(timelinePos, (storeKeys[0].length) - 1, posKey, onionPos);
		keyShowing();
    clearOnion();
    showOnion();
  } else if (keyCode === RIGHT_ARROW) {
    //console.log("——");
    timelinePos += 1;
		if (timelinePos > storeKeys[0].length - 1){timelinePos = 1;}
		posKey = storeKeys[0][timelinePos];
    onionPos = timelinePos - 1;
    document.getElementById('onionkey').value = storeKeys[0][onionPos];
		//console.log(timelinePos, (storeKeys[0].length) - 1, posKey, onionPos);
		keyShowing();
    clearOnion();
    showOnion();
  }
  //  else if (keyCode === 32) {
	// 	togglePlay();
  // }
  else if (keyCode === 13) {
      var chatmsg = document.getElementById("animChat").value.toString();
      var chatname = document.getElementById("animatorName").value;
      if (chatname === ""){
        chatname = yourID;
      }
      var chatObj = {name: chatname,msg: chatmsg}
      if (chatmsg !== ""){
        console.log("pressed enter");
        var mymsg = createP(chatObj.name + ": " + chatObj.msg);
        mymsg.style("color", "#ffdc00")
        mymsg.parent('chat');
        updateScroll();
  			socket.emit('sendChat', chatObj);
        document.getElementById("animChat").value = "";
      }
  }
}

function keyReleased(){
  if (keyCode === OPTION){
    optionPressed = false;
  }
  if (keyCode === 69){
    deleteAble = false;
  }
}

function deleteFrame(){
  //console.log("——");
  //console.log("Deleting frame is not allowed");
  if(keyToUpdate !== null && timelinePos !== 0){
    var keyToDelete = keyToUpdate;
    //console.log("We want to delete " + keyToDelete);
    //console.log("TimelinePos: " + timelinePos);
    //console.log("OnionPos: " + onionPos);
    //console.log("SO we make safety operations ...");
    timelinePos -= 1;
    onionPos -= 1;
    document.getElementById('onionkey').value = storeKeys[0][onionPos];

    //console.log("New TimelinePos: " + timelinePos);
    //console.log("New OnionPos: " + onionPos);
    waitDB = true;
    var delRef = firebase.database().ref('drawings/' + keyToDelete);
    delRef.remove();
    // // timelinePos = storeKeys[0].indexOf(keyToUpdate) - 1;
    // // onionPos = timelinePos - 1;
    var indexKeyToSplice = storeKeys[0].indexOf(keyToDelete);
    storeKeys[0].splice(indexKeyToSplice, 1);
    storeKeys.splice(1, 1);
    console.log("SUCCESS! THE FRAME HAS BEEN DELETED!");
    //console.log("We now display the previous one in the TL...");
    showDrawing(storeKeys[0][timelinePos]);
    //clearOnion();
  } else {
    //console.log("You need to load a frame, before deleting.");
  }
}

function showAnim(key){
  if (key instanceof MouseEvent){
		var key = this.id();

    if (optionPressed){
      showDrawing(key);
      keyToUpdate = key;
      //console.log(keyToUpdate);
    }
  }
}

function keyShowing(){
	var key = posKey;
  $( ".listing" ).removeClass( "activedraw" );
  $( "#" + key ).addClass( "activedraw" );

	var ref = database.ref('drawings/' + key);
	ref.once('value', oneDrawing, errData);

	function oneDrawing(data){
		var dbdrawing = data.val();
		drawing = dbdrawing.drawing;
		//console.log(drawing);
	}
}

function keySave(){
    document.addEventListener('keydown', (event) => {
    const keyName = event.key;

    if (keyName === 'Control') {
      // do not alert when only Control key is pressed.
      return;
    }

    if (event.ctrlKey) {
      // Even though event.key is not 'Control' (i.e. 'a' is pressed),
      // event.ctrlKey may be true if Ctrl key is pressed at the time.
      if (keyName === 's') {
        saveDrawing();
      }
      if (keyName === 'p') {
        // do not alert when only Control key is pressed.
        //saveCanvas(canvas, 'myCanvas', 'jpg');
        //console.log(storeKeys[0]);
      }
      if (keyName === 'z') {
        undoLastPath();
        socket.emit('undo');
      }
      if (keyName === 'd') {
        frameToUpdate();
      }
      if (keyName === 'r') {
        areYouReady();
      }
    }
  }, false);
}
keySave();

function frameToUpdate(){
  //console.log(keyToUpdate);
}

function updateFrame(){
  //console.log("——");
  console.log("We just updated the frame key: " + keyToUpdate);
  waitDB = true;
  var updRef = firebase.database().ref('drawings/' + keyToUpdate);
  var data = {
		name: "Sylvain",
		drawing: drawing
	}
  //console.log("Setting new data ...");
  updRef.set(data);
  //console.log("Now trying to fire oneDrawing ?");
  storeKeys.splice(1, 1);
}

function saveGuide(){
  //console.log("——");
  //console.log("We just fired 'saveGuide'!");
  guidePath.push(drawing);
  //console.log("We send the paths in the 'guidePath' array.");
  socket.emit('guide', drawing);
  //console.log("We send the guideline for others.");
  drawing = [];
  //console.log("Aaand we clear the 'drawing' array.");
  console.log("You saved that path as a guideline.");
}

function sendGuide(data){
  console.log("We fired a Socket function 'sendGuide'.");
  guidePath.push(data);
  socketDrawings = [];
}

function delGuide(){
  //console.log("——");
  //console.log("We just fired 'delGuide'!");
  guidePath = [];
  //console.log("As expected, the 'guidePath' array is now empty.");
  console.log("Guidelines have been deleted.");
}

function togglePlay(){
  //console.log("——");
  //console.log("We just fired 'togglePlay'!");
  playing = !playing;
  clearOnion();
  console.log("ANIMATION STARTED. (playing: " + playing + ")");
  if(playing){

    timelinePos = 0;

      tm = setInterval(playFrames, 84);

  } else {
    clearInterval(tm);
  }
}

function playFrames(){
  timelinePos += 1;
  //saveCanvas(canvas, 'myCanvas' + timelinePos, 'jpg');
  if (timelinePos > storeKeys[0].length - 1){
    timelinePos = storeKeys[0].length - 1;
    clearInterval(tm);
    playing = !playing;
    console.log("ANIMATION STOPPED. (playing: " + playing + ")");
    clearDrawing();
    clearOnion();
  } else {
    posKey = storeKeys[0][timelinePos];
    //console.log("Frame:" + timelinePos + "/" + (storeKeys[0].length - 1) + " | Key: " + posKey);
    keyShowing();
  }
}
