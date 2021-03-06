var canvas;
var visitors;
var client;
var self;
var others;
var stage;
var board;
var buttons;    //{escape [0], 2 [1], 3 [2], 4 [3], continue [4], up [5], down [6], chat [7], game0 [8], game1 [9], ..., game# [#+8]}
var loadingText;
var gameText;
var existingGames;
var sizeText;
var game;
var register;
var chatHistory;
var speech;
var playerText;
var scroll;
var scrollTimer;
var chosenSize;
var chosenGame;
var joining;
var escaping;
var gamingSize;
var gamingExisting;
var waitingToPlay;
var patience;
var chatting;
var turn;
var animator;

//--------------------------------------------------------------------- SETUP

function setup() {                  //put all client responses in setup()
    canvas = createCanvas(200,200);
    canvas.parent("shuffle");
    canvas.mouseOver(over);
    canvas.mouseOut(out);
    
    visitors = 1;
    
    self = new Player();
    others = new Array(0);
    
    board = new Board();
    
    buttons = new Array(0);
    buttons.push(new Button("-60","-60",65,"-15,-15;15,-15;15,15;-15,15")); //Escape
    buttons.push(new Button("50","-60",60,"-15,-12;-15,-18;15,-18;15,3;-9,3;-9,12;15,12;15,18;-15,18;-15,-3;9,-3;9,-12")); //2 player
    buttons.push(new Button("130","-60",60,"-15,-12;-15,-18;15,-18;15,18;-15,18;-15,12;9,12;9,3;-3,3;-3,-3;9,-3;9,-12")); //3 player
    buttons.push(new Button("210","-60",60,"-15,-18;-9,-18;-9,-3;9,-3;9,-18;15,-18;15,18;9,18;9,3;-15,3")); //4 player
    buttons.push(new Button("200","55",50,"-7,-8;10,0;-7,8")); // Continue
    buttons.push(new Button("-105","145",55,"-10,8;0,-12;10,8")); //Scroll Up
    buttons.push(new Button("-105","-158",55,"-10,-8;0,12;10,-8")); //Scroll Down
    buttons.push(new Button("-140","-60",65,"-17,-13;17,-13;17,12;-10,12;-10,20;-17,12")); //Chat
    
    loadingText = new Text("-150","55",15,"Loading...");
    gameText = new Text("-355","90",18,"Pick the game you want to join.");
    sizeText = new Text("20","-100",15,"Pick the number of players in a game.");
    
    register = new TextInput(20,60,15,"Enter Name",13);
    
    playerText = new Text("20","30",30,"");
    
    chatHistory = new Array(0);
    speech = new TextInput(10,50,30,"Enter Message",26);
    
    existingGames = new Array(0);
    
    var addressString = "";
    for (var i=0; i<5; i++) {
        var digit = str(int(random(0,10)));
        
        addressString += digit;
    }
    self.address = int(addressString);
    self.team = [0,0,100];
    
    client = io.connect('http://shuffle-shuffle.193b.starter-ca-central-1.openshiftapps.com/');    //Address on remote server
    
    client.on('visitors', onVisitors);
    client.on('address', onAddress);
    client.on('name', onName);
    client.on('join', onJoin);
    client.on('update',onUpdate);
    client.on('game', onGame);
    client.on('move', onMove);
    client.on('done', onDone);
    client.on('end', onEnd);
    client.on('leave', onLeave);
    client.on('chat', onChat);
    
    game = -1;
    stage = 0;
    scroll = 0;
    scrollTimer = 0;
    chosenSize = 0;
    chosenGame = 0;
    joining = false;
    escaping = false;
    gamingSize = false;
    gamingExisting = false;
    waitingToPlay = false;
    patience = 50;
    chatting = false;
    turn = 0;
    animator = 0;
}

//--------------------------------------------------------------------- DRAW

function draw() {
    switch(stage) {
        case 0:   //Not activated (smaller version)
            document.getElementById("visitors").innerHTML = visitors;
            background(80);
            
            push();
            noStroke();
            fill(255,80);
            translate(width/2,height/2);
            textFont("Lucida Console");
            textSize(48);
            
            rectMode(CENTER);
            rect(0,0,width-10,height-10,7);
            
            textAlign(CENTER);
            fill(0);
            text("Play",0,15);
            pop();
            
            break;
        case 1:    //Pick name
            background(40);
            
            pickName();
            if (joining || escaping) {
                loadingText.position();
                loadingText.display();
            }
            escape();
            
            break;
        case 2:     //Pick game.size or game
            background(40);
            
            register.position(20,50,15);
            register.display();
            pickSize();
            pickGame();
            if (gamingExisting || gamingSize || waitingToPlay || escaping) {
                loadingText.position();
                loadingText.display();
                
                if (patience > 0) {
                    patience--;
                }
                else if (game > -1 && chosenGame > -1) {
                    var data = {
                        address: self.address,
                        name: self.name,
                        game: game,
                        size: existingGames[chosenGame].size
                    }
                    client.emit('game', data);
                    
                    patience = 50;
                }
            }
            chat();
            stay();
            escape();
            
            break;
        case 3:   //Play
            background(0);
            
            stay();
            board.enable();
            board.display();
            self.display();
            for (var i=0; i<others.length; i++) {
                others[i].display();
            }
            move();
            if (turn == 1 || escaping) {
                loadingText.position();
                loadingText.display();
            }
            finish();
            if (!board.touched) {
                playerText.position();
                playerText.display();
            }
            chat();
            escape();
            
            break;
        case 4:   //End
            background(80);
            
            board.enable();
            board.display();
            self.display();
            end();
            if (escaping) {
                loadingText.position();
                loadingText.display();
            }
            chatting = false;
            escape();
            
            break;
        case 5:
            background(80);
            
            board.enable();
            board.display();
            self.display();
            for (var i=0; i<others.length; i++) {
                others[i].display();
            }
            end();
            if (escaping) {
                loadingText.position();
                loadingText.display();
            }
            chatting = false;
            escape();
        case 6:
            background(80);
            
            board.enable();
            board.display();
            self.display();
            for (var i=0; i<others.length; i++) {
                others[i].display();
            }
            end();
            if (escaping) {
                loadingText.position();
                loadingText.display();
            }
            chatting = false;
            escape();
    }
}

//--------------------------------------------------------------------- FUNCTIONS

function pickName() {
    register.position(20,250,48);
    register.enable();
    register.display();
    
    if (stage == 1) {
        buttons[4].position(445,250);
    }
    else if (stage == 2) {
        buttons[4].position(200,45);
    }
    if (!chatting) {
        buttons[4].enable();
        buttons[4].display();
    }
    
    self.name = register.input;
    
    if (buttons[4].enabled && (!mouseIsPressed && !touchIsDown) && !chatting) {
        buttons[4].enabled = false;
        
        if (self.name.length > 0 && self.name != "Enter Name") {
            joining = true;
        }
        else {
            alert("Please choose a name first.");
        }
    }
    
    if (joining) {
        var data = {
        address: self.address,
        name: self.name
        }
        client.emit('join', data);
    }
}

function pickSize() {
    sizeText.position();
    sizeText.display();
    
    for (var b=1; b<4; b++) {
        buttons[b].position();
        if (!chatting) {
            buttons[b].enable();
        }
        buttons[b].display();
    }
    
    if ((buttons[1].enabled || buttons[2].enabled || buttons[3].enabled) && !mouseIsPressed && !touchIsDown && !gamingExisting && !gamingSize && !waitingToPlay) {
        gamingSize = true;
        
        for (var b=1; b<4; b++) {
            if (buttons[b].enabled) {
                chosenSize = b+1;
                board.size = chosenSize+2;
            }
            buttons[b].enabled = false;
        }
    }
    
    if (gamingSize) {
        var data = {
            address: self.address,
            name: self.name,
            game: -1,
            size: chosenSize
        }
        
        client.emit('game', data);
    }
}

