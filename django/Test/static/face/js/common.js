var REM = document.documentElement.clientWidth/7.5,
ENV = "normal"
document.getElementsByTagName('html')[0].style.fontSize = REM+'px';

//异步初始全部完成回调
initTemplate.num = 0;
function asyncHasInit(){
    initTemplate.num++;
    if(initTemplate.num == 1){
        initTemplate.callBack()
    }
}

$(function(){
    var ua = window.navigator.userAgent.toLowerCase();
    if(/micromessenger/i.test(ua)){
        ENV = "wx"
        getOpenId()
    }
    document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
    if(document.getElementsByClassName('scroll-wrapper').length){
        $.iscroll = new IScroll('.scroll-wrapper',{click:true,preventDefault:false})
    }
    var isPageHide = false;  
    window.addEventListener('pageshow', function () {  
        if (isPageHide) { 
            window.location.reload();  
        }  
    });  
    window.addEventListener('pagehide', function () {  
        isPageHide = true;  
    });
})

function getOpenId(){
    if(sessionStorage.getItem("openid")){
        $(".wx-name").text(sessionStorage.getItem("nickname")+"，")
        $(".wx-photo").css({
            "background-size":"cover",
            "background-image":"url("+sessionStorage.getItem("photoUrl")+")"
        })
        return;
    }
    var ob=parseUrl(window.location.href);
    var code=ob.code;
    $.ajax({
        url: _URL+ "wxOpenId",
        type:"get",
        data:{
            code:code ? code : '',
            url:code ? '' :  encodeURIComponent(window.location.href)
        },
        success:function(data){
            if(!code){
                window.location.href = decodeURIComponent(data.codeUrl);
            }else{
                sessionStorage.setItem("openid",data.openid)
                sessionStorage.setItem("nickname",data.nickname)
                sessionStorage.setItem("photoUrl",data.photoUrl)
                $(".wx-name").text(sessionStorage.getItem("nickname")+"，")
                $(".wx-photo").css({
                    "background-size":"cover",
                    "background-image":"url("+sessionStorage.getItem("photoUrl")+")"
                })
            }
        }
    })
}

//选项卡
function chooseAct(el,fn){
    $(el).on("click",function(){
        $(el).removeClass("active");
        $(this).addClass("active");
        fn && fn.call(this)
    })
}
//wrap弹出
function wrapOpen(wrap,dis){
    var flex = "flex" in document.documentElement.style ? "flex" : "-webkit-flex"
    $(wrap).css({"display":dis ? flex : "block","opacity":0 }).addClass("active")
    $(wrap).css("outline")
    $(wrap).css("opacity","1")
}
//wrap关闭
function wrapClose(wrap){
    $(wrap).removeClass("active")
    $(wrap).css("opacity","0")
}
//wrap初始化
function wrapInit(wrap){
    $(wrap).on("transitionend",function(){
        if(!$(this).hasClass("active")){
            $(this).css("display","none")
        }
    })
}
//confirm
function myConfirm(data,yesfn,failfn) {
    setHTML("alert-template",data)
    wrapInit("#alert-shade")
    wrapOpen("#alert-shade",1)
    $("#alert-no").on("click",function(){
        wrapClose("#alert-shade")
        failfn && failfn()
    })
    $("#alert-yes").on("click",function(){
        wrapClose("#alert-shade")
        yesfn && yesfn()
    })
}
//alert
function myAlert(data,yesfn) {
    data.isAlert = true;
    setHTML("alert-template",data)
    wrapInit("#alert-shade")
    wrapOpen("#alert-shade",1)
    $("#alert-yes").on("click",function(){
        wrapClose("#alert-shade")
        yesfn && yesfn()
    })
}
//query转JSON
function parseUrl(string){
    var obj = new Object(),
        strs,
        arr = decodeURIComponent(string).split("#");
    for(var j=0;j<arr.length;j++){
        var line = arr[j];
        if (line.indexOf("?") != -1) {
            line = line.substr(line.indexOf("?") + 1);
            strs = line.split("&");
            for (var i = 0; i < strs.length; i++) {
                var tempArr = strs[i].split("=");
                obj[tempArr[0]] = tempArr[1];
            }
        }
    }
    return obj;
}
//json转query
$.param = function(obj){
    var arr=[];
    for(var k in obj){
        arr.push(k+'='+encodeURI(obj[k] instanceof Object ? JSON.stringify(obj[k]) : obj[k]));
    }
    return arr.join('&')
}
//loading
function loading(){
    if($(".showbox").length)return;
    $("body").append(
        '<div class="showbox"><div class="loader"><svg class="circular" viewBox="25 25 50 50"><circle class="path" cx="50" cy="50" r="20" fill="none" stroke-width="2" stroke-miterlimit="10"/></svg></div>'
    )
}
loading.remove=function(){
    $(".showbox").remove()
}
//json排序
function JsonSort(json,key){
    for(var j=1;j < json.length;j++){
        var temp = json[j],
            val  = temp[key],
            i    = j-1;
        while(i >=0 && json[i][key]>val){
            json[i+1] = json[i];
            i = i-1;
        }
        json[i+1] = temp;
    }
    return json;
}
////// handlebars扩展块级helper //////
Handlebars.registerHelper('compare', function(left, operator, right, options) {
    if (arguments.length < 3) {
        throw new Error('Handlerbars Helper "compare" needs 2 parameters');
    }
    var operators = {
        '==': function(l, r) {return l == r; },
        '===': function(l, r) {return l === r; },
        '!=': function(l, r) {return l != r; },
        '!==': function(l, r) {return l !== r; },
        '<': function(l, r) {return l < r; },
        '>': function(l, r) {return l > r; },
        '<=': function(l, r) {return l <= r; },
        '>=': function(l, r) {return l >= r; },
        'typeof': function(l, r) {return typeof l == r; }
    };
    if (!operators[operator]) {
        throw new Error('Handlerbars Helper "compare" doesn\'t know the operator ' + operator);
    }
    var result = operators[operator](left, right);
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});
//获取模板文件
function initTemplate(arr,fn){
    initTemplate.callBack = fn;
    if(!arr.length){
        asyncHasInit()
    }
    var num = 0;
    window.addEventListener("message",function(e){
        $(e.data).appendTo("head");
        num++;
        if(num == arr.length){
            asyncHasInit()
        }
    },false)
    arr.forEach(function(item,i) {
        $("<iframe src='"+item+"'></iframe>").appendTo("head").get(0)
    });
}
//视图渲染
function setHTML(name,data,con_name){
    var tempName = 'script[name='+name+']';
    var source   = $(tempName).html();
    var template = Handlebars.compile(source);
    var html = template(data || {});
    var container = con_name ? 'link[name='+con_name+']' : 'link[name='+name+']';
    if(! $(tempName).parent("head").length){
        if($(tempName).get(0).refresh != undefined){
            $(tempName).next().replaceWith(html);
        }else{
            $(tempName).after(html).get(0).refresh = true;
        }
    }else {
        if($(container).get(0).refresh != undefined){
            $(container).next().replaceWith(html);
        }else{
            $(container).after(html).get(0).refresh = true;
        }
    }
    $.iscroll && $.iscroll.refresh()
}