// DO NOT EDIT! This test has been generated by tools/gentest.py.
// OffscreenCanvas test in a worker:2d.shadow.composite.3
// Description:Areas outside shadows are drawn correctly with destination-out
// Note:

importScripts("/resources/testharness.js");
importScripts("/common/canvas-tests.js");

var t = async_test("Areas outside shadows are drawn correctly with destination-out");
t.step(function() {

var offscreenCanvas = new OffscreenCanvas(100, 50);
var ctx = offscreenCanvas.getContext('2d');

ctx.fillStyle = '#0f0';
ctx.fillRect(0, 0, 100, 50);
ctx.globalCompositeOperation = 'destination-out';
ctx.shadowColor = '#f00';
ctx.shadowBlur = 10;
ctx.fillStyle = '#f00';
ctx.fillRect(200, 0, 100, 50);
_assertPixelApprox(offscreenCanvas, 5,5, 0,255,0,255, "5,5", "0,255,0,255", 2);
_assertPixelApprox(offscreenCanvas, 50,25, 0,255,0,255, "50,25", "0,255,0,255", 2);

t.done();

});
done();