function pickGame() {
    gameText.position();    //Heading at top of list
    gameText.display();
    
    var scale = 1;
    if (width < height) {
        scale = width / 500;
    }
    else {
        scale = height / 500;
    }
    
    var amountVisible = floor((height-((110+120)*scale)) / (37*scale));
    
    var gamesList = "";
    for (var i=scroll; i<existingGames.length && i<scroll+amountVisible; i++) {    //List of available games
        if (existingGames[i].players.length > 0) {
            gamesList += existingGames[i].players[0].name;
        }
        else {
            gamesList += "EMPTY GAME.";
        }
        for (var s=0; s < 13-existingGames[i].players[0].name.length; s++) {
            gamesList += " ";
        }
        if (existingGames[i].full) {
            gamesList += "\tFULL";
        }
        else {
            gamesList += "\t" + str(existingGames[i].players.length) + "/" + str(existingGames[i].size);
        }
        gamesList += "\n";
    }
    if (gamesList.length == 0) {
        gamesList = "\n\nNo games available.";
    }
    
    push();
    fill(0);
    noStroke();
    translate(10,110*scale);
    rect(0,0,width-20,height - ((110+120)*scale));
    fill(255);
    textAlign(LEFT);
    textFont("Lucida Console");
    textSize(30*scale);             //Text-height ~37*scale
    translate(10,30*scale);
    text(gamesList,0,0);
    pop();
    
    for (var i=8+scroll; i<buttons.length && i<scroll+amountVisible+8; i++) {   //Game selection buttons
        if (!existingGames[i-8-scroll].full) {
            var x = buttons[i].anchor[0];
            var y = str(132 + ((i-8-scroll)*37));
            
            buttons[i].position(x,y);
            if (!chatting) {
                buttons[i].enable();
            }
            buttons[i].display();
        }
    }
    
    for (var b=5; b<7; b++) {   //Scroll up and down
        buttons[b].position();
        if (!chatting) {
            buttons[b].enable();
        }
        buttons[b].display();
    }
    if (buttons[5].enabled) {
        if (scroll > 0 && scrollTimer == 0) {
            scroll--;
        }
    }
    if (buttons[6].enabled) {
        if (scroll+amountVisible < existingGames.length + 1 && scrollTimer == 0) {
            scroll++;
        }
    }
    scrollTimer++;
    if (scrollTimer > 10) {
        scrollTimer = 0;
    }
    if (!mouseIsPressed && !touchIsDown) {
        buttons[5].enabled = false;
        buttons[6].enabled = false;
    }
    
    for (var i=8; i<buttons.length && !gamingSize && !gamingExisting && !mouseIsPressed && !touchIsDown && !waitingToPlay; i++) {    //Action
        if (buttons[i].enabled) {
            chosenGame = i-8;
            board.size = existingGames[chosenGame].size+2;
            
            gamingExisting = true;
            buttons[i].enabled = false;
        }
    }
    
    if (gamingExisting) {
        var data = {
            address: self.address,
            name: self.name,
            game: existingGames[chosenGame].address,
            size: existingGames[chosenGame].size
        }
        
        client.emit('game', data);
    }
}

function chat() {
    if (chatting) {
        push();
        fill(0,220);
        noStroke();
        rectMode(CORNER);
        rect(0,0,width,height);
        pop();
        
        buttons[7].notification.label = "";
        
        speech.position();                                                      //Input
        speech.enable();
        speech.display();
        if (speech.input != speech.initial && speech.enabled && keyIsPressed && (keyCode == ENTER || keyCode == RETURN)) {
            var message = self.name + ": " + speech.input;
            speech.input = speech.initial;
            
            client.emit('chat',message);
        }
        
        buttons[4].position(-40,55);
        buttons[4].enable();
        buttons[4].display();
        if (buttons[4].enabled) {
            if (!touchIsDown && !mouseIsPressed) {
                var message = self.name + ": " + speech.input;
                speech.input = speech.initial;
                
                client.emit('chat',message);
                
                buttons[4].enabled = false;
            }
        }
        
        var scale = 1;
        if (width < height) {
            scale = width / 500;
        }
        else {
            scale = height / 500;
        }
        
        while(chatHistory.length > 30) {                                        //Delete old messages
            chatHistory.splice(0,1);
        }
        var amountVisible = floor((height-(200*scale)) / (25*scale));     //Choose what is visible
        
        var messages = "";                                                      //Prepare list
        var init = 0;
        if (chatHistory.length-1-amountVisible > 0) {
            init = chatHistory.length-1-amountVisible;
        }
        for (var i=init; i<chatHistory.length; i++) {
            messages += chatHistory[i] + "\n";
        }
        if (messages.length == 0) {
            messages = "\n\nNo messages...";
        }
        
        push();                                                                 //Display list
        translate(10,110*scale);
        fill(255);
        noStroke();
        textAlign(LEFT);
        textFont("Lucida Console");
        textSize(20*scale);
        text(messages,0,0);
        pop();
    }
    
    if (stage == 3) {                                                           //Chat button
        buttons[7].position(-140,-35);
    }
    else {
        buttons[7].position();
    }
    buttons[7].enable();
    buttons[7].display();
    
    if (buttons[7].enabled) {
        if (chatting == false) {
            chatting = true;
        }
    }
    else if (chatting) {
        chatting = false;
    }
}

function move() {
    if (turn == 0) {        //Select moves
        self.play();
        
        if (self.played) {
            buttons[4].position(455,45);
            if (!chatting) {
                buttons[4].enable();
            }
            buttons[4].display();
            
            if (buttons[4].enabled && (!mouseIsPressed && !touchIsDown)) {
                buttons[4].enabled = false;
                turn = 1;
            }
        }
    }
    else if (turn == 1) {
        var newPieces = [];
        for (var i=0; i<self.pieces.length; i++) {
            var info = {
                location: self.pieces[i].location,
                block: self.pieces[i].block,
                diagonal: self.pieces[i].diagonal,
                cardinal: self.pieces[i].cardinal,
                move: self.pieces[i].move,
                captain: self.pieces[i].captain
            }
            
            newPieces.push(info);
        }
        
        var data = {
            address: self.address,
            game: game,
            move: newPieces
        }
        client.emit('move', data);
    }
}

