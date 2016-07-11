var express = require('express');
var socket = require('socket.io');
var app = express();

var port = process.env.OPENSHIFT_NODEJS_PORT || 8080;
var ip = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
var server = app.listen(port,ip);   //settings for listening on the openshift server
//var server = app.listen(8080);    //settings for testing on home computer

app.use(express.static('public'));
var io = socket(server);

console.log("\n\n>>  http://shuffle-ojpgapps.rhcloud.com/");
console.log("\n>>  Server will send and communicate with shuffle-client.js.\n");

io.sockets.on('connection', communicate);   //put all server responses in communicate()

var games = new Array(0);
var visitors = 0;

for (var i=0; i<20; i++) {
    games.push(new Game(3));
    games[i].addPlayer(i,i.toString());
}

function communicate(connection) {
    console.log("CONNECTION");
    
    connection.on('connect', function() {
                  visitors++;
                  });
    connection.on('disconnect', function() {
                  visitors--;
                  });
    connection.emit('visitors', io.sockets.clients().length());
    
    connection.on('join', onJoin);
    connection.on('game', onGame);
    connection.on('move', onMove);
    connection.on('done', onDone);
    connection.on('leave', onLeave);
    connection.on('stay', onStay);
    
    function onJoin(data) {
        var addressed = false;
        var named = false;
        
        for (var i=0; i<games.length; i++) {
            for (var p=0; p<games[i].players.length && !addressed && !named; p++) {
                if (games[i].players[p].name == data.name) {
                    named = true;
                }
                else if (games[i].players[p].address == data.address) {
                    addressed = true;
                }
            }
        }
        
        if (addressed) {
            connection.emit('address');
        }
        else if (named) {
            connection.emit('name');
        }
        else {
            connection.emit('join', games);
            console.log(data.name + " is a known player.");
        }
    }
    
    function onGame(data) {
        var gameIndex = -1;
        var foundGame = false;
        var inGame = -1;
        var newInfo = false;
        
        for (var i=0; i<games.length; i++) {
            if (games[i].address == data.game) {
                gameIndex = i;
            }
        }
        
        if (gameIndex > -1 && gameIndex < games.length) {
            if (!games[gameIndex].full) {
                for (var p=0; p<games[gameIndex].players.length; p++) {
                    if (games[gameIndex].players[p].address == data.address) {
                        inGame = gameIndex;
                    }
                }
                
                if (inGame == -1) {
                    games[gameIndex].addPlayer(data.address,data.name);
                    foundGame = true;
                    inGame = gameIndex;
                    newInfo = true;
                }
            }
            else {
                for (var p=0; p<games[gameIndex].players.length; p++) {
                    if (games[gameIndex].players[p].address == data.address) {
                        inGame = gameIndex;
                    }
                }
                
                if (inGame == gameIndex) {
                    foundGame = true;
                    
                    if (!games[gameIndex].initialized) {
                        games[gameIndex].initialize();
                        console.log("Game: (" + games[gameIndex].address + ")");
                        for (var i=0; i<games[gameIndex].players.length; i++) {
                            console.log("\t" + i + ": " + games[gameIndex].players[i].name);
                            for (var p=0; p<games[gameIndex].players[i].pieces.length; p++) {
                                console.log("\t\t" + games[gameIndex].players[i].pieces[p].location[0] + "," + games[gameIndex].players[i].pieces[p].location[1]);
                            }
                        }
                    }
                    var response = {
                        game: data.game,
                        players: games[gameIndex].players
                    }
                    io.sockets.emit('game', response);
                }
            }
        }
        else {
            for (var i=0; i<games.length && !foundGame && inGame == -1; i++) {
                for (var p=0; p<games[i].players.length; p++) {
                    if (games[i].players[p].address == data.address) {
                        inGame = i;
                    }
                }
                
                if (games[i].full && inGame == i) {
                    foundGame = true;
                    
                    if (!games[gameIndex].initialized) {
                        games[gameIndex].initialize();
                        console.log("Game: (" + games[gameIndex].address + ")");
                        for (var i=0; i<games[gameIndex].players.length; i++) {
                            console.log("\t" + i + ": " + games[gameIndex].players[i].name);
                            for (var p=0; p<games[gameIndex].players[i].pieces.length; p++) {
                                console.log("\t\t" + games[gameIndex].players[i].pieces[p].location[0] + "," + games[gameIndex].players[i].pieces[p].location[1]);
                            }
                        }
                    }
                    var response = {
                        game: games[inGame].address,
                        players: games[i].players
                    }
                    io.sockets.emit('game', response);
                }
                else if (!games[i].full && inGame == -1 && games[i].size == data.size) {
                    foundGame = true;
                    inGame = i;
                    games[i].addPlayer(data.address,data.name);
                    newInfo = true;
                }
            }
            if (!foundGame && inGame == -1 && data.size > 1) {
                games.push(new Game(data.size));
                games[games.length-1].addPlayer(data.address,data.name);
                newInfo = true;
            }
        }
        
        if (newInfo) {
            io.sockets.emit('update',games);
            
            console.log(data.name + " joined the Shuffle lobby.");
            
            console.log("Games: (" + games.length + ")");
            for (var i=0; i<games.length; i++) {
                console.log("\t" + i + ": " + games[i].full + " (" + games[i].players.length + "/" + games[i].size + ")");
                for (var p=0; p<games[i].players.length; p++) {
                    console.log("\t\t" + games[i].players[p].name + " [" + games[i].players[p].address + "]");
                }
            }
        }
    }
    
    function onMove(data) {
        var gameIndex = -1;
        for (var i=0; i<games.length; i++) {
            if (games[i].address == data.game) {
                gameIndex = i;
            }
        }
        
        if (gameIndex > -1) {
            for (var p=0; p<games[gameIndex].players.length; p++) {
                if (games[gameIndex].players[p].address == data.address) {
                    console.log(games[gameIndex].players[p].name + " moved.");
                    games[gameIndex].players[p].move(data.move);                                                                     //Move pieces initially
                }
            }
            if (games[gameIndex].turnStart()) {
                console.log("turnStart for game " + games[gameIndex].address);
                
                var moves = [];
                for (var i=0; i<games[gameIndex].players.length; i++) {
                    var player = {
                        address: games[gameIndex].players[i].address,
                        pieces: games[gameIndex].players[i].pieces
                    }
                    
                    moves.push(player);
                }
                
                var response = {
                    game: data.game,
                    players: moves
                }
                io.sockets.emit('move', response);
            }
        }
    }
    
    function onDone(data) {
        var gameIndex = -1;
        for (var i=0; i<games.length; i++) {
            if (games[i].address == data.game) {
                gameIndex = i;
            }
        }
        
        if (gameIndex > -1) {
            for (var p=0; p<games[gameIndex].players.length; p++) {
                if (games[gameIndex].players[p].address == data.address && games[gameIndex].players[p].ready) {
                    games[gameIndex].players[p].move(data.move);                                                    //Move pieces after analysis
                    games[gameIndex].players[p].ready = false;
                }
            }
            
            if (games[gameIndex].turnEnd()) {
                var eliminations = games[gameIndex].eliminate();
                for (var i=0; i<eliminations.length; i++) {
                    var response = {
                        game: games[gameIndex].address,
                        address: eliminations[i],
                        reason: 1
                    }
                    if (eliminations.length == games[gameIndex].players.length) {
                        response.reason = 2;
                    }
                    
                    io.sockets.emit('leave', response);
                }
                
                if (games[gameIndex].players.length == 1) {
                    var response = {
                        game: games[gameIndex].address,
                        winner: games[gameIndex].players[0].name
                    }
                    
                    io.sockets.emit('end', response);
                }
                else if (games[gameIndex].players.length > 1) {
                    io.sockets.emit('done', games[gameIndex].address);
                }
                else {
                    games.splice(gameIndex,1);
                    io.sockets.emit('update',games);
                }
            }
            else {
                var response = {
                    game: data.game,
                    move: games[gameIndex].players
                }
                
                io.sockets.emit('move', response);
            }
        }
    }
    
    function onLeave(data) {
        var found = false;
        
        var gameIndex = -1;
        for (var i=0; i<games.length; i++) {
            if (games[i].address == data.game) {
                gameIndex = i;
            }
        }
        
        if (gameIndex > -1) {
            for (var p=0; p<games[gameIndex].players.length && !found; p++) {
                if (games[gameIndex].players[p].address == data.address) {
                    games[gameIndex].players.splice(p,1);
                    p--;
                    found = true;
                }
            }
            
            if (found) {
                if (games[gameIndex].players.length == 1) {
                    var response = {
                        game: data.game,
                        winner: games[gameIndex].players[0].name
                    }
                    
                    io.sockets.emit('end', response);
                }
                else if (games[gameIndex].players.length == 0) {
                    games.splice(gameIndex,1);
                    
                    io.sockets.emit('update',games);
                }
                
                console.log(data.address + " left game " + data.game);
            }
        }
        else {
            for (var i=0; i<games.length && !found; i++) {
                if (games[i].players.length == 1 && games[i].players[0].address == data.address) {
                    console.log(games[i].players[0].name + " left the Shuffle lobby.");
                    games.splice(i,1);
                    i--;
                    found = true;
                    
                    io.sockets.emit('update',games);
                }
                else {
                    for (var p=0; p<games[i].players.length && !found; p++) {
                        if (games[i].players[p].address == data.address) {
                            console.log(games[i].players[p].name + " left the Shuffle lobby.");
                            games[i].players.splice(p,1);
                            p--;
                            found = true;
                            
                            io.sockets.emit('update',games);
                        }
                    }
                }
            }
        }
        
        if (!found) {
            console.log("Client @" + data.address + " left without joining.");
        }
        
        var response = {
            game: data.game,
            address: data.address,
            reason: 0
        }
        
        io.sockets.emit('leave', response);
    }
    
    function onStay(data) {
        var gameIndex = -1;
        for (var i=0; i<games.length; i++) {
            if (games[i].address == data.game) {
                gameIndex = i;
            }
        }
        games[gameIndex].age = 0;
        
        if (gameIndex > -1) {
            var inGame = false;
            
            for (var p=0; p<games[gameIndex].players.length; p++) {
                if (games[gameIndex].players[p].address == data.address) {
                    games[gameIndex].players[p].age = 0;
                    inGame = true;
                }
                else {
                    games[gameIndex].players[p].age += 1/games[gameIndex].players.length;
                }
            }
            
            if (!inGame) {
                console.log("Player @" + data.address + " is dead.");
                var response = {
                    game: data.game,
                    address: data.address,
                    reason: 1
                }
                io.sockets.emit('leave', response);
            }
        }
        else {
            var response = {
                game: -1,
                address: data.address,
                reason: 0
            }
            connection.emit('leave',response)
        }
        
        for (var i=0; i<games.length; i++) {
            games[i].age++;
            
            if ((games[i].players.length == 1 && games[i].players[0].age > 600) || games[i].age > 700) {
                console.log("Game " + games[i].address + " turned stale.");
                var response = {
                    game: games[i].address,
                    address: -1,
                    reason: 0
                }
                io.sockets.emit('leave', response);
                
                if (games[i].age > 800) {
                    games.splice(i,1);
                    i--;
                    io.sockets.emit('update',games);
                }
            }
//            else {
//                for (var p=0; p<games[i].players.length; p++) {
//                    if (games[i].players[p].age > 1200) {
//                        console.log("Player " + games[i].players[p].name + " turned stale.");
//                        
//                        var response = {
//                            game: games[i].address,
//                            address: games[i].players[p].address,
//                            reason: 0
//                        }
//                        io.sockets.emit('leave', response);
//                        
//                        if (games[i].players[p].age > 1300) {
//                            games[i].players.splice(p,1);
//                            p--;
//                            io.sockets.emit('update',games);
//                        }
//                    }
//                }
//            }
        }
    }
}


