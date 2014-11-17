"use strict"

if (typeof String.prototype.replaceAll != 'function') {
    String.prototype.replaceAll = function (AFindText,ARepText){
        var raRegExp = new RegExp(AFindText,"g");
        return this.replace(raRegExp,ARepText);
    }
}

function getElementsByClass(searchClass, tagName) { 
    var domNode = document;
    if (tagName == null){
        tagName = '*';   
    }
    var el = new Array();
    var tags = domNode.getElementsByTagName(tagName);
    var tcl = " "+searchClass+" ";
    for(var i=0,j=0; i<tags.length; i++) { 
        var test = " " + tags[i].className + " ";
        if (test.indexOf(tcl) != -1){
            el[j++] = tags[i];
        }
    } 
    return el;
};

var appUrl = "http://openflint.github.io/web-face-mask-game-demo/receiver.html";

var isFirefoxOs = typeof(MozActivity)=="undefined"?false:true;
var masks = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18];

////////////////common app control code///////////////////////////

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

window.appManager = null;
var AppManager = function(appid){
    var self = this;

    window.windowWidth = document.body.offsetWidth;
    window.windowHeight = window.innerHeight;

    var senderDaemon = null,
        msgChannel = null,
        receiverStatus = "none",

        errbox = document.getElementById("error"),
        errbg = document.getElementById("error-bg"),
        errmsgbox = document.getElementById("error-content"),
        errtext = document.getElementById("error-text"),
        
        eleInputareaBack = document.getElementById("inputarea-bg"),
        eleInputarea = document.getElementById("inputarea"),
        eleOpenBtn = document.getElementById("open-btn"),
        eleDongleIpInput = document.getElementById("dongle-ip-input"),

        eleCloseAppBtn = document.getElementById("close-app-btn");

        

    self.showError = function(msg){
        errtext.innerHTML = msg;
        errmsgbox.style.left = (window.windowWidth-250)/2+"px";
        errmsgbox.style.top = (window.windowHeight-50)/2+"px";

        errbox.style.display = "block";
    };

    self.hideError = function(){
        errbox.onclick = function(){
            errtext.innerHTML = "";
            errbox.style.display = "none";
        };
        errbg.onclick = function(){
            errtext.innerHTML = "";
            errbox.style.display = "none";
        };
    };

    self.send = function(data){
        if(msgChannel){
            msgChannel.send(data);            
        }
    }
    self.openApp = function(){
        if(eleDongleIpInput.value!=""){
            var patrn =/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            if(!patrn.exec(eleDongleIpInput.value) ){ 
                self.showError("IP address error");
                return;
            }
            // I can not get CROS error. so you must confirmed the ip address right
            var deviceIp = eleDongleIpInput.value;
            senderDaemon = new SenderDaemon(deviceIp, appid);
            senderDaemon.on("appopened", function(messageChannel){
                receiverStatus = "ready";
                eleInputarea.style.display = "none";
                eleInputareaBack.style.display = "none";

                ("onappopened" in self)&&(self.onappopened());
                msgChannel = messageChannel;
                msgChannel.on("message", function(jsonObject){
                    if("data" in jsonObject){
                        ("onmessage" in self)&&(self.onmessage(jsonObject));
                    }
                });
                eleCloseAppBtn.className = "close-app-btn";
            });

            senderDaemon.openApp(appUrl, -1, true);
            return;
        }else{
            self.showError("IP address error");
        }
    };

    self.closeApp = function(){
        senderDaemon.closeApp();
    };

    self.on = function(type, func){
        self["on"+type] = func;
    }

    eleOpenBtn.onclick = function(e){
        self.openApp();
    };
    eleDongleIpInput.onkeyup = function(e){
        if(e.keyCode==13){
            self.openApp();
        }
    };

    self.hideError();
    eleDongleIpInput.focus();

    eleCloseAppBtn.onclick = function(){
        self.closeApp();
        eleCloseAppBtn.className = "close-app-btn hide";
        setTimeout(function(){
            window.location.reload();
        },1000);
    };
}

///////////////////////////////////////////

function imageEncode(img, imgw, imgh){
    var canvas = document.createElement("canvas");
    var context = canvas.getContext("2d");
    if(typeof(imgw)=="undefined"){
        imgw = 640;
    }
    if(typeof(imgh)=="undefined"){
        imgh = 480;
    }
    canvas.width = imgw;
    canvas.height = imgh;
    context.drawImage(img, 0, 0, imgw, imgh);
    var dataURL = canvas.toDataURL("image/png");
    return {
        'type' : 'img',
        'data' : dataURL,
    };
}