function finish() {
    if (turn == 2) {        //Realize primary moves
        animator++;
        
        if (animator > 120) {
            turn = 3;
            animator = 0;
            for (var p=0; p<self.pieces.length; p++) {
                self.pieces[p].update();
            }
            for (var o=0; o<others.length; o++) {
                for (var p=0; p<others[o].pieces.length; p++) {
                    others[o].pieces[p].update();
                }
            }
        }
    }
    else if (turn == 3) {   //Analyze primary collisions (stick,take,block,shove)
        animator++;
        
        if (animator > 20) {
            self.primaryCollision(-1);
            for (var i=0; i<others.length; i++) {
                others[i].primaryCollision(i);
            }
            
            for (var p=0; p<self.pieces.length; p++) {
                if (!self.pieces[p].moved) {
                    self.pieces[p].move = [0,0];
                }
                self.pieces[p].moved = false;
            }
            for (var i=0; i<others.length; i++) {
                for (var p=0; p<others[i].pieces.length; p++) {
                    if (!others[i].pieces[p].moved) {
                        others[i].pieces[p].move = [0,0];
                    }
                    others[i].pieces[p].moved = false;
                }
            }
            
            turn = 4;
            animator = 0;
        }
    }
    else if (turn == 4) {   //Realize secondary moves
        animator++;
        
        if (animator > 120) {
            turn = 5;
            animator = 0;
            for (var p=0; p<self.pieces.length; p++) {
                self.pieces[p].update();
            }
            for (var o=0; o<others.length; o++) {
                for (var p=0; p<others[o].pieces.length; p++) {
                    others[o].pieces[p].update();
                }
            }
        }
    }
    else if (turn == 5) {   //Realize secondary collisions (squash,check)
        self.secondaryCollision(-1);
        for (var i=0; i<others.length; i++) {
            others[i].secondaryCollision(i);
        }
        
        for (var p=self.pieces.length-1; p>-1; p--) {
            if (self.pieces[p].taken) {
                self.pieces.splice(p,1);
            }
            else if (self.pieces[p].upgraded) {
                self.pieces[p].captain = true;
                self.pieces[p].upgraded = false;
            }
        }
        for (var o=0; o<others.length; o++) {
            for (var p=others[o].pieces.length-1; p>-1; p--) {
                if (others[o].pieces[p].taken) {
                    others[o].pieces.splice(p,1);
                }
                else if (others[o].pieces[p].upgraded) {
                    others[o].pieces[p].captain = true;
                    others[o].pieces[p].upgraded = false;
                }
            }
            
        }
        
        turn = 6;
        
        for (p=0; p<self.pieces.length; p++) {
            self.pieces[p].move = [0,0];
        }
        for (var o=0; o<others.length; o++) {
            for (var p=0; p<others[o].pieces.length; p++) {
                others[o].pieces[p].move = [0,0];
            }
        }
    }
    else if (turn == 6) {   //Emit DONE
        var data = {
        game: game,
        address: self.address,
        move: self.pieces
        }
        client.emit('done', data);
    }
}

function stay() {
    if (game > -1) {
        var data = {
        address: self.address,
        game: game
        }
        
        client.emit('stay', data);
    }
}

function escape() {
    if (!chatting && (stage != 3 || !board.touched)) {
        if (stage == 3) {
            buttons[0].position(-60,-35);
        }
        else {
            buttons[0].position();
        }
        buttons[0].enable();
        buttons[0].display();
        
        if (buttons[0].enabled && (!mouseIsPressed && !touchIsDown)) {
            buttons[0].enabled = false;
            escaping = true;
        }
    }
    
    if (escaping) {
        var data = {
            address: self.address,
            game: game
        }
        
        client.emit('leave', data);
    }
}

function end() {
    var scale = width/500;
    if (height < width) {
        scale = height/500;
    }
    
    push();
    noStroke();
    fill(255,80);
    translate(width/2,height/2);
    var endText = "";
    if (stage == 4) {
        endText = "You won the game!";
    }
    else if (stage == 5) {
        endText = "You Lost.";
    }
    else if (stage == 6) {
        endText = "Tie Game!";
    }
    textFont("Lucida Console");
    textSize(32*scale);
    
    rectMode(CENTER);
    rect(0,-8*scale,textWidth(endText)*1.05,60*scale,7);
    
    textAlign(CENTER);
    fill(0);
    text(endText,0,0);
    pop();
}

//--------------------------------------------------------------------- RESPONSES

function onVisitors(population) {
    visitors = population;
}

function onAddress(response) {
    var alert = "Your address " + self.address + " was used."
    
    var addressString = "";
    for (var i=0; i<5; i++) {
        var digit = str(int(random(0,10)));
        
        addressString += digit;
    }
    self.address = int(addressString);
    
    alert += "\nYour new address is " + self.address;
    alert(alert);
}

function onName(response) {
    if (joining) {
        alert("Your name " + self.name + " is currently used by another player.\nPlease choose another or try again later.");
        
        register.input = register.initial;
        joining = false;
        buttons[4].enabled = false;
    }
}

function onJoin(games) {
    if (joining) {
        existingGames = games;
        
        for (var i=buttons.length-1; i>7; i--) {
            buttons.splice(i,1);
        }
        for (var i=0; i<existingGames.length; i++) {
            var y = str(132 + (i*37));
            buttons.push(new Button("-40",y,30,"-8,0;0,-8;8,0;0,8"));
        }
        
        stage = 2;
        joining = false;
    }
}

function onUpdate(games) {
    if (stage == 2) {
        existingGames = games;
        
        while (scroll >= existingGames.length) {
            scroll--;
        }
        if (scroll < 0) {
            scroll = 0;
        }
        
        waitingToPlay = false;
        
        for (var i=buttons.length-1; i>7; i--) {
            buttons.splice(i,1);
        }
        
        for (var i=0; i<existingGames.length; i++) {
            var y = str(132 + (i*37));
            buttons.push(new Button("-40",y,30,"-8,0;0,-8;8,0;0,8"));
            
            for (var p=0; p<existingGames[i].players.length; p++) {
                if (existingGames[i].players[p].address == self.address) {
                    chosenGame = i;
                    game = existingGames[i].address;
                    gamingSize = false;
                    gamingExisting = false;
                    waitingToPlay = true;
                    
                    if (existingGames[i].full) {
                        var data = {
                            address: self.address,
                            name: self.name,
                            game: game,
                            size: existingGames[chosenGame].size
                        }
                        client.emit('game', data);
                    }
                }
            }
        }
    }
}

function onGame(response) {
    if (waitingToPlay && response.game == game) {
        var t=0;
        
        for (var i=0; i<response.players.length; i++) {
            if (response.players[i].address == self.address) {
                waitingToPlay = false;
                game = response.game;
                stage = 3;
                
                for (var p=0; p<response.players[i].pieces.length; p++) {
                    self.pieces.push(new Piece(response.players[i].pieces[p].location,response.players[i].pieces[p].block,response.players[i].pieces[p].diagonal,response.players[i].pieces[p].cardinal));
                }
            }
            else {
                others.push(new Player());
                
                var team = [];
                switch (t) {
                    case 0:
                        team = [100,0,0];
                        break;
                    case 1:
                        team = [0,100,0];
                        break;
                    case 2:
                        team = [100,100,0];
                        break;
                }
                t++;
                
                others[others.length-1].address = response.players[i].address;
                others[others.length-1].name = response.players[i].name;
                others[others.length-1].team = team;
                for (var p=0; p<response.players[i].pieces.length; p++) {
                    others[others.length-1].pieces.push(new Piece(response.players[i].pieces[p].location,response.players[i].pieces[p].block,response.players[i].pieces[p].diagonal,response.players[i].pieces[p].cardinal));
                }
            }
        }
        
        playerText.label = self.name + " (Blue)\n" + others[0].name + " (Red)\n";
        if (others.length > 1) {
            playerText.label += others[1].name + " (Green)\n";
        }
        if (others.length > 2) {
            playerText.label += others[2].name + " (Yellow)\n";
        }
    }
}

function onMove(response) {
    if (response.game == game && turn == 1) {
        for (var i=0; i<response.players.length; i++) {
            if (response.players[i].address != self.address) {
                for (var o=0; o<others.length; o++) {
                    if (response.players[i].address == others[o].address) {
                        others[o].move(response.players[i].pieces);
                    }
                }
            }
        }
        
        animator = 0;
        turn = 2;
    }
}

function onDone(gameAddress) {
    if (gameAddress == game && turn == 6) {
        animator = 0;
        turn = 0;
    }
}

