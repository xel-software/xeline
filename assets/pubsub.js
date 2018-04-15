const EventEmitter = require('events').EventEmitter
global.pubsub = new EventEmitter();

exports.pubsub = global.pubsub;