/*
* Camera for browser
**/
var BrowserCamera = function(){
    var self = this;
    self.waiting = false;
    var video = document.getElementById("video"),
        btnCapture = document.getElementById("btn-capture-browser"),
        camera_stream = null,
        videoObj = { "video": true };

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
    self.play = function(){
        video.play();
        btnCapture.className = "btn-capture";
        self.waiting = false;
    };

    self.snap = function(){
        var data = imageEncode(video);
        window.appManager.send(JSON.stringify(data));
        self.stop();
    }

    btnCapture.onclick = function(){
        if(!self.waiting){
            alertBox.show("Waiting...");
            btnCapture.className = "btn-capture on";
            self.waiting = true;
            self.snap();
        }
    };
};

var PhoneCamera = function(){
    var self = this;
    self.waiting = false;

    var btnCapture = document.getElementById("btn-capture-ffphone");

    btnCapture.onclick = function(){
        if(self.waiting){
            return;
        }
        alertBox.show("Waiting...");
        btnCapture.className = "btn-capture on";
        self.waiting = true;
        var pick = new MozActivity({
           name: "pick",
           data: {
               type: ["image/png", "image/jpg", "image/jpeg"]
           }
        });

        pick.onsuccess = function () {
            var img = document.createElement("img"),
                pixArea = document.getElementById("pix-area"),
                ffphoneCapture = document.getElementById("ffphone-capture");
            img.src = window.URL.createObjectURL(this.result.blob);
            pixArea.innerHTML = "";
            
            img.onload = function() {
                var imgw = 480;
                var imgh = parseInt(img.height*imgw/img.width);
                var canvas = document.createElement("canvas");
                var ctx = canvas.getContext("2d");
                canvas.width = imgw;
                canvas.height = imgh;

                ctx.drawImage(img, 0, 0, imgw, imgh);

                canvas.style.width = imgw/2+"px";
                canvas.style.height = imgh/2+"px";
                pixArea.appendChild(canvas);
                var dataURL = canvas.toDataURL("image/png");
                var data = {
                    'type': 'img',
                    'data': dataURL,
                };
                window.appManager.send(JSON.stringify(data));
            }
        };
        pick.onerror = function () {
            console.info("Can't view the image!");
        };
    };

    self.play = function(){
        btnCapture.className = "btn-capture";
        self.waiting = false;
    };
};

var GamePageView = function(){
    var self = this;
    var browserCapture = document.getElementById("browser-capture"),
        ffphoneCapture = document.getElementById("ffphone-capture"),
    
        eleMasks = document.getElementById("masks"),
        temp = document.getElementById("temp-mask").innerHTML,
        masksInner = document.getElementById("masks-inner");

    self.init = function(){
        eleMasks.style.width = window.innerWidth+"px";

        var html = "";
        for (var i = masks.length - 1; i >= 0; i--) {
            html += temp.replaceAll("##id##", masks[i]);
        };
        masksInner.innerHTML = html;

        var maskItems = getElementsByClass("mask-item", "div");
        for(var i=0;i<maskItems.length;i++){
            maskItems[i].onclick = function(){
                var data = {
                    "type": "mask",
                    "data": {
                        "maskId": this.getAttribute("mask-id")
                    }
                };
                window.appManager.send(JSON.stringify(data));
            };
        }

        if(isFirefoxOs){
            ffphoneCapture.className = "capture-area";
            ffphoneCapture.style.width = window.innerWidth+"px";
            ffphoneCapture.style.height = window.innerHeight-eleMasks.offsetHeight-20+"px";
        }else{
            var video = document.getElementById("video");
            browserCapture.className = "capture-area";
            var vSize = 0,
                vHeight = window.innerHeight-eleMasks.offsetHeight-20;
            if(window.innerWidth<vHeight){
                vSize = window.innerWidth;
            }else{
                vSize = vHeight;
            }
            video.style.width = window.innerWidth+"px";
            video.style.height = vSize+"px";
        }
    };
};

window.onload = function(){
    var gamePageView = new GamePageView();
    gamePageView.init();
    var phoneCamera = null,
        browserCamera = null;
    window.appManager = new AppManager("~facemaskgame");
    window.appManager.on("appopened", function(){
        if(isFirefoxOs){
            phoneCamera = new PhoneCamera();
        }else{
            browserCamera = new BrowserCamera();
        }
    });
    window.appManager.on("message", function(msg){
        switch(msg.type){
            case "game_status":
                if(msg.data=="FACE_FOUND"){
                    alertBox.show("Face detect success!");
                }else if(msg.data=="NO_FACE"){
                    alertBox.show("No face found!");
                }else if(msg.data=="NET_ERROR"){
                    alertBox.show("Network error!");
                }
                if(msg.data=="FACE_FOUND"||msg.data=="NO_FACE"||msg.data=="NET_ERROR"){
                    if(browserCamera){
                        browserCamera.play();
                    }
                    if(phoneCamera){
                        phoneCamera.play();
                    }
                }
                break;
            default:
                break;
        }
    });
};