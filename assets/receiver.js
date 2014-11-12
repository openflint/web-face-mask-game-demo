"use strict"
/*
* important set faceplusplus us api url
**/

// IDEL / SET_IMAGE / IMAGE_DETECTING / NO_FACE / FACE_FOUND
var gameStatus = "IDLE";
function imageDataFormat(imgData){
    var data = atob(imgData.substring( "data:image/png;base64,".length ));
    var asArray = new Uint8Array(data.length);
    for(var i = 0, len = data.length; i < len; ++i){
        asArray[i] = data.charCodeAt(i);    
    }
    var blob = new Blob([ asArray.buffer ], {type: "image/png"});
    return blob;
}
var FaceppSDK = function(){
    var self = this;
    var apiKey = "fc9ee3d9b48ed027a7cedf27a8fe2434",
        apiSecret = "3cnNalC9OF09E58R0jf4Cpu42t0WJBGR";

    apiKey = "9324fbaf5b1a3e206c7ed4171b0ff469";
    apiSecret = "pRwuUwQybWKvRN9eaRSoAHXW23aT7u4k";

    self.result = null;
    self.detect = function(imgdata){
        var api = new FacePP(apiKey, apiSecret);
        api.request("detection/detect", {
            img: imgdata

        }, function(err, result){
            if (err) {
                console.info(err);
                return;
            }
            ("onresult" in self)&& (self.onresult(result));
        });
    };

    self.on = function(type, func){
        self["on"+type] = func;
    };
}
var faceppSDK = new FaceppSDK();

var AlertBox = function(){
    self = this;
    var box = document.getElementById("alert"),
        alertText = document.getElementById("alert-text");

    self.show = function(text){
        box.className = "alert show";
        alertText.innerHTML = text;
        setTimeout(function(){
            self.hide();
        },5000);
    };

    self.hide = function(text){
        box.className = "alert hide";
    }
};
var alertBox = new AlertBox();

var Mask = function(){
    var self = this;
    var img = document.getElementById("image"),
        imgEyeLeft = new Image(),
        imgEyeRight = new Image(),
        canvas = document.getElementById("canvas");

    var ctx = canvas.getContext("2d");

    var imgBlob = null;
    img.onload = function(){
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.style.marginLeft= "-"+(canvas.width/2)+"px";
        canvas.className = "show";
        alertBox.show("Detecting Face...");
        gameStatus = "IMAGE_DETECTING";
        faceppSDK.detect(imgBlob);
    };
    self.setImage = function(imgData){
        gameStatus = "SET_IMAGE";
        img.src = imgData;
        imgBlob = imageDataFormat(imgData);
    };

    self.setBackground = function(result){
        if(typeof(result)=="undefined"){
            document.body.className = "bg-no";
        }else if(result.face.length>1){
            document.body.className = "bg-all";
        }else{
            if(result.face[0].attribute.gender.value=="Male"){
                var num = Math.floor(Math.random()*5)+1;
                document.body.className = "bg-m-"+num;
            }else{
                var num = Math.floor(Math.random()*3)+1;
                document.body.className = "bg-f-"+num;
            }
        }
    };

    self.wear = function(result, maskId){
        if(result.face.length==0){
            self.setBackground();
            alertBox.show("No Face found!");
        }else{
            alertBox.show("Face found");
            self.setBackground(result);
            if(typeof(maskId)=="undefined"){
                var num = Math.floor(Math.random()*18)+1;
                maskId = num;
            }
            imgEyeLeft.src = "assets/imgs/eyes/"+maskId+"-L.png";
            imgEyeRight.src = "assets/imgs/eyes/"+maskId+"-R.png";

            for(var i=0; i<result.face.length; i++){
                var face = result.face[i];
                var faceWidth = face.position.width*result.img_width/100,
                    faceHeight = face.position.height*result.img_height/100;
                var ew = faceWidth*0.4,
                    eh = faceHeight*0.4;
                if(ew<80){
                    imgEyeLeft.width = ew;
                    imgEyeLeft.height = eh;

                    imgEyeRight.width = ew;
                    imgEyeRight.height = eh;
                }
                console.info("---------------------->----------->", faceWidth, faceHeight, imgEyeLeft.width, imgEyeLeft.height);
                var eyePosition = {};
                    eyePosition.leftX = face.position.eye_left.x*result.img_width/100 - imgEyeLeft.width/2;
                    eyePosition.leftY = face.position.eye_left.y*result.img_height/100 - imgEyeLeft.height/2;

                    eyePosition.rightX = face.position.eye_right.x*result.img_width/100 - imgEyeRight.width/2;
                    eyePosition.rightY = face.position.eye_right.y*result.img_height/100 - imgEyeRight.height/2;
                    setTimeout(function(){
                        ctx.drawImage(imgEyeLeft, eyePosition.leftX, eyePosition.leftY, imgEyeLeft.width, imgEyeLeft.height);
                        ctx.drawImage(imgEyeRight, eyePosition.rightX, eyePosition.rightY, imgEyeRight.width, imgEyeRight.height);
                    },100);
            }
        }
    };

    self.on = function(type, func){
        self["on"+type] = func;
    };
};
var mask = new Mask();

faceppSDK.on("result", function(result){
    console.info("------------------>result: ", result);
    self.result = result;
    if(result.face.length==0){
        gameStatus = "NO_FACE";
    }else{
        gameStatus = "FACE_FOUND";
    }
});

window.onload = function(){
    var receiverDaemon = new ReceiverDaemon("~facemaskgame");

    var channel = receiverDaemon.createMessageChannel("ws");

    channel.on("message", function(senderId, msgType, msg){
        console.info("found data...........", msg);
    });
    // channel.send(data);
    receiverDaemon.open();

};
/*
var wsServer = "ws://127.0.0.1:9431/receiver";
var ws = new WebSocket(wsServer);
ws.onopen = function (evt) {
    console.info("--------->receiver connected");
}; 

ws.onmessage = function(evt) {
  var msg = JSON.parse(evt.data);
    if(msg["type"]=="img"){
        console.info("---------------->on message: ", evt.data);
        mask.setImage(msg["data"]);
    }else if(msg["type"]=="mask"){
        mask.wear(faceppSDK.result, msg["data"]["maskId"]);
    }
};
*/