// Setup basic express server
var express = require('express');
var app = express();
var request = require('request');
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var Client = require('node-rest-client').Client;
var client = new Client();

const pug = require('pug');

app.set('views', __dirname + '/view');
app.set('view engine', 'pug');

server.listen(port, () => {
  console.log('Server listening at port %d', port);
});

// Routing
app.use(express.static(path.join(__dirname, 'public')));

app.get('/ban', function(req, res){
    
    if(req.query.admin == 'Kevin'){
        res.render('elencoUtentiBan', {users: userBanWord});
        if(req.query.ban){
            console.log("denytro");
            io.on('connection', (socket) => {
                console.log("c");
                socket.broadcast.emit('ban', {
                  username: req.query.ban
                });
            });
           //banUser(req.query.ban);
        }
    }else{
        res.send('Pagina non trovata');
    }
    
});


var userBanWord = [];

var n = 1;
var i = 0;

// Chatroom
io.on('connection', (socket) => {
    
  function banUser(username) {
      
    socket.broadcast.emit('ban', {
      username: username
    });
    
  }
    
  var addedUser = false;
  
  if(i == 0){
      setInterval(banner, 3000);
      i = 1;
  }

  
  function banner() {
    
    n++;
    
    socket.broadcast.emit('change banner', {
      n : n
    });
    
    if(n == 3){
        n = 0;
    }
      
  }
  
  socket.on('ban word', (data) => {
     
     if(userBanWord.indexOf(data) < 0 ){
        userBanWord.push(data);
     }
     
  });
  
  // when the client emits 'new message', this listens and executes
  socket.on('new message', (data) => {
    request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:     'http://kevinsolimo.altervista.org/socketIo/rest.php',
      body:    "message="+data+"&user=" + socket.username +""
    }, function(error, response, body){
        console.log(body.toString());
      if(body.toString().includes("1")){
        socket.broadcast.emit('new message', {
          username: socket.username,
          message: data
        });
      }
    });
    
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', (username) => {
    if (addedUser) return;

    // we store the username in the socket session for this client
    socket.username = username;
    addedUser = true;
    socket.emit('login', {});
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username
    });
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    if (addedUser) {

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username
      });
    }
  });
});

