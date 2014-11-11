"use strict"

var wsServer = "ws://127.0.0.1:9431/sender";
var ws = new WebSocket(wsServer);
ws.onopen = function (evt) {
    console.info("--------->sender connected");
}; 
ws.onclose = function (evt) { 
}; 
ws.onmessage = function (evt) { 
}; 
ws.onerror = function (evt) {

};

var Camera = function(){
    var self = this;
    var video = document.getElementById("video"),
        canvas = document.createElement("canvas"),
        btnCapture = document.getElementById("btn-capture"),
        camera_stream = null,
        videoObj = { "video": true };

    canvas.width = video.width;
    canvas.height = video.height;
    var context = canvas.getContext("2d");

    navigator.getMedia = ( navigator.getUserMedia ||
               navigator.webkitGetUserMedia ||
               navigator.mozGetUserMedia ||
               navigator.msGetUserMedia);

    navigator.getMedia (videoObj,
        function(stream) {
            camera_stream = stream;
            video.src = window.URL.createObjectURL(stream);
            video.play();
        },function(error) {
            //console.log("Video capture error: ", error.code); 
        }
    );

    self.stop = function(){
        video.pause();
    };

    self.snap = function(){
        context.drawImage(video, 0, 0);
        var dataURL = canvas.toDataURL("image/png");

        var data = {
            'type' : 'img',
            'data' : dataURL,
        }
        console.info(data);
        ws.send(JSON.stringify(data));

        self.stop();
    }

    btnCapture.onclick = function(){
        console.info("----------1----------");
        self.snap();
    };
};

window.onload = function(){
    var camera = new Camera();
};