// ==UserScript==
// @name        pixiv_sort_by_popularity
// @name:zh-CN        pixiv_sort_by_popularity
// @name:zh-TW        pixiv_sort_by_popularity
// @name:ja        pixiv_sort_by_popularity
// @name:ru        pixiv_sort_by_popularity
// @name:kr        pixiv_sort_by_popularity
// @namespace   pixiv_sort_by_popularity
// @supportURL  https://github.com/zhuzemin
// @description non premium menber use "Sort by popularity"
// @description:zh-CN non premium menber use "Sort by popularity"
// @description:zh-TW non premium menber use "Sort by popularity"
// @description:ja non premium menber use "Sort by popularity"
// @description:ru non premium menber use "Sort by popularity"
// @description:kr non premium menber use "Sort by popularity"
// @include     https://www.pixiv.net/*/tags/*
// @include     https://www.pixiv.net/tags/*
// @version     1.21
// @run-at      document-end
// @author      zhuzemin
// @license     Mozilla Public License 2.0; http://www.mozilla.org/MPL/2.0/
// @license     CC Attribution-ShareAlike 4.0 International; http://creativecommons.org/licenses/by-sa/4.0/
// @grant       GM_xmlhttpRequest
// @grant         GM_registerMenuCommand
// @grant         GM_setValue
// @grant         GM_getValue
// @connect-src workers.dev
// @contributionAmount 0.5
// @contributionURL https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=rzzm@hotmail.com&item_name=Greasy+Fork+donation
// ==/UserScript==
var config = {
    'debug': false,
    'bookmarkSupport': true //set this option to true, will enable bookmark cue(*red heart) in search result page, but page loading may slower.
}
var debug = config.debug ? console.log.bind(console)  : function () {
};

//this userscript desire for free member use "Sort by popularity"

//default
//pixiv search request through this url will use my cookie.
var cloudFlareUrl='https://proud-surf-e590.zhuzemin.workers.dev/ajax/';

//Obejct use for xmlHttpRequest
class requestObject{
    constructor(originUrl,page,order) {
        this.method = 'GET';
        this.url = cloudFlareUrl+originUrl
            .replace(/(https:\/\/www\.pixiv\.net\/)(\w*\/)?tags\/([^\/]*)\/(\w*)\?([^\/\?]*)/,
                function($1,$2,$3,$4,$5){ return $1+'ajax/search/'+$4+'/'+$3+'?'+$5;})
            .replace(/p=\d*/,'').replace(/order=[_\w]*/,'')+'&p='+page+'&order='+order;
        this.data=null,
            this.responseType='json',
            this.headers = {
                'User-agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:68.0) Gecko/20100101 Firefox/68.0',
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
                //'Accept': 'application/atom+xml,application/xml,text/xml',
                //'Referer': window.location.href,
            };
        this.charset = 'text/plain;charset=utf8';
        this.package=null;
    }
}

var btn;
let illustId_list=[];

// prepare UserPrefs
setUserPref(
    'cloudFlareUrl',
    cloudFlareUrl,
    'Set cloudFlareUrl',
    `cloudFlareUrl only working on "Sort by popularity"`,
    ','
);


//for override fetch, I think override function sure insert to page, otherwise userscript don't have permission modified fetch in page?
function addJS_Node (text)
{
    var scriptNode                      = document.createElement ('script');
    scriptNode.type                     = "text/javascript";
    if (text)  scriptNode.textContent   = text;

    var targ    = document.getElementsByTagName('head')[0] || d.body || d.documentElement;
    targ.appendChild (scriptNode);
}



//override fetch
function intercept(){
    //insert override function to page
    addJS_Node(`
    var newData;
    var interceptEnable;
    var newUrl;
    var constantMock = window.fetch;
    window.fetch = function() {
    if(interceptEnable&&/https:\\/\\/www\\.pixiv\\.net\\/ajax\\/search\\//.test(arguments[0])){
        arguments[0]=newUrl;
        //console.log(arguments);
    }
    return new Promise((resolve, reject) => {
        constantMock.apply(this, arguments)
            .then((response) => {
    if(interceptEnable&&/https:\\/\\/www\\.pixiv\\.net\\/ajax\\/search\\//.test(response.url)){
       var blob = new Blob([newData], {type : 'application/json'});
         //console.log(newData);

        var newResponse=new Response(
        blob, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
        //console.log(newResponse);
                    response=newResponse;
                    interceptEnable=false;
    }
                resolve(response);
            })
            .catch((error) => {
                reject(response);
            })
    });
 }
         `);
    //here is script end,
    //in console ,log show fetch response body has been changed <--- not very sure
    //and page have react ---> stay blank for ever
    //my confuse is: even comment "return data" (line:93), page still return blank,
    //that makes me wonder: maybe this override function miss something.
    //if my terrible code can be understanding somehow,
    //and knoa san have nothing else todo in leisure time,
    //knoa san can you take while, look my newbie problem?
    //of cource if too painful read my code, I totally understand!
    //knoa san can read to here already be my greatest honor, and I'm very happy!
}