function Game(siz) {
    this.address = Math.floor(Math.random()*100000000);
    this.age = 0;
    this.full = false;
    this.size = siz;
    this.players = [];
    this.nods = [];
    this.initialized = false;
    
    this.addPlayer = function(add,nam) {
        this.players.push(new Player(add,nam));
        
        if (this.players.length == this.size) {
            this.full = true;
        }
    }
    
    this.initialize = function() {
        this.initialized = true;
        
        for (var p=0; p<this.players.length; p++) {
            var x = Math.floor(Math.random()*(this.size+2));
            var y = Math.floor(Math.random()*(this.size+2));
            while (this.overlap(x,y)) {
                x = Math.floor(Math.random()*(this.size+2));
                y = Math.floor(Math.random()*(this.size+2));
            }
            this.players[p].place(x,y,true,true,true);  // O
        
            x = Math.floor(Math.random()*(this.size+2));
            y = Math.floor(Math.random()*(this.size+2));
            while (this.overlap(x,y)) {
                x = Math.floor(Math.random()*(this.size+2));
                y = Math.floor(Math.random()*(this.size+2));
            }
            this.players[p].place(x,y,true,false,true);  // #
        
            x = Math.floor(Math.random()*(this.size+2));
            y = Math.floor(Math.random()*(this.size+2));
            while (this.overlap(x,y)) {
                x = Math.floor(Math.random()*(this.size+2));
                y = Math.floor(Math.random()*(this.size+2));
            }
            this.players[p].place(x,y,true,true,false);  // ∆
            
            x = Math.floor(Math.random()*(this.size+2));
            y = Math.floor(Math.random()*(this.size+2));
            while (this.overlap(x,y)) {
                x = Math.floor(Math.random()*(this.size+2));
                y = Math.floor(Math.random()*(this.size+2));
            }
            this.players[p].place(x,y,false,true,true);  // *
            
            x = Math.floor(Math.random()*(this.size+2));
            y = Math.floor(Math.random()*(this.size+2));
            while (this.overlap(x,y)) {
                x = Math.floor(Math.random()*(this.size+2));
                y = Math.floor(Math.random()*(this.size+2));
            }
            this.players[p].place(x,y,false,false,true);  // +
            
            x = Math.floor(Math.random()*(this.size+2));
            y = Math.floor(Math.random()*(this.size+2));
            while (this.overlap(x,y) || (x == 0 && (y == 0 || y == this.size+1)) || (x == this.size+1 && (y == 0 || y == this.size+1))) {
                x = Math.floor(Math.random()*(this.size+2));
                y = Math.floor(Math.random()*(this.size+2));
            }
            this.players[p].place(x,y,false,true,false);  // x
        }
    }
    
    this.overlap = function(x,y) {
        var overlapped = false;
        
        for (var p=0; p<this.players.length; p++) {
            for (var i=0; i<this.players[p].pieces.length; i++) {
                if (this.players[p].pieces[i].location[0] == x && this.players[p].pieces[i].location[1] == y) {
                    overlapped = true;
                }
            }
        }
        
        return overlapped;
    }
    
    this.turnStart = function() {
        var start = true;
        
        for (var p=0; p<this.players.length; p++) {
            if (!this.players[p].ready) {
                start = false;
            }
        }
        
        return start;
    }
    
    this.turnEnd = function() {
        var end = true;
        
        for (var p=0; p<this.players.length; p++) {
            if (this.players[p].ready) {
                end = false;
            }
        }
        
        return end;
    }
    
    this.eliminate = function() {
        var eliminations = []
        
        for (var p=0; p<this.players.length; p++) {
            if (this.players[p].pieces.length < 4) {
                eliminations.push(this.players[p].address);
                
                this.players.splice(p,1);
                p--;
            }
        }
        
        return eliminations;
    }
    
    this.nod = function(address) {
        if (this.nods.length > 0) {
            var nodded = false;
            
            for (var n=0; n<this.nods.length; n++) {
                if (this.nods[n] == address) {
                    nodded = true;
                }
            }
            
            if (!nodded) {
                this.nods.push(address);
            }
        }
        else {
            this.nods.push(address);
        }
    }
}

function Player(add,nam) {
    this.address = add;
    this.name = nam;
    this.age = 0.0;
    this.ready = false;
    this.pieces = [];
    
    this.place = function(x,y,t,d,c) {
        this.pieces.push(new Piece(x,y,t,d,c));
    }
    
    this.move = function(mov) {
        this.pieces = mov;
        this.ready = true;
    }
}

function Piece(x, y, typ, dia, car) {
    this.location = [x,y];
    this.block = typ;
    this.diagonal = dia;
    this.cardinal = car;
}
