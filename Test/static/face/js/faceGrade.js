window.onload=function() {
    initTemplate([],tempCallBack)
    var URL = "http://liuzhanwei.tunnel.echomod.cn/",
        buttonArr = [0,0,0],    //图片是否选取
        picArr = [null,null,null],  //图片文件数据
        resArr=[null,null,null];    //图片识别结果
    //模板异步加载完成回调
    function tempCallBack(){
        getCamera()
        submitPhoto()
    }
    //点击拍照
    function getCamera(){
        $(".photo-content").on("click",function(){
            var index = $(this).data("index")
            if(!buttonArr[index]){
                $(".img-file").eq(index).click()
            }
        })
        $(".photo-content span").on("click",function(){
            var index = $(this).parent().data("index")
            $(".img-file").eq(index).click()
        })
        $('.img-file').on('change',function(){
            $("#success-title").text("上传中...")
            $("#photo-big-wrap").css("display","block").css({
                'background-image':'none'
            })
            $("#img").css({
                'background-color':'rgba(0,0,0,.6)'
            })
            $("#img-point").css("display","none")
            var index = $(this).data("index")
            var file = this.files[0];
            if(!file){
                $("#photo-big-wrap").css("display","none")
                buttonArr[index] = 1;
            }else if(file.type == "image/jpeg" || file.type == "image/png"){
                loading()
                $("#bottom>span").css("display","none")
                EXIF.getData(file,function(){
                  var reader = new FileReader();
                  var orientation = EXIF.getTag(this,'Orientation');
                  reader.readAsDataURL(file);
                  reader.onload = function(e){
                      getImgData(this.result,orientation,function(data){
                          postImg([{
                            data:convertBase64UrlToBlob(data),
                            file:file
                          }],function(facedata,picUrl){
                            drawImgPoint(data,facedata)
                            $("#photo-again").css("display","inline-block")
                            $("#img").css({
                              'background-color':'rgba(0,0,0,0)'
                            })
                            $("#delete").off("click").on("click",function(){
                                  $("#photo-big-wrap").css("display","none")
                            })
                            $("#photo-yes").off("click").on("click",function(){
                                  $("#photo-big-wrap").css("display","none")
                                  buttonArr[index] = 1;
                                  $(".photo-content").eq(index).css({
                                      'background-size':'cover',
                                      'background-image':'url("'+data+'")'
                                  }).data("init","0")
                                  $(".photo-content").eq(index).find("span").css("display","block")
                                  loading.remove()
                                  picArr[index]={
                                      data:convertBase64UrlToBlob(data),
                                      file:file,
                                      url:picUrl
                                  }
                                  var hasChoosePic = 0;
                                  for(var i = 0;i<buttonArr.length;i++){
                                      if(buttonArr[i]){
                                          hasChoosePic++ 
                                      }
                                  }
                                  if(hasChoosePic == buttonArr.length){
                                      $(".submit-btn").css("display","block")
                                  }
                            })
                            $("#photo-again").off("click").on("click",function(){
                                  $(".img-file").eq(index).click()
                            })
                          },index)
                      });
                  }
                });
            }else{
                myAlert({content:"请上传静态图片文件"})
                buttonArr[index] = 1;
            }
        })
    }
    //提交照片
    function submitPhoto(){
        $(".submit-btn").on("click",function(){
            var ageSum = male_scoreSum = female_scoreSum= 0,path=[];
            for(var i = 0;i<resArr.length;i++){
                if(!buttonArr[i]){
                    myAlert({content:"第 "+(i+1)+" 张照片尚未拍摄，请拍摄完成后再识别！"})
                    return
                }
                path.push(picArr[i].url);
                ageSum += resArr[i].attributes.age.value;
                female_scoreSum += resArr[i].attributes.beauty.female_score;
                male_scoreSum += resArr[i].attributes.beauty.male_score;
            }
            if(!(resArr[0].attributes.gender.value == resArr[1].attributes.gender.value && resArr[1].attributes.gender.value == resArr[2].attributes.gender.value)){
                myAlert({content:"三张人脸性别不同，,请重新拍照！"})
                return
            }
            $.ajax({
        　　　　 type: "POST",
        　　　　 url:URL + "binaryPipe",
                data:{
                    reqType:"compare",
                    path:path
                },
                beforeSend:function(){
                    $(".submit-btn").text("正在比对..")
                    loading()
                },
                success:function(data){
                    loading.remove()
                    $(".submit-btn").text("提交鉴颜")
                    if(data.status){
                        if(data.result){
                            var race = 0,emotion=new Array();
                            switch(resArr[0].attributes.ethnicity.value){
                                case "Asian":race = "亚洲人";break;
                                case "White":race = "白人";break;
                                case "Black":race = "黑人";break;
                            }
                            function getEmotionName(engName){
                                switch(engName){
                                    case "anger":return "愤怒";
                                    case "disgust":return "厌恶";
                                    case "fear":return "恐惧";
                                    case "happiness":return "高兴";
                                    case "neutral":return "平静";
                                    case "sadness":return "伤心";
                                    case "surprise":return "惊讶";
                                }
                            }
                            for(k in resArr[0].attributes.emotion){
                                emotion.push({
                                    name:getEmotionName(k),
                                    value:resArr[0].attributes.emotion[k]
                                })
                            }
                            emotion = JsonSort(emotion,"value")
                            var res = "性别："+(resArr[0].attributes.gender.value == "Female" ? "女" : "男")+"<br/>"+
                            "年龄："+parseInt(ageSum/3)+"<br/>"+
                            "人种："+race+"<br/>"+
                            "情绪："+emotion[emotion.length-1].name+"<br/>"+
                            "色斑率："+resArr[0].attributes.skinstatus.stain+"%<br/>"+
                            "青春痘："+resArr[0].attributes.skinstatus.acne+"%<br/>"+
                            "黑眼圈："+resArr[0].attributes.skinstatus.dark_circle+"%<br/>"+
                            "健康度："+resArr[0].attributes.skinstatus.health+"%<br/>"+
                            "颜值评分：<span class='color'>"+(resArr[0].attributes.gender.value == "Female" ? resArr[0].attributes.beauty.female_score : resArr[0].attributes.beauty.male_score )+"</span><br/>"+
                            "<span class='color3'>使用美颜相机会影响识别结果</span>"
                            myAlert({title:"分析结果",confirm:"我服了",content:res})
                        }else{
                            myAlert({content:"三张人脸似乎不是一个人,请重新拍照！"})
                        }
                    }else{
                        myAlert({content:"身份比对失败"})
                    }
                }
            })
        })
    }
    //创建二进制对象
    function convertBase64UrlToBlob(urlData){  
        var bytes=window.atob(urlData.split(',')[1]);        //去掉url的头，并转换为byte     
        //处理异常,将ascii码小于0的转换为大于0  
        var ia = new Uint8Array(bytes.length);
        for (var i = 0; i < bytes.length; i++) {  
            ia[i] = bytes.charCodeAt(i);  
        }
        return new Blob( [ia] );  
    }  
    //上传照片
    function postImg(data,fn,index){
        var formData = new FormData()
        data.forEach(function(item,i){
            formData.append("name"+i,item.file.name)
            formData.append("image_file"+i,item.data)
        })
        formData.append("reqType","save")
        formData.append("path",[])
        $.ajax({
    　　　　type: "POST",
    　　　　url:URL + "binaryPipe",
           beforeSend:function(){
                loading()
            },
    　　　　data: formData ,　　//这里上传的数据使用了formData 对象
    　　　　processData : false, 
    　　　　//必须false才会自动加上正确的Content-Type 
    　　　　contentType : false , 
           success:function(data){
                $("#success-title").text("识别中...")
                if(data.status){
                    var picUrl = data.path[0]
                    $.ajax({
                　　　　type: "POST",
                　　　　url:URL + "binaryPipe",
                        data:{
                            reqType:"recognition",
                            path:data.path
                        },
                        success:function(data){
                            loading.remove()
                            if(data.status){
                                var isManyFace = false;
                                for(var i =0 ;i<data.result.length;i++){
                                    if(data.result[i].faces.length == 0){
                                        fn && fn(data)
                                        myAlert({content:"识别失败"})
                                        $("#success-title").text("照片中好像没有人脸哦~")
                                        return
                                    }else if(data.result[i].faces.length > 1){
                                        isManyFace = true;
                                    }
                                }
                                fn && fn(data,picUrl);
                                $("#success-title").text("亲，识别成功啦！")
                                if(index == 1 && data.result[0].faces[0].attributes.mouthstatus.open < 85){
                                    myAlert({content:"您好像没有张嘴哦，请重新拍照！"})
                                    return
                                }else if(index == 2 && data.result[0].faces[0].attributes.smile.value < data.result[0].faces[0].attributes.smile.threshold){
                                    myAlert({content:"您好像没有面带笑容耶，请重新拍照！"})
                                    return
                                }if(data.result[0].faces[0].attributes.glass.value != "None"){
                                    myAlert({content:"您佩戴了眼镜，可能对颜值产生影响，建议您取下来！"},callBack)
                                }else if(data.result[0].faces[0].attributes.facequality.value < data.result[0].faces[0].attributes.facequality.threshold){
                                    myAlert({content:"您的人脸不够清晰，可能对身份比对产生影响，建议您重新拍摄！"},callBack)
                                }
                                callBack()
                                function callBack(){
                                    if(isManyFace){
                                        myAlert({title:"请注意",content:"照片中人脸数量不唯一，将取照片中最明显的人脸(蓝色区域)进行鉴颜！"})
                                    }
                                    $("#photo-yes").css("display","inline-block")
                                    resArr[index] = data.result[0].faces[0];
                                }
                            }else{
                                fn && fn(data)
                                myAlert({content:"识别失败"})
                                $("#success-title").text("照片中好像没有人脸哦~")
                            }
                        }
                    })
                }else{
                    loading.remove()
                    myAlert({content:"上传失败"})
                }
            }
    　　});
    }
    //绘制图片关键点
    function drawImgPoint(data,facedata){
        facedata = facedata.result;
        var dpi = window.devicePixelRatio;
        var image=new Image();
        image.src = data;
        image.onload=function(){
            var picH = this.naturalHeight,
                picW = this.naturalWidth,
                winH = document.documentElement.clientHeight,
                winW = document.documentElement.clientWidth,
                pointRadius = 1.3,
                ele = $("#img-point").css("display","block").get(0),
                ctx = ele.getContext('2d');
            if(picW > picH){
                ele.height = winH * dpi;
                ele.width = winH/picH * picW * dpi;
            }else{
                ele.height = winW/picW * picH * dpi
                ele.width = winW * dpi
            }
            ele.style.width=ele.width/dpi+'px';
            ele.style.height=ele.height/dpi+'px';
            ctx.drawImage(this,0,0,ele.width,ele.height);
            var picScale = ele.width/picW;
            for(var i = 0 ;i<facedata.length;i++){
                for(var j = 0;j<facedata[i].faces.length;j++){
                    for(k in facedata[i].faces[j].landmark){
                        j==0 ? ctx.fillStyle="#3385ff" : ctx.fillStyle="#ff4f48";
                        var _x = facedata[i].faces[j].landmark[k].x,
                            _y = facedata[i].faces[j].landmark[k].y;
                        ctx.beginPath();
                        ctx.arc(_x*picScale,_y*picScale,Math.max(facedata[i].faces[j].face_rectangle.width/200*picScale,1.2)*dpi,0,2*Math.PI);
                        ctx.fill()
                    }
                }
            }
            var pointX=0,
                pointY=0,
                translateX = (winW-$("#img-point").width())/2,
                translateY = (winH-$("#img-point").height())/2;
            $("#img-point").css({"-webkit-transform":"translate3d("+ translateX +"px,"+ translateY +"px,0)","transform":"translate3d("+ translateX +"px,"+ translateY +"px,0)"})
            $("#img").off("touchstart").on("touchstart",function(e){
                var touchX = e.touches[0].clientX,
                    touchY = e.touches[0].clientY;
                pointX = touchX;
                pointY = touchY;
            })
            $("#img").off("touchmove").on("touchmove",function(e){
                var touchX = e.touches[0].clientX,
                    touchY = e.touches[0].clientY;
                if( translateX <= .9*REM &&
                    translateX >= -($("#img-point").width()-(winW-.9*REM)) && 
                    translateY <= 2.15*REM && 
                    translateY >= -($("#img-point").height()-(winH-2.15*REM))
                ){
                    translateX += (touchX-pointX);
                    translateY += (touchY-pointY);
                    var translate = "translate3d("+ translateX +"px,"+ translateY +"px,0)"
                    $("#img-point").css({"-webkit-transform":translate,"transform":translate})
                }else{
                    if(translateX > .9*REM){
                        translateX = .9*REM
                    }else if(translateX < -($("#img-point").width()-(winW-.9*REM))){
                        translateX = -($("#img-point").width()-(winW-.9*REM))
                    }else if(translateY > 2.15*REM){
                        translateY = 2.15*REM
                    }else if(translateY < -($("#img-point").height()-(winH-2.15*REM))){
                        translateY = -($("#img-point").height()-(winH-2.15*REM))
                    }
                }
                pointX = touchX;
                pointY = touchY;
            })
        }
    }
    //处理图片
    function getImgData(img,dir,next){
        var image=new Image();
        image.onload=function(){
            var degree=0,drawWidth,drawHeight,width,height;
            drawWidth=this.naturalWidth;
            drawHeight=this.naturalHeight;
            //以下改变一下图片大小
            var maxSide = Math.max(drawWidth, drawHeight);
            if (maxSide > 1024) {
                var minSide = Math.min(drawWidth, drawHeight);
                minSide = minSide / maxSide * 1024;
                maxSide = 1024;
                if (drawWidth > drawHeight) {
                    drawWidth = maxSide;
                    drawHeight = minSide;
                } else {
                    drawWidth = minSide;
                    drawHeight = maxSide;
                }
            }
            var canvas=document.createElement('canvas');
            canvas.width=width=drawWidth;
            canvas.height=height=drawHeight; 
            var context=canvas.getContext('2d');
            //判断图片方向，重置canvas大小，确定旋转角度，iphone默认的是home键在右方的横屏拍摄方式
            switch(dir){
            //iphone横屏拍摄，此时home键在左侧
            case 3:
                degree=180;
                drawWidth=-width;
                drawHeight=-height;
                break;
            //iphone竖屏拍摄，此时home键在下方(正常拿手机的方向)
            case 6:
                canvas.width=height;
                canvas.height=width; 
                degree=90;
                drawWidth=width;
                drawHeight=-height;
                break;
            //iphone竖屏拍摄，此时home键在上方
            case 8:
                canvas.width=height;
                canvas.height=width; 
                degree=270;
                drawWidth=-width;
                drawHeight=height;
                break;
            }
            //使用canvas旋转校正
            context.rotate(degree*Math.PI/180);
            context.drawImage(this,0,0,drawWidth,drawHeight);
            //返回校正图片
            next(canvas.toDataURL("image/jpeg",.8));
        }
        image.src=img;
    }
/*******canvas背景******/
    var canvas = document.getElementById("c");
    var ctx = canvas.getContext("2d");
    var c = $("#c");
    var w,h;
    var pi = Math.PI;
    var all_attribute = {
        num:100,            			 // 个数
        start_probability:0.1,		     // 如果数量小于num，有这些几率添加一个新的     		     
        radius_min:1,   			     // 初始半径最小值
        radius_max:2,   			     // 初始半径最大值
        radius_add_min:.3,               // 半径增加最小值
        radius_add_max:.5,               // 半径增加最大值
        opacity_min:0.3,                 // 初始透明度最小值
        opacity_max:0.5, 				 // 初始透明度最大值
        opacity_prev_min:.003,            // 透明度递减值最小值
        opacity_prev_max:.005,            // 透明度递减值最大值
        light_min:40,                 // 颜色亮度最小值
        light_max:70,                 // 颜色亮度最大值
    };
    var style_color = find_random(0,360);  
    var all_element =[];
    window_resize();
    function start(){
        window.requestAnimationFrame(start);
        style_color+=.1;
        ctx.fillStyle = 'hsl('+style_color+',100%,97%)';
        ctx.fillRect(0, 0, w, h);
        if (all_element.length < all_attribute.num && Math.random() < all_attribute.start_probability){
            all_element.push(new ready_run);
        }
        all_element.map(function(line) {
            line.to_step();
        })
    }
    function ready_run(){
        this.to_reset();
    }
    ready_run.prototype = {
        to_reset:function(){
            var t = this;
            t.x = find_random(0,w);
            t.y = find_random(0,h);
            t.radius = find_random(all_attribute.radius_min,all_attribute.radius_max);
            t.radius_change = find_random(all_attribute.radius_add_min,all_attribute.radius_add_max);
            t.opacity = find_random(all_attribute.opacity_min,all_attribute.opacity_max);
            t.opacity_change = find_random(all_attribute.opacity_prev_min,all_attribute.opacity_prev_max);
            t.light = find_random(all_attribute.light_min,all_attribute.light_max);
            t.color = 'hsl('+style_color+',100%,'+t.light+'%)';
        },
        to_step:function(){
            var t = this;
            t.opacity -= t.opacity_change;
            t.radius += t.radius_change;
            if(t.opacity <= 0){
                t.to_reset();
                return false;
            }
            ctx.fillStyle = t.color;
            ctx.globalAlpha = t.opacity;
            ctx.beginPath();
            ctx.arc(t.x,t.y,t.radius,0,2*pi,true);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }
    function window_resize(){
        w = window.innerWidth;
        h = window.innerHeight;
        canvas.width = w;
        canvas.height = h;
    }
    $(window).resize(function(){
        window_resize();
    });
    function find_random(num_one,num_two){
        return Math.random()*(num_two-num_one)+num_one;
    }
    (function() {
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for(var xx = 0; xx < vendors.length && !window.requestAnimationFrame; ++xx) {
            window.requestAnimationFrame = window[vendors[xx] + 'RequestAnimationFrame'];
            window.cancelAnimationFrame = window[vendors[xx] + 'CancelAnimationFrame'] ||
                                          window[vendors[xx] + 'CancelRequestAnimationFrame'];
        }
    
        if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16.7 - (currTime - lastTime));
                var id = window.setTimeout(function() {
                    callback(currTime + timeToCall);
                }, timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };
        }
        if (!window.cancelAnimationFrame) {
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
        }
    }());
    start();
}