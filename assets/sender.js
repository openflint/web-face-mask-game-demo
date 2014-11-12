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
    console.info(img.width, img.height);
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

    self.snap = function(){
        // todo
        var data = imageEncode(video);
        console.info(JSON.stringify(data));
        // ws.send(JSON.stringify(data));

        self.stop();
    }

    btnCapture.onclick = function(){
        console.info("----------1----------");
        self.snap();
    };
};

var PhoneCamera = function(){
    var self = this;

    var btnCapture = document.getElementById("btn-capture-ffphone");

    btnCapture.onclick = function(){
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
            console.info(this.result.blob);
            img.src = window.URL.createObjectURL(this.result.blob);
            img.width = 320;
            img.height = 435;
            
            pixArea.appendChild(img);
            
            var data = imageEncode(img);
            
            // todo
            // ws.send(JSON.stringify(data));
        };
        pick.onerror = function () {
            console.info("Can't view the image!");
        };
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
            // video.style.width = vSize+"px";
            // video.style.height = vSize+"px";
            video.style.width = window.innerWidth+"px";
            video.style.height = vSize+"px";
        }
    };
};

////////////////common app control code///////////////////////////
function showAlert(msg){
    var errbox = document.getElementById("error"),
        bg = document.getElementById("error-bg"),
        msgbox = document.getElementById("error-content"),
        text = document.getElementById("error-text");
    text.innerHTML = msg;
    msgbox.style.left = (window.windowWidth-250)/2+"px";
    msgbox.style.top = (window.windowHeight-50)/2+"px";

    errbox.style.display = "block";
}
function hideAlert(){
    var bg = document.getElementById("error-bg"),
        errbox = document.getElementById("error"),
        text = document.getElementById("error-text");
    errbox.onclick = function(){
        text.innerHTML = "";
        errbox.style.display = "none";
    };
    bg.onclick = function(){
        text.innerHTML = "";
        errbox.style.display = "none";
    };
}

function appControl(appid){
    window.windowWidth = document.body.offsetWidth;
    window.windowHeight = window.innerHeight;

    hideAlert();
    var eleOpenBtn = document.getElementById("open-btn"),
        eleDongleIpInput = document.getElementById("dongle-ip-input");
    eleDongleIpInput.focus();
    function openApp(){
        console.info("-------------------------------openApp--------------------------");
        if(eleDongleIpInput.value!=""){
            var patrn =/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
            if(!patrn.exec(eleDongleIpInput.value) ){ 
                showAlert("IP address error");
                return;
            }
            // I can not get CROS error. so you must confirmed the ip address right
            var deviceIp = eleDongleIpInput.value;
            window.senderDaemon = new SenderDaemon(deviceIp, appid);
            // communicate();
            window.senderDaemon.openApp(appUrl, -1, true);
            return;
        }else{
            showAlert("IP address error");
        }
    }
    eleOpenBtn.onclick = function(e){
        openApp();
    };
    eleDongleIpInput.onkeyup = function(e){
        if(e.keyCode==13){
            openApp();
        }
    };
};
///////////////////////////////////////////

window.onload = function(){
    var gamePageView = new GamePageView();

    gamePageView.init();
    if(isFirefoxOs){
        var camera = new PhoneCamera();
    }else{
        var camera = new BrowserCamera();
    }

    appControl("~facemaskgame");
};