function onEnd(response) {
    if (response.game == game && response.winner == self.name && stage == 3) {
        stage = 4;
    }
}

function onLeave(response) {
    if (stage > 0) {
        if (response.address == self.address || (response.game == game && response.address == -1)) {
            if (escaping) {
                alert("You successfully left the game.");
            }
            else if (response.address == -1) {
                alert("Your game lost connection.");
            }
            else {
                if (response.reason == 0) {
                    alert("You lost connection.");
                }
            }
            
            if (response.reason == 0) {
                chosenSize = 0;
                chosenGame = 0;
                escaping = false;
                joining = false;
                gamingSize = false;
                gamingExisting = false;
                waitingToPlay = false;
                chatting = false;
                speech.input = speech.initial;
                stage = 0;
                self.name = "";
                self.pieces = [];
                windowResized();
                scroll = 0;
                game = -1;
                others = [];
                turn = 0;
                for (var i=buttons.length-1; i>7; i--) {
                    buttons.splice(i,1);
                }
            }
            else if (response.reason == 1) {
                stage = 5;
            }
            else if (response.reason == 2) {
                stage = 6;
            }
        }
        else if (response.game == game) {
            for (var i=0; i<others.length; i++) {
                if (response.address == others[i].address) {
                    if (response.reason == 0) {
                        alert("Another player either lost connection or left.");
                    }
                    else if (response.reason == 1) {
                        alert("Another player was eliminated.");
                    }
                    others.splice(i,1);
                    i--;
                    
                    playerText.label = self.name + " (Blue)\n";
                    for (var i=0; i<others.length; i++) {
                        playerText.label += others[i].name;
                        switch (others[i].team.join()) {
                            case "100,0,0":
                                playerText.label += " (Red)";
                                break;
                            case "0,100,0":
                                playerText.label += " (Green)";
                                break;
                            case "100,100,0":
                                playerText.label += " (Yellow)";
                                break;
                        }
                        playerText.label += "\n";
                    }
                }
            }
        }
    }
}

function onChat(message) {
    chatHistory.push(message);
    
    if (!chatting) {
        if (buttons[7].notification.label.length == 0) {
            buttons[7].notification.label = "1";
        }
        else {
            buttons[7].notification.label = str(int(buttons[7].notification.label) + 1);
        }
    }
}

//--------------------------------------------------------------------- BUTTON CLASS

function Button(x,y,d,l) {
    this.anchor = [x,y];
    this.location = new p5.Vector(0,0);
    this.mold = d;
    this.scale = 1;
    this.diameter = d;
    this.label = l;
    this.touched = false;
    this.enabled = false;
    this.canPress = true;
    this.notification = new Notification();
    
    this.position = function(x,y) {
        if (x != null && y != null) {
            this.anchor = [str(x),str(y)];
        }
        
        if (width < height) {
            this.scale = width/500;
        }
        else {
            this.scale = height/500;
        }
        
        this.diameter = this.mold * this.scale;
        
        if (this.anchor[0].indexOf("-") > -1) {
            this.location.x = width - (int(this.anchor[0].substring(1)) * this.scale);
        }
        else {
            this.location.x = int(this.anchor[0]) * this.scale;
        }
        if (this.anchor[1].indexOf("-") > -1) {
            this.location.y = height - (int(this.anchor[1].substring(1)) * this.scale);
        }
        else {
            this.location.y = int(this.anchor[1]) * this.scale;
        }
    }
    
    this.enable = function() {
        var distance = new p5.Vector(mouseX,mouseY);
        distance.sub(this.location);
        
        if (distance.mag() < this.diameter*0.5 || (this.location.equals(buttons[0].location) && mouseX > this.location.x && mouseY > this.location.y)) {
            this.touched = true;
        }
        else {
            this.touched = false;
        }
        
        if (this.touched && (mouseIsPressed || touchIsDown) && this.canPress) {
            if (this.enabled) {
                this.enabled = false;
            }
            else {
                this.enabled = true;
            }
            this.canPress = false;
        }
        else if (!mouseIsPressed && !touchIsDown) {
            this.canPress = true;
        }
    }
    
    this.display = function() {
        push();
        
        translate(this.location.x,this.location.y);
        
        var shapes = split(this.label,"**");
        
        if (this.enabled) {
            fill(255);
            noStroke();
        }
        else {
            noFill();
            stroke(255);
            strokeWeight(2);
        }
        for (var s=0; s<shapes.length; s++) {
            var vertices = split(shapes[s],";");
            
            beginShape();
            for (var v=0; v<vertices.length; v++) {
                var coordinates = int(split(vertices[v],","));
                
                vertex(coordinates[0]*this.scale,coordinates[1]*this.scale);
            }
            endShape(CLOSE);
        }
        
        if (this.touched) {
            noFill();
            stroke(255);
            strokeWeight(1.5);
            ellipse(0,0,this.diameter,this.diameter);
        }
        
        pop();
        
        var notif = new p5.Vector(this.diameter*0.45,this.diameter*-0.45);
        notif.add(this.location);
        
        this.notification.display(notif,this.scale);
    }
}

function Notification() {
    this.label = "";
    this.diameter = 12;
    
    this.display = function(v,s) {
        if (this.label.length > 0) {
            push();
            translate(v.x,v.y);
            fill(255);
            noStroke();
            textAlign(CENTER);
            textFont("Lucida Console");
            textSize(this.diameter*s);
            text(this.label,0,0);

            pop();
        }
    }
}

//--------------------------------------------------------------------- TEXT CLASS

function Text(x,y,s,l) {
    this.anchor = [x,y];
    this.location = new p5.Vector(0,0);
    this.size = s;
    this.scale = 1;
    this.label = l;
    
    this.position = function() {
        if (width < height) {
            this.scale = width/500;
        }
        else {
            this.scale = height/500;
        }
        
        if (this.anchor[0].indexOf("-") > -1) {
            this.location.x = width - (int(this.anchor[0].substring(1)) * this.scale);
        }
        else {
            this.location.x = int(this.anchor[0]) * this.scale;
        }
        if (this.anchor[1].indexOf("-") > -1) {
            this.location.y = height - (int(this.anchor[1].substring(1)) * this.scale);
        }
        else {
            this.location.y = int(this.anchor[1]) * this.scale;
        }
        
    }
    
    this.display = function() {
        push();
        
        translate(this.location.x,this.location.y);
        textAlign(LEFT);
        textFont("Lucida Console");
        textSize(this.size*this.scale);
        noStroke();
        fill(255);
        text(this.label,0,0);
        
        pop();
    }
}

//--------------------------------------------------------------------- TEXTINPUT CLASS