//userscript entry
var init=function(){
    //create button
    if(window.self === window.top){
        debug("init");
        cloudFlareUrl=GM_getValue('cloudFlareUrl')||cloudFlareUrl;
        intercept();
        var interval=setInterval(function () {
            var navList=document.querySelectorAll('nav');
            debug('navList.length: '+navList.length)
            if(navList.length==2){
                nav=navList[1];
                debug('nav: '+nav.innerHTML)
                var nav=document.querySelector('nav');
                btn =document.createElement('button');
                btn.innerHTML='Sort by popularity';
                btn.addEventListener('click',sortByPopularity);
                nav.insertBefore(btn,null);
                select=document.createElement('select');
                select.id='sortByPopularity';
                var optionObj={
                    'Popular with all':'popular_d',
                    'Popular (male)':'popular_male_d',
                    'Popular (female)':'popular_female_d'
                }
                for(var key of Object.keys(optionObj)){
                    var option=document.createElement('option');
                    option.innerHTML=key;
                    option.value=optionObj[key];
                    select.insertBefore(option,null);
                }
                nav.insertBefore(select,null);
                let elm_Message=document.querySelector('button[title="Message"]');
                if(elm_Message==null){
                    btn.disabled=true;
                    let lebal=document.createElement('lebal');
                    lebal.innerHTML='Login required';
                    lebal.style.color='red';
                    nav.insertBefore(lebal,btn);
                }
                clearInterval(interval);

            }
        },4000);
    }

}

window.addEventListener('load', init);

//get current search word, then use xmlHttpRequest get response(from my server)
function sortByPopularity(e) {
    btn.innerHTML='Searching...'
    try{
        var page;
        //var matching=window.location.href.match(/https:\/\/www\.pixiv\.net\/(\w*\/)?tags\/(.*)\/\w*\?(order=[^\?&]*)?&?(mode=(\w\d*))?&?(p=(\d*))?/);
        debug(e.target.tagName);
        if(/(\d*)/.test(e.target.textContent)&&(e.target.tagName.toLowerCase()=='span'||e.target.tagName.toLowerCase()=="a")){
            page=e.target.textContent.match(/(\d*)/)[1];
        }
        else if(e.target.tagName.toLowerCase()=='svg'||e.target.tagName.toLowerCase()=='polyline'){
            //debug('e.target.parentElement.tagName: '+e.target.parentElement.tagName);
            if(e.target.parentElement.tagName.toLowerCase()=='a'){
                page=e.target.parentElement.href.match(/p=(\d*)/)[1];

            }
            else {
                page=e.target.parentElement.parentElement.href.match(/p=(\d*)/)[1];

            }
        }
        //for test
        /*else if(matching[7]!=null){
            page=matching[7];
        }*/
        else{
            page=1;
        }
        page=parseInt(page);
        debug('page: '+page);
        var order=document.querySelector('#sortByPopularity').value;
        var obj=new requestObject(window.location.href,page,order);
        obj.package=page;
        debug('JSON.stringify(obj): '+JSON.stringify(obj));
        getBookmark(obj);

    }
    catch (e) {
        debug('[Error]: '+e)
    }

}


function getBookmark(obj, totalPageNum=1, pageNum=1 ) {
    if(config.bookmarkSupport){
        let reqObj=new requestObject('','','');
        reqObj.url='https://www.pixiv.net/bookmark.php?rest=show&p='+pageNum;
        reqObj.responseType='text';
        request(reqObj,function (responseDetails,package) {
            let dom = new DOMParser().parseFromString(responseDetails.responseText, "text/html");
            let count_badge=parseInt(dom.querySelector('span.count-badge').textContent.match(/(\d{1,9})/)[1]);
            if(count_badge>0){
                for(let elem of dom.querySelectorAll('li.image-item')){
                    let illustId = elem.querySelector('a').href.match(/(\d{1,20})/)[1];
                    debug('illustId: '+illustId);
                    illustId_list.push(illustId);
                }
                let elm_page_list=dom.querySelector('ul.page-list');
                if(elm_page_list!=null){
                    totalPageNum=elm_page_list.childElementCount;
                    debug('totalPageNum: '+totalPageNum);
                }
            }
            if(pageNum!=totalPageNum){
                pageNum++;
                getBookmark(obj, totalPageNum,pageNum);
                debug('pageNum: '+pageNum);
            }
            else{
                debug('illustId_list: '+illustId_list);
                request(obj,replaceContent);

            }

        });

    }
    else {
        debug('illustId_list: '+illustId_list);
        request(obj,replaceContent);

    }
}

