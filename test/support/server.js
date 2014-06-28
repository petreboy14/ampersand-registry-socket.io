var Hapi = require('hapi');

var server = new Hapi.Server('localhost', 3000);
var io = require('socket.io')(server.listener);

io.on('connection', function (socket) {
  socket.emit('ping', 'pong');
});

exports.start = function (cb) {
  server.start(cb);
};

exports.stop = function (cb) {
  server.stop(cb);
};