function TextInput(x,y,s,i,m) {
    this.anchor = [x,y];
    this.location = new p5.Vector(0,0);
    this.size = s;
    this.scale = 1;
    this.initial = i;
    this.input = i;
    this.max = m;
    this.touched = false;
    this.enabled = false;
    this.canPress = true;
    this.preKey = "";
    this.canType = 0;
    
    this.position = function(x,y,s) {
        if (x != null && y != null && s != null) {
            this.anchor = [x,y];
            this.size = s;
        }
        
        if (width < height) {
            this.scale = width/500;
        }
        else {
            this.scale = height/500;
        }
        
        this.location.x = this.anchor[0] * this.scale;
        this.location.y = this.anchor[1] * this.scale;
    }
    
    this.enable = function() {
        var difference = new p5.Vector(mouseX,mouseY);
        difference.sub(this.location);
        
        textFont("Lucida Console");
        textSize(this.size*this.scale);
        
        if (difference.x > 0 && difference.x < textWidth(this.input) && difference.y > -40*this.scale && difference.y < 10*this.scale) {
            this.touched = true;
        }
        else {
            this.touched = false;
        }
        
        if (this.touched && (mouseIsPressed || touchIsDown) && this.canPress) {
            if (this.enabled) {
                this.enabled = false;
            }
            else {
                this.enabled = true;
            }
            this.canPress = false;
            
            if (touchIsDown) {
                var p = prompt(this.initial, this.input);
                if (p != null) {
                    this.enabled = false;
                    if (p.length > this.max) {
                        this.input = p.substring(0,this.max);
                    }
                    else {
                        this.input = p;
                    }
                }
                else {
                    this.enabled = false;
                    this.input = this.initial;
                }
                
                if (this.input.length == 0) {
                    this.input = this.initial;
                }
            }
        }
        else if (!mouseIsPressed && !touchIsDown) {
            this.canPress = true;
        }
        else if (!this.touched && (mouseIsPressed || touchIsDown)) {
            this.enabled = false;
            if (this.input.length == 0) {
                this.input = this.initial;
            }
        }
        
        if (!keyIsPressed || this.canType > 20 || this.preKey != key) {
            this.canType = 0;
        }
        if (this.enabled) {
            if (keyIsPressed) {
                if (this.canType == 0) {
                    if (keyCode == DELETE || keyCode == BACKSPACE) {
                        this.input = this.input.substring(0,this.input.length-1);
                    }
                    else if (key != null && keyCode != SHIFT && keyCode != CONTROL && keyCode != TAB && keyCode != ESCAPE && keyCode != OPTION && keyCode != ALT && keyCode != UP_ARROW && keyCode != DOWN_ARROW && keyCode != LEFT_ARROW && keyCode != RIGHT_ARROW && keyCode != ENTER && keyCode != RETURN) {
                        if (this.input == this.initial) {
                            this.input = key;
                        }
                        else if (this.input.length < this.max) {
                            this.input += key;
                        }
                    }
                    this.canType = false;
                }
                
                this.canType++;
            }
            
            this.preKey = key;
        }
    }
    
    this.display = function() {
        push();
        
        translate(this.location.x,this.location.y);
        textAlign(LEFT);
        textFont("Lucida Console");
        textSize(this.size*this.scale);
        
        stroke(255);
        strokeWeight(1.5);
        noFill();
        if (this.touched) {
            line(0,10*this.scale,textWidth(this.input),10*this.scale);
        }
        if (this.enabled) {
            line(textWidth(this.input),-40*this.scale,textWidth(this.input),10*this.scale);
        }
        
        noStroke();
        fill(255);
        text(this.input,0,0);
        
        pop();
    }
}

//--------------------------------------------------------------------- BOARD CLASS

function Board() {
    this.size = 4;
    this.diameter;
    this.touched = false;
    //TBA
    
    this.enable = function() {
        if (mouseX > (width - this.diameter)/2 && mouseX < (width + this.diameter)/2 && mouseY > (height - this.diameter)/2 && mouseY < (height + this.diameter)/2) {
            this.touched = true;
        }
        else {
            this.touched = false;
        }
    }
    
    this.display = function() {
        push();
        
        fill(0);
        noStroke();
        rectMode(CENTER);
        
        if (width < height) {
            this.diameter = width-20;
        }
        else {
            this.diameter = height-20;
        }
        rect(width/2,height/2,this.diameter-2,this.diameter-2);
        
        noFill();
        stroke(255);
        strokeWeight(2);
        rect(width/2,height/2,this.diameter,this.diameter,5);
        
        for (var i=1; i<this.size; i++) {
            line((width-this.diameter)/2 + (this.diameter/this.size)*i, (height-this.diameter)/2, (width-this.diameter)/2 + (this.diameter/this.size)*i, (height+this.diameter)/2);
        }
        for (var i=1; i<this.size; i++) {
            line((width-this.diameter)/2, (height-this.diameter)/2 + (this.diameter/this.size)*i, (width+this.diameter)/2, (height-this.diameter)/2 + (this.diameter/this.size)*i);
        }
        
        pop();
    }
}

//--------------------------------------------------------------------- PLAYER CLASS

