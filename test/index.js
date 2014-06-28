var Lab = require('lab');

var describe = Lab.experiment;
var it = Lab.test;
var before = Lab.before;
var after = Lab.after;

var should = require('should');

var server = require('./support/server');
var SocketRegistry = require('../ampersand-registry-socket.io');

describe('ampersand-registry-socket.io tests', function () {
  before(function (done) {
    server.start(done);
  });

  after(function (done) {
    server.stop(done);
  });

  it('should be able to initialize a registry without socket.io', function (done) {
    new SocketRegistry();
    done();
  });

  it('should be able to initialize a registry with socket.io', function (done) {
    var registry = new SocketRegistry({
      socket: {
        host: 'http://localhost:3000'
      }
    });
    registry.socket.once('ping', function (data) {
      data.should.equal('pong');
      done();
    });
  });
});
