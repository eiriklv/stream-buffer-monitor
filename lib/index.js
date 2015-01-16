var TransformStream = require('stream').Transform;
var util = require('util');
var debug = require('debug')('stream-buffer-monitor');

// States
var NORMAL = 0;
var HIGH_AND_INCREASING = 1;
var HIGH_AND_DECREASING = 2;

util.inherits(BufferMonitor, TransformStream);

function BufferMonitor(opts) {
  if (!(this instanceof BufferMonitor))
    return new BufferMonitor(opts);

  this._maxSize = opts.maxSize || 16000000;
  this._lowThreshold = opts.lowThreshold || 0;
  this._highThreshold = opts.highThreshold || (opts.maxSize / 100);
  this._state = NORMAL;
  this._interval = opts.interval || 1000;
  this._lastValue;
  this._lastAlert = Date.now();

  TransformStream.call(this, {
    objectMode: true,
    highWaterMark: this._maxSize
  });
}

BufferMonitor.prototype._setState = function(state) {
  this._state = state;
  this._lastValue = this._readableState.buffer.length;
  this._lastAlert = Date.now();
};

BufferMonitor.prototype._alert = function(msg) {
  debug('read buffer on alert:', readBuffer);

  this.emit('alert', {
    state: this._state,
    msg: msg,
    size: this._readableState.buffer.length
  });
};

BufferMonitor.prototype._transform = function(chunk, encoding, done) {
  var readBuffer = this._readableState.buffer.length;
  var isAboveThreshold = readBuffer > this._highThreshold;
  var isIncreasing = readBuffer > this._lastValue;
  var shouldAlertState = (Date.now() - this._lastAlert) > this._interval;

  if (this._state === NORMAL) {
    if (isAboveThreshold) {
      this._setState(HIGH_AND_INCREASING);
      this._alert('The buffer is growing above high threshold');
    }
  }

  if (this._state === HIGH_AND_INCREASING) {
    if (shouldAlertState) {
      if (isIncreasing) {
        this._setState(HIGH_AND_INCREASING);
        this._alert('The buffer is growing above high threshold and increasing');
      } else if (isAboveThreshold) {
        this._setState(HIGH_AND_DECREASING);
        this._alert('The buffer is growing above high threshold but decreasing');
      } else {
        this._setState(NORMAL);
        this._alert('The buffer has normalized below high threshold');
      }
    }
  }

  if (this._state === HIGH_AND_DECREASING) {
    if (shouldAlertState) {
      if (isIncreasing) {
        this._setState(HIGH_AND_INCREASING);
        this._alert('The buffer is growing above high threshold and increasing');
      } else if (isAboveThreshold) {
        this._setState(HIGH_AND_DECREASING);
        this._alert('The buffer is growing above high threshold but decreasing');
      } else {
        this._setState(NORMAL);
        this._alert('The buffer has normalized below high threshold');
      }
    }
  }

  done(null, chunk);
};

module.exports = BufferMonitor;