function Player() {
    this.address = 0;
    this.name = "";
    this.team = [];
    this.pieces = [];
    this.played = false;
    
    this.play = function() {        //Only for self
        var finished = true;
        
        for (var p=0; p<this.pieces.length; p++) {
            this.pieces[p].enable();
            
            if (this.pieces[p].move.join() == "0,0") {
                finished = false;
            }
            
            if (this.pieces[p].enabled) {
                var overlaps = [];
                
                for (var q=0; q<this.pieces.length; q++) {
                    if (p != q) {
                        this.pieces[q].enabled = false;
                        
                        if (this.pieces[q].move.join() != "0,0") {
                            switch (this.pieces[q].move.join()) {
                                case "0,-1":
                                    overlaps.push([this.pieces[q].location.x,this.pieces[q].location.y-1].join());
                                    break;
                                case "1,-1":
                                    overlaps.push([this.pieces[q].location.x+1,this.pieces[q].location.y-1].join());
                                    break;
                                case "1,0":
                                    overlaps.push([this.pieces[q].location.x+1,this.pieces[q].location.y].join());
                                    break;
                                case "1,1":
                                    overlaps.push([this.pieces[q].location.x+1,this.pieces[q].location.y+1].join());
                                    break;
                                case "0,1":
                                    overlaps.push([this.pieces[q].location.x,this.pieces[q].location.y+1].join());
                                    break;
                                case "-1,1":
                                    overlaps.push([this.pieces[q].location.x-1,this.pieces[q].location.y+1].join());
                                    break;
                                case "-1,0":
                                    overlaps.push([this.pieces[q].location.x-1,this.pieces[q].location.y].join());
                                    break;
                                case "-1,-1":
                                    overlaps.push([this.pieces[q].location.x-1,this.pieces[q].location.y-1].join());
                                    break;
                            }
                        }
                    }
                }
                
                this.pieces[p].aim(overlaps);
            }
        }
        
        if (finished) {
            this.played = true;
        }
        else {
            this.played = false;
        }
    }
    
    this.move = function(moves) {       //Only for others
        for (var m=0; m<moves.length; m++) {
            for (var p=0; p<this.pieces.length; p++) {
                if (moves[m].block == this.pieces[p].block && moves[m].diagonal == this.pieces[p].diagonal && moves[m].cardinal == this.pieces[p].cardinal) {
                    this.pieces[p].move = moves[m].move;
                    this.pieces[p].captain = moves[m].captain;
                }
            }
        }
    }
    
    this.primaryCollision = function(player) {
        for (var p=0; p<this.pieces.length; p++) {
            var pieceTaken = false;
            
            if (player > -1) {
                for (var sp=0; sp<self.pieces.length; sp++) {
                    if (self.pieces[sp].location.x == this.pieces[p].location.x && self.pieces[sp].location.y == this.pieces[p].location.y) {
                        if (self.pieces[sp].block) {
                            if (self.pieces[sp].cardinal) {
                                if (self.pieces[sp].diagonal) {
                                    //  o
                                    if (this.pieces[p].block) {
                                        if (this.pieces[p].cardinal && this.pieces[p].diagonal) {// stick
                                            this.pieces[p].move[0] *= -1;
                                            this.pieces[p].move[1] *= -1;
                                            this.pieces[p].moved = true;
                                        }
                                    }
                                    else {//    block
                                        this.pieces[p].move[0] *= -1;
                                        this.pieces[p].move[1] *= -1;
                                        this.pieces[p].moved = true;
                                    }
                                }
                                else {
                                    //  #
                                    if (this.pieces[p].block) {
                                        if (!this.pieces[p].diagonal || this.pieces[p].cardinal) {
                                            if (this.pieces[p].diagonal) {//    shove
                                                this.pieces[p].move = self.pieces[sp].move;
                                                this.pieces[p].moved = true;
                                            }
                                            else {//    stick
                                                this.pieces[p].move[0] *= -1;
                                                this.pieces[p].move[1] *= -1;
                                                this.pieces[p].moved = true;
                                            }
                                        }
                                    }
                                    else {//    block
                                        this.pieces[p].move[0] *= -1;
                                        this.pieces[p].move[1] *= -1;
                                        this.pieces[p].moved = true;
                                    }
                                }
                            }
                            else {
                                //  ∆
                                if (this.pieces[p].block) {
                                    if (this.pieces[p].cardinal) {//    shove
                                        this.pieces[p].move = self.pieces[sp].move;
                                        this.pieces[p].moved = true;
                                    }
                                    else {//    stick
                                        this.pieces[p].move[0] *= -1;
                                        this.pieces[p].move[1] *= -1;
                                        this.pieces[p].moved = true;
                                    }
                                }
                                else {//    block
                                    this.pieces[p].move[0] *= -1;
                                    this.pieces[p].move[1] *= -1;
                                    this.pieces[p].moved = true;
                                }
                            }
                        }
                        else {
                            if (self.pieces[sp].cardinal) {
                                if (self.pieces[sp].diagonal) {
                                    if (self.pieces[sp].captain) {
                                        //  ©
                                        if (!this.pieces[p].block) {
                                            if (this.pieces[p].captain) {//     stick
                                                this.pieces[p].move[0] *= -1;
                                                this.pieces[p].move[1] *= -1;
                                                this.pieces[p].moved = true;
                                            }
                                            else {//    take
                                                pieceTaken = true;
                                            }
                                        }
                                    }
                                    else {
                                        //  *
                                        if (!this.pieces[p].block && this.pieces[p].cardinal && this.pieces[p].diagonal && !this.pieces[p].captain) {//    stick
                                            this.pieces[p].move[0] *= -1;
                                            this.pieces[p].move[1] *= -1;
                                            this.pieces[p].moved = true;
                                        }
                                    }
                                }
                                else {
                                    //  +
                                    if (!this.pieces[p].block && this.pieces[p].cardinal && !this.pieces[p].captain) {
                                        if (this.pieces[p].diagonal) {//    take
                                            pieceTaken = true;
                                        }
                                        else {//    stick
                                            this.pieces[p].move[0] *= -1;
                                            this.pieces[p].move[1] *= -1;
                                            this.pieces[p].moved = true;
                                        }
                                    }
                                }
                            }
                            else {
                                //  x
                                if (!this.pieces[p].block && !this.pieces[p].captain) {
                                    if (this.pieces[p].cardinal) {//    take
                                        pieceTaken = true;
                                    }
                                    else {//    stick
                                        this.pieces[p].move[0] *= -1;
                                        this.pieces[p].move[1] *= -1;
                                        this.pieces[p].moved = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            if (!pieceTaken) {
                for (var o=0; o<others.length; o++) {
                    if (player != o) {
                        for (var op=0; op<others[o].pieces.length; op++) {
                            if (others[o].pieces[op].location.x == this.pieces[p].location.x && others[o].pieces[op].location.y == this.pieces[p].location.y) {
                                if (others[o].pieces[op].block) {
                                    if (others[o].pieces[op].cardinal) {
                                        if (others[o].pieces[op].diagonal) {
                                            //  o
                                            if (this.pieces[p].block) {
                                                if (this.pieces[p].cardinal && this.pieces[p].diagonal) {// stick
                                                    this.pieces[p].move[0] *= -1;
                                                    this.pieces[p].move[1] *= -1;
                                                    this.pieces[p].moved = true;
                                                }
                                            }
                                            else {//    block
                                                this.pieces[p].move[0] *= -1;
                                                this.pieces[p].move[1] *= -1;
                                                this.pieces[p].moved = true;
                                            }
                                        }
                                        else {
                                            //  #
                                            if (this.pieces[p].block) {
                                                if (!this.pieces[p].diagonal || this.pieces[p].cardinal) {
                                                    if (this.pieces[p].diagonal) {//    shove
                                                        this.pieces[p].move = others[o].pieces[op].move;
                                                        this.pieces[p].moved = true;
                                                    }
                                                    else {//    stick
                                                        this.pieces[p].move[0] *= -1;
                                                        this.pieces[p].move[1] *= -1;
                                                        this.pieces[p].moved = true;
                                                    }
                                                }
                                            }
                                            else {//    block
                                                this.pieces[p].move[0] *= -1;
                                                this.pieces[p].move[1] *= -1;
                                                this.pieces[p].moved = true;
                                            }
                                        }
                                    }
                                    else {
                                        //  ∆
                                        if (this.pieces[p].block) {
                                            if (this.pieces[p].cardinal) {//    shove
                                                this.pieces[p].move = others[o].pieces[op].move;
                                                this.pieces[p].moved = true;
                                            }
                                            else {//    stick
                                                this.pieces[p].move[0] *= -1;
                                                this.pieces[p].move[1] *= -1;
                                                this.pieces[p].moved = true;
                                            }
                                        }
                                        else {//    block
                                            this.pieces[p].move[0] *= -1;
                                            this.pieces[p].move[1] *= -1;
                                            this.pieces[p].moved = true;
                                        }
                                    }
                                }
                                else {
                                    if (others[o].pieces[op].cardinal) {
                                        if (others[o].pieces[op].diagonal) {
                                            if (others[o].pieces[op].captain) {
                                                //  ©
                                                if (!this.pieces[p].block) {
                                                    if (this.pieces[p].captain) {//     stick
                                                        this.pieces[p].move[0] *= -1;
                                                        this.pieces[p].move[1] *= -1;
                                                        this.pieces[p].moved = true;
                                                    }
                                                    else {//    take
                                                        pieceTaken = true;
                                                    }
                                                }
                                            }
                                            else {
                                                //  *
                                                if (!this.pieces[p].block && this.pieces[p].cardinal && this.pieces[p].diagonal && !this.pieces[p].captain) {//    stick
                                                    this.pieces[p].move[0] *= -1;
                                                    this.pieces[p].move[1] *= -1;
                                                    this.pieces[p].moved = true;
                                                }
                                            }
                                        }
                                        else {
                                            //  +
                                            if (!this.pieces[p].block && this.pieces[p].cardinal && !this.pieces[p].captain) {
                                                if (this.pieces[p].diagonal) {//    take
                                                    pieceTaken = true;
                                                }
                                                else {//    stick
                                                    this.pieces[p].move[0] *= -1;
                                                    this.pieces[p].move[1] *= -1;
                                                    this.pieces[p].moved = true;
                                                    
                                                }
                                            }
                                        }
                                    }
                                    else {
                                        //  x
                                        if (!this.pieces[p].block && !this.pieces[p].captain) {
                                            if (this.pieces[p].cardinal) {//    take
                                                pieceTaken = true;
                                            }
                                            else {//    stick
                                                this.pieces[p].move[0] *= -1;
                                                this.pieces[p].move[1] *= -1;
                                                this.pieces[p].moved = true;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            if (pieceTaken) {
                this.pieces.splice(p,1);
                p--;
            }
        }
    }
    
    this.secondaryCollision = function(player) {
        for (var p=0; p<this.pieces.length; p++) {
            var pieceTaken = false;
            
            if (this.pieces[p].location.x >= 0 && this.pieces[p].location.x < board.size && this.pieces[p].location.y >= 0 && this.pieces[p].location.y < board.size) {
                if (this.pieces[p].move.join() != "0,0") {
                    for (var sp=0; sp<self.pieces.length; sp++) {
                        if (player > -1 || sp != p) {
                            if (self.pieces[sp].location.x == this.pieces[p].location.x && self.pieces[sp].location.y == this.pieces[p].location.y) {
                                pieceTaken = true;
                            }
                        }
                    }
                    
                    if (!pieceTaken) {
                        for (var o=0; o<others.length; o++) {
                            for (var op=0; op<others[o].pieces.length; op++) {
                                if (player != o || op != p) {
                                    if (others[o].pieces[op].location.x == this.pieces[p].location.x && others[o].pieces[op].location.y == this.pieces[p].location.y) {
                                        pieceTaken = true;
                                    }
                                }
                            }
                        }
                    }
                }
                else if (!this.pieces[p].block && this.pieces[p].cardinal && this.pieces[p].diagonal && !this.pieces[p].captain) {
                    for (var sp=0; sp<self.pieces.length; sp++) {
                        if (player > -1 || sp != p) {
                            if (self.pieces[sp].location.x == this.pieces[p].location.x && self.pieces[sp].location.y == this.pieces[p].location.y && self.pieces[sp].move.join() != "0,0") {
                                this.pieces[p].upgraded = true;
                            }
                        }
                    }
                    
                    if (!pieceTaken) {
                        for (var o=0; o<others.length; o++) {
                            for (var op=0; op<others[o].pieces.length; op++) {
                                if (player != o || op != p) {
                                    if (others[o].pieces[op].location.x == this.pieces[p].location.x && others[o].pieces[op].location.y == this.pieces[p].location.y && others[o].pieces[op].move.join() != "0,0") {
                                        this.pieces[p].upgraded = true;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            else {
                pieceTaken = true;
            }
            
            if (pieceTaken) {
                this.pieces[p].taken = true;
            }
        }
    }
    
    this.display = function() {
        for (var p=0; p<this.pieces.length; p++) {
            this.pieces[p].display(this.team);
        }
    }
    
    //TBA
}

//--------------------------------------------------------------------- PIECE CLASS

function Piece(loc, typ, dia, car) {
    this.location = new p5.Vector(loc[0],loc[1]);
    this.block = typ;
    this.diagonal = dia;
    this.cardinal = car;
    this.captain = false;
    this.upgraded = false;
    this.touched = false;
    this.canPress = true;
    this.enabled = false;
    this.moved = false;
    this.taken = false;
    this.move = [0,0];
    
    this.display = function(team) { // The team variable is just the player's position in the game line-up (self: red, others: blue,green,yellow)
        push();
        if (this.block) {
            if (this.move.join() != "0,0" && turn < 2) {
                fill(team[0],team[1],team[2],90);
                noStroke();
            }
            else {
                if (this.enabled || this.touched) {
                    fill(team[0]*2,team[1]*2,team[2]*2);
                }
                else {
                    fill(team[0],team[1],team[2]);
                }
                
                stroke(team[0]*2,team[1]*2,team[2]*2);
            }
            strokeWeight(4);
        }
        else {
            noFill();
            if (this.move.join() != "0,0" && turn < 2) {
                stroke(team[0],team[1],team[2],90);
            }
            else if (this.enabled || this.touched) {
                stroke(team[0]*2,team[1]*2,team[2]*2);
            }
            else {
                stroke(team[0]*1.25,team[1]*1.25,team[2]*1.25);
            }
            strokeWeight(8);
        }
        
        var diameter = board.diameter / board.size;
        var absoluteLocation = new p5.Vector((width/2 - board.diameter/2) + (this.location.x * diameter) + diameter/2,(height/2 - board.diameter/2) + (this.location.y * diameter) + diameter/2);
        
        if ((turn == 2 || turn == 4) && animator > 20) {
            var displacement = new p5.Vector(this.move[0] * diameter,this.move[1] * diameter);
            displacement.mult((animator-20)/100);
            absoluteLocation.add(displacement);
        }
        
        translate(absoluteLocation.x,absoluteLocation.y);
        
        if (this.enabled) {
            diameter *= 1.2;
        }
        else if (this.move.join() != "0,0") {
            diameter *= 0.9;
        }
        if (this.block) {
            if (this.diagonal) {
                if (this.cardinal) {
                    ellipseMode(CENTER);
                    ellipse(0,0,diameter*0.5,diameter*0.5);
                    // o
                }
                else {
                    translate(0,0.5*diameter*0.1);
                    
                    beginShape();
                    vertex(0,-0.5*diameter*0.5);
                    vertex(0.5*diameter*0.43,0.5*diameter*0.25);
                    vertex(-0.5*diameter*0.43,0.5*diameter*0.25);
                    endShape(CLOSE);
                    // ∆
                }
            }
            else {
                rectMode(CENTER);
                rect(0,0,diameter*0.5,diameter*0.5);
                // #
            }
        }
        else {
            if (this.diagonal) {
                if (this.cardinal) {
                    if (this.captain) {
                        line(-0.5*diameter*0.5,0,0.5*diameter*0.5,0);
                        line(0,-0.5*diameter*0.5,0,0.5*diameter*0.5);
                        line(-0.5*diameter*0.35,-0.5*diameter*0.35,0.5*diameter*0.35,0.5*diameter*0.35);
                        line(0.5*diameter*0.35,-0.5*diameter*0.35,-0.5*diameter*0.35,0.5*diameter*0.35);
                        ellipseMode(CENTER);
                        strokeWeight(4);
                        ellipse(0,0,diameter*0.4,diameter*0.4);
                        // ©
                    }
                    else {
                        line(-0.5*diameter*0.5,0,0.5*diameter*0.5,0);
                        line(0,-0.5*diameter*0.5,0,0.5*diameter*0.5);
                        line(-0.5*diameter*0.35,-0.5*diameter*0.35,0.5*diameter*0.35,0.5*diameter*0.35);
                        line(0.5*diameter*0.35,-0.5*diameter*0.35,-0.5*diameter*0.35,0.5*diameter*0.35);
                        // *
                    }
                }
                else {
                    line(-0.5*diameter*0.35,-0.5*diameter*0.35,0.5*diameter*0.35,0.5*diameter*0.35);
                    line(0.5*diameter*0.35,-0.5*diameter*0.35,-0.5*diameter*0.35,0.5*diameter*0.35);
                    // x
                }
            }
            else {
                line(-0.5*diameter*0.5,0,0.5*diameter*0.5,0);
                line(0,-0.5*diameter*0.5,0,0.5*diameter*0.5);
                // +
            }
        }
        pop();
        
        if (turn == 0 || turn == 1) {
            push();
            diameter = board.diameter / board.size;
            noFill();
            stroke(team[0]*2,team[1]*2,team[2]*2);
            strokeWeight(8);
            translate((width/2 - board.diameter/2) + (this.location.x * diameter) + diameter/2,(height/2 - board.diameter/2) + (this.location.y * diameter) + diameter/2);
            if (this.move.join() != "0,0") {
                line(0,0,this.move[0]*diameter*0.5,this.move[1]*diameter*0.5);
                
                var fin = new p5.Vector(this.move[0]*diameter*0.5,this.move[1]*diameter*0.5);
                fin.normalize();
                fin.mult(-1);
                var angle = fin.heading();
                translate(this.move[0]*diameter*0.5,this.move[1]*diameter*0.5);
                
                fin = p5.Vector.fromAngle(angle + 3.1415*0.25);
                fin.mult(0.125*diameter);
                line(0,0,fin.x,fin.y);
                fin = p5.Vector.fromAngle(angle - 3.1415*0.25);
                fin.mult(0.125*diameter);
                line(0,0,fin.x,fin.y);
            }
            pop();
        }
    }
    
    this.enable = function() {
        if (turn > 1) {
            this.touched = false;
            this.enabled = false;
        }
        else {
            var diameter = board.diameter / board.size;
            var distance = new p5.Vector(mouseX,mouseY);
            distance.sub((width/2 - board.diameter/2) + (this.location.x * diameter) + diameter/2,(height/2 - board.diameter/2) + (this.location.y * diameter) + diameter/2);
            
            if (distance.mag() < 0.3*diameter) {
                this.touched = true;
            }
            else {
                this.touched = false;
            }
            
            if (this.touched && (mouseIsPressed || touchIsDown) && this.canPress) {
                if (this.enabled) {
                    this.enabled = false;
                }
                else {
                    this.enabled = true;
                }
                this.canPress = false;
            }
            else if (!mouseIsPressed && !touchIsDown) {
                this.canPress = true;
            }
        }
    }
    
    this.aim = function(overlaps) {
        var diameter = board.diameter / board.size;
        var absoluteLocation = new p5.Vector((width/2 - board.diameter/2) + (this.location.x * diameter) + diameter/2,(height/2 - board.diameter/2) + (this.location.y * diameter) + diameter/2);
        var target = new p5.Vector(0,0);
        var test = "";
        
        if (this.diagonal) {
            test = str(this.location.x+1) + "," + str(this.location.y-1);
            if (overlaps.indexOf(test) == -1 && (this.location.x+1 < board.size && this.location.x+1 > -1) && (this.location.y-1 < board.size && this.location.y-1 > -1)) {
                target.set(absoluteLocation.x + diameter,absoluteLocation.y - diameter);
                
                push();
                translate(target.x,target.y);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [1,-1];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
            test = str(this.location.x+1) + "," + str(this.location.y+1);
            if (overlaps.indexOf(test) == -1 && (this.location.x+1 < board.size && this.location.x+1 > -1) && (this.location.y+1 < board.size && this.location.y+1 > -1)) {
                target.set(absoluteLocation.x + diameter,absoluteLocation.y + diameter);
                
                push();
                translate(absoluteLocation.x + diameter,absoluteLocation.y + diameter);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [1,1];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
            test = str(this.location.x-1) + "," + str(this.location.y+1);
            if (overlaps.indexOf(test) == -1 && (this.location.x-1 < board.size && this.location.x-1 > -1) && (this.location.y+1 < board.size && this.location.y+1 > -1)) {
                target.set(absoluteLocation.x - diameter,absoluteLocation.y + diameter);
                
                push();
                translate(absoluteLocation.x - diameter,absoluteLocation.y + diameter);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [-1,1];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
            test = str(this.location.x-1) + "," + str(this.location.y-1);
            if (overlaps.indexOf(test) == -1 && (this.location.x-1 < board.size && this.location.x-1 > -1) && (this.location.y-1 < board.size && this.location.y-1 > -1)) {
                target.set(absoluteLocation.x - diameter,absoluteLocation.y - diameter);
                
                push();
                translate(absoluteLocation.x - diameter,absoluteLocation.y - diameter);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [-1,-1];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
        }
        if (this.cardinal) {
            test = str(this.location.x) + "," + str(this.location.y-1);
            if (overlaps.indexOf(test) == -1 && (this.location.x < board.size && this.location.x > -1) && (this.location.y-1 < board.size && this.location.y-1 > -1)) {
                target.set(absoluteLocation.x,absoluteLocation.y - diameter);
                
                push();
                translate(absoluteLocation.x,absoluteLocation.y - diameter);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [0,-1];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
            test = str(this.location.x+1) + "," + str(this.location.y);
            if (overlaps.indexOf(test) == -1 && (this.location.x+1 < board.size && this.location.x+1 > -1) && (this.location.y < board.size && this.location.y > -1)) {
                target.set(absoluteLocation.x + diameter,absoluteLocation.y);
                
                push();
                translate(absoluteLocation.x + diameter,absoluteLocation.y);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [1,0];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
            test = str(this.location.x) + "," + str(this.location.y+1);
            if (overlaps.indexOf(test) == -1 && (this.location.x < board.size && this.location.x > -1) && (this.location.y+1 < board.size && this.location.y+1 > -1)) {
                target.set(absoluteLocation.x,absoluteLocation.y + diameter);
                
                push();
                translate(absoluteLocation.x,absoluteLocation.y + diameter);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [0,1];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
            test = str(this.location.x-1) + "," + str(this.location.y);
            if (overlaps.indexOf(test) == -1 && (this.location.x-1 < board.size && this.location.x-1 > -1) && (this.location.y < board.size && this.location.y > -1)) {
                target.set(absoluteLocation.x - diameter,absoluteLocation.y);
                
                push();
                translate(absoluteLocation.x - diameter,absoluteLocation.y);
                rectMode(CENTER);
                if (mouseX > target.x-diameter*0.5 && mouseX < target.x+diameter*0.5 && mouseY > target.y-diameter*0.5 && mouseY < target.y+diameter*0.5) {
                    if (mouseIsPressed || touchIsDown) {
                        this.enabled = false;
                        this.move = [-1,0];
                    }
                    fill(255,60);
                }
                else {
                    fill(180,60);
                }
                noStroke();
                rect(0,0,diameter,diameter);
                pop();
            }
        }
    }
    
    this.update = function() {
        this.location.x += this.move[0];
        this.location.y += this.move[1];
    }
}

//--------------------------------------------------------------------- OVERRIDES

function mouseReleased() {
    if (stage == 0) {
        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
            document.getElementById("shuffle").style.width = "90%";
            document.getElementById("shuffle").style.height = "90%";
            resizeCanvas(windowWidth*0.9, windowHeight*0.9);
            
            window.scrollTo(0,10000);
            
            stage = 1;
        }
    }
}

function windowResized() {
    if (stage > 0) {
        document.getElementById("shuffle").style.width = "90%";
        document.getElementById("shuffle").style.height = "90%";
        resizeCanvas(windowWidth*0.9, windowHeight*0.9);
        
        window.scrollTo(0,10000);
    }
    else {
        document.getElementById("shuffle").style.width = "200px";
        document.getElementById("shuffle").style.height = "200px";
        resizeCanvas(200,200);
    }
}

function over() {
    if (stage == 0) {
        document.getElementById("shuffle").style.width = "400px";
        document.getElementById("shuffle").style.height = "200px";
        resizeCanvas(400,200);
    }
}

function out() {
    if (stage == 0) {
        document.getElementById("shuffle").style.width = "200px";
        document.getElementById("shuffle").style.height = "200px";
        resizeCanvas(200,200);
    }
}

function mouseWheel() {
    if (stage > 0) {
        return false;
    }
}

function touchMoved() {
    if (stage > 0) {
        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
            return false;
        }
    }
}

function touchStarted() {
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        return false;
    }
}

function touchEnded() {
    if (stage == 0) {
        if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
            document.getElementById("shuffle").style.width = "90%";
            document.getElementById("shuffle").style.height = "90%";
            resizeCanvas(windowWidth*0.9, windowHeight*0.9);
            
            window.scrollTo(0,10000);
            
            stage = 1;
        }
    }
    
    if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
        return false;
    }
}