function replaceContent(responseDetails, obj) {
    let page =obj.package;
    debug("responseDetails.response: "+JSON.stringify(responseDetails.response));
    let remoteResponse=responseDetails.response;
    if(illustId_list!=[]){
        for(let data of remoteResponse.body.illustManga.data){
            if(illustId_list.includes(data.illustId)){
                debug('data.illustId: '+data.illustId);
                data.bookmarkData={"id":"123","private":false};
            }
        }
    }
    debug("remoteResponse: "+JSON.stringify(remoteResponse));
    debug("remoteResponse.body.illustManga.data[0]: "+JSON.stringify(remoteResponse.body.illustManga.data[0]));
    unsafeWindow.newData=JSON.stringify(remoteResponse,null,2);
    unsafeWindow.interceptEnable=true;
    unsafeWindow.newUrl=obj.url.replace(cloudFlareUrl+'https://www.pixiv.net','');
    //trigger fetch by click "Newest" or "Oldest"
    var spanList=document.querySelectorAll('span');
    for(var span of spanList){
        if(/(Newest)|(Oldest)|(按最新排序)|(按旧|舊排序)|(新しい順)|(古い順)|(최신순)|(과거순)/.test(span.textContent)){
            if(span.parentElement.tagName.toLowerCase()=='a'){
                span.parentElement.click();
                break;
            }
        }
    }
    var interval=setInterval(function () {
        var navList=document.querySelectorAll('nav');
        debug('navList.length: '+navList.length)
        if(navList.length==2){
            nav=navList[1];
            debug('nav: '+nav.innerHTML)
            nav.addEventListener('click',sortByPopularity);
            if(page<=7&&page>1){
                //nav button "1" text -> current page number
                nav.childNodes[1].childNodes[0].innerText=page;
                //nav button "1" href -> current page href
                nav.childNodes[1].href=nav.childNodes[page].href;
                //current page button text -> "1"
                nav.childNodes[page].innerText=1;
                //current page button href -> origin nav button "1" href
                nav.childNodes[page].href=nav.childNodes[0].href;
                //switch two button positon
                nav.insertBefore(nav.childNodes[1],nav.childNodes[page]);
                nav.insertBefore(nav.childNodes[page],nav.childNodes[1]);

            }
            else if(page>7){
                var currentPositionInNav=page%7;
                debug("currentPositionInNav: "+currentPositionInNav);
                var buttonStartNumber=page-currentPositionInNav;
                debug("buttonStartNumber: "+buttonStartNumber);
                var navButtonCount=1;
                //switch two button positon
                nav.insertBefore(nav.childNodes[1],nav.childNodes[currentPositionInNav+1]);
                nav.insertBefore(nav.childNodes[currentPositionInNav+1],nav.childNodes[1]);
                for(var i=buttonStartNumber;i<=(buttonStartNumber+6);i++){
                    debug("navButtonCount: "+navButtonCount);
                    debug("i: "+i);
                    nav.childNodes[navButtonCount].childNodes[0].innerText=i;
                    nav.childNodes[navButtonCount].href=nav.childNodes[8].href.replace(/p=\d*/,'p='+(i));
                    navButtonCount++;
                }
            }
            if(page!=1){
                //display previous button
                nav.childNodes[0].style='opacity:1!important;';
                //previous button href
                nav.childNodes[0].href=nav.childNodes[8].href.replace(/p=\d*/,'p='+(page-1));
                //next button href
                nav.childNodes[8].href=nav.childNodes[8].href.replace(/p=\d*/,'p='+(page+1));

            }
            btn.innerHTML='Sort by popularity';
            clearInterval(interval);

        }
    },4000);
}


function request(object,func) {
    GM_xmlhttpRequest({
        method: object.method,
        url: object.url,
        headers: object.headers,
        responseType: object.responseType,
        overrideMimeType: object.charset,
        timeout: 60000,
        //synchronous: true
        onload: function (responseDetails) {
            debug(responseDetails);
            //Dowork
            func(responseDetails,object);
        },
        ontimeout: function (responseDetails) {
            //Dowork
            func(responseDetails);

        },
        ononerror: function (responseDetails) {
            debug(responseDetails);
            //Dowork
            func(responseDetails);

        }
    });
}
function setUserPref(varName, defaultVal, menuText, promtText, sep){
    GM_registerMenuCommand(menuText, function() {
        var val = prompt(promtText, GM_getValue(varName, defaultVal));
        if (val === null)  { return; }  // end execution if clicked CANCEL
        // prepare string of variables separated by the separator
        if (sep && val){
            var pat1 = new RegExp('\\s*' + sep + '+\\s*', 'g'); // trim space/s around separator & trim repeated separator
            var pat2 = new RegExp('(?:^' + sep + '+|' + sep + '+$)', 'g'); // trim starting & trailing separator
            //val = val.replace(pat1, sep).replace(pat2, '');
        }
        //val = val.replace(/\s{2,}/g, ' ').trim();    // remove multiple spaces and trim
        GM_setValue(varName, val);
        // Apply changes (immediately if there are no existing highlights, or upon reload to clear the old ones)
        //if(!document.body.querySelector(".THmo")) THmo_doHighlight(document.body);
        //else location.reload();
    });
}
