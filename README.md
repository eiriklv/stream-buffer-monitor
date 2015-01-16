stream-buffer-monitor
=====================

#### Introduction:
A helper stream to monitor the buffer of a stream pipeline.
Alerts via events when:
* the buffer passes a threshold
* the buffer is above the threshold and increasing
* the buffer is above the threshold and decreasing
* the buffer has normalized below threshold

Mainly build to be used in conjunction with [interprocess-pull-stream](https://github.com/eiriklv/interprocess-pull-stream)
