"use strict"

// IDLE / SET_IMAGE / IMAGE_DETECTING / NO_FACE / FACE_FOUND
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

function postImage(imgdata, callback){
    var formData = new FormData();
    formData.append("img", imgdata);
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "http://182.92.81.74/test.php");

    xhr.onreadystatechange = function() {
        var response;
        if (this.readyState === 4) {
            this.onreadystatechange = null;
            if ((response = this.responseText)) {
                try {
                    response = JSON.parse(response);
                } catch (_error) { }
            }
            if (this.status === 200) {
                callback(null, response);
            } else {
                callback(response.error_code || -1, response);
            }
        }
    };
    xhr.send(formData);
}

var AlertBox = function(){
    var self = this;
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
},
alertBox = new AlertBox();

var AppControl = function(){
    var self = this;
    var receiverDaemon = new ReceiverDaemon("~facemaskgame"),
        channel = receiverDaemon.createMessageChannel("ws");
    
    channel.on("message", function(senderId, msgType, msg){
        if("data" in msg){
            var msg = JSON.parse(msg.data);
            ("onmessage" in self)&&(self.onmessage(msg));
            console.info("found data...........", msg);
        }
    });

    self.send = function(data){
        channel.send(JSON.stringify(data));
    };
    self.on = function(type, func){
        self["on"+type] = func;
    };

    self.open =function(){
        receiverDaemon.open();
    };
},
appControl = new AppControl();

var FaceppSDK = function(){
    var self = this;
    var apiKey = "fc9ee3d9b48ed027a7cedf27a8fe2434",
        apiSecret = "3cnNalC9OF09E58R0jf4Cpu42t0WJBGR";

    // apiKey = "9324fbaf5b1a3e206c7ed4171b0ff469";
    // apiSecret = "pRwuUwQybWKvRN9eaRSoAHXW23aT7u4k";

    self.result = null;
    self.detect = function(imgdata){
        postImage(imgdata, function(err, result){
            if (err) {
                gameStatus = "NET_ERROR";
                appControl.send({"type": "game_status", "data": gameStatus});
                return;
            }
            self.result = result;
            console.info("..................................>>", result);
            ("onresult" in self)&& (self.onresult(result));
        });
        
    };

    self.on = function(type, func){
        self["on"+type] = func;
    };
},
faceppSDK = new FaceppSDK();

var Mask = function(){
    var self = this;
    var img = document.getElementById("image"),
        imgEyeLeft = new Image(),
        imgEyeRight = new Image(),
        canvas = document.getElementById("canvas");

    var ctx = canvas.getContext("2d");
    var imgBlob = null;

    self.drawImage =function(){
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
    };

    img.onload = function(){
        self.drawImage();
        canvas.style.marginLeft= "-"+(canvas.width/2)+"px";
        canvas.className = "show";
        alertBox.show("Detecting Face...");
        console.info("------------------>Detecting Face... ");
        gameStatus = "IMAGE_DETECTING";
        faceppSDK.detect(imgBlob);
        appControl.send({"type": "game_status", "data": gameStatus});
    };
    self.setImage = function(imgData){
        gameStatus = "SET_IMAGE";
        img.src = imgData;
        imgBlob = imageDataFormat(imgData);
        appControl.send({"type": "game_status", "data": gameStatus});
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
        if(result&&result.face.length>0){
            if(typeof(maskId)=="undefined"){
                var num = Math.floor(Math.random()*18)+1;
                maskId = num;
            }
            var eyesCount = 0;
            imgEyeLeft.src = "assets/imgs/eyes/"+maskId+"-L.png";
            imgEyeRight.src = "assets/imgs/eyes/"+maskId+"-R.png";

            var eyesLoaded = function(){
                if(eyesCount>=2){
                    self.drawImage();
                    for(var i=0; i<result.face.length; i++){
                        var face = result.face[i];
                        var faceWidth = face.position.width*result.img_width/100,
                            faceHeight = face.position.height*result.img_height/100;
                        var ew = faceWidth*0.4,
                            eh = faceHeight*0.4;
                        var eyePosition = {};
                            eyePosition.leftX = face.position.eye_left.x*result.img_width/100 - ew/2;
                            eyePosition.leftY = face.position.eye_left.y*result.img_height/100 - eh/2;

                            eyePosition.rightX = face.position.eye_right.x*result.img_width/100 - ew/2;
                            eyePosition.rightY = face.position.eye_right.y*result.img_height/100 - eh/2;
                            
                            ctx.drawImage(imgEyeLeft, eyePosition.leftX, eyePosition.leftY, ew, eh);
                            ctx.drawImage(imgEyeRight, eyePosition.rightX, eyePosition.rightY, ew, eh);
                    }
                }
            };
            imgEyeLeft.onload = function(){
                eyesCount+=1;
                eyesLoaded();
            };
            imgEyeRight.onload = function(){
                eyesCount+=1;
                eyesLoaded();
            };
        }else{
            alertBox.show("Face found");
            self.setBackground(result);
        }
    };

    self.on = function(type, func){
        self["on"+type] = func;
    };
},
mask = new Mask();

faceppSDK.on("result", function(result){
    console.info("------------------>result: ", typeof(result) , result.face);
    faceppSDK.result = result;
    if(result.face.length==0){
        gameStatus = "NO_FACE";
        alertBox.show("No Face found!");
        mask.setBackground();
        appControl.send({"type": "game_status", "data": gameStatus});
    }else{
        gameStatus = "FACE_FOUND";
        alertBox.show("Face found");
        mask.setBackground(result);
        appControl.send({"type": "game_status", "data": gameStatus});
    }
});

window.onload = function(){
    appControl.on("message", function(msg){
        if(msg["type"]=="img"){
            mask.setImage(msg["data"]);
        }else if(msg["type"]=="mask"){
            mask.wear(faceppSDK.result, msg["data"]["maskId"]);
        }
    });
    appControl.open();
};