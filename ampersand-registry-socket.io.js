var io = require('socket.io-client');
var logger = require('andlog');
var Registry = require('ampersand-registry');
var util = require('util');
var _ = require('underscore');

// SocketRegistry
// --------------

// Extends the base ampersand-registry Registry class by adding optional socket.io support

// Creates a new instance of Registry and initializes a socket client to listen for changes to
// registered models.
function SocketRegistry(options) {
  options = options || {};
  if (options.socket) {
    this.socketEnabled = true;
    var socketHost = options.socket.host;
    var socketOptions = options.socket.options;

    this.handleSocketEvent = _.bind(this.handleSocketEvent, this);
    this.socket = io(socketHost, socketOptions);
    this.socket.on('connect', function () {
      logger.info('Socket.io listening on: ' + socketHost);
    });
    this.socket.on('disconnect', function () {
      logger.info('Socket.io disconnected from: ' + socketHost);
    });
    this.socket.on('connect_error', function (err) {
      logger.error('Socket.io connection error', err);
    });
    this.socket.on('connect_timeout', function () {
      logger.warn('Socket.io connection timeout');
    });
    this.socket.on('reconnect', function () {
      logger.info('Socket.io successful reconnect');
    });
    this.socket.on('reconnect', function (num) {
      logger.info('Socket.io successful reconnect on attempt: ' + num);
    });
    this.socket.on('reconnect_attempt', function (num) {
      logger.info('Socket.io reconnect attempt: ' + num);
    });
    this.socket.on('reconnecting', function () {
      logger.info('Socket.io attempting reconnect');
    });
    this.socket.on('reconnect_error', function (err) {
      logger.error('Socket.io reconnect error', err);
    });
    this.socket.on('reconnect_failed', function () {
      logger.error('Socket.io reconnection failed');
    });
  } else {
    this.socketEnabled = false;
  }

  Registry.call(this);
}

util.inherits(SocketRegistry, Registry);

// Add a model to the cache if it has not already been set
SocketRegistry.prototype.store = function (model) {
  (Array.isArray(model) ? model : [model]).forEach(function (model) {
      var ns = model.getNamespace();
      var type = model.getType && model.getType() || model.type;
      var id = model.getId();
      var cache = this._getCache(ns);
      var key = type + id;
      if (!type) {
        throw Error('Models must have "modelType" attribute or "getType" method to store in registry');
      }
      // Prevent overriding a previously stored model
      cache[key] = cache[key] || model;
      this.socket.on(ns + ':' + type + ':' + id, this.handleSocketEvent);
  }, this);
  return this;
};

SocketRegistry.prototype.handleSocketEvent = function (data) {
  var ns = data.ns;
  var type = data.type;
  var id = data.id;

  switch (data.action) {
  case 'update':
    var model = this.lookup(type, id, ns);
    for (var key in data.data) {
      if (data.data.hasOwnProperty(key)) {
        model[key] = data.data[key];
      }
    }
    break;
  case 'remove':
    this.remove(type, id, ns);
    break;
  }
};

SocketRegistry.prototype.remove = function (type, id, ns) {
    var cache = this._getCache(ns);
    if (this.lookup.apply(this, arguments)) {
        delete cache[type + id];
        this.socket.off(ns + ':' + type + ':' + id, this.handleSocketEvent);
        return true;
    }
    return false;
};

module.exports = SocketRegistry;
