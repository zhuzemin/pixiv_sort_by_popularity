// ==UserScript==
// @name        pixiv_sort_by_popularity
// @name:zh-CN        pixiv_sort_by_popularity
// @name:zh-TW        pixiv_sort_by_popularity
// @name:ja        pixiv_sort_by_popularity
// @namespace   pixiv_sort_by_popularity
// @supportURL  https://github.com/zhuzemin
// @description no premium menber use "Sort by popularity"
// @description:zh-CN no premium menber use "Sort by popularity"
// @description:zh-TW no premium menber use "Sort by popularity"
// @description:ja no premium menber use "Sort by popularity"
// @include     https://www.pixiv.net/*/tags/*
// @include     https://www.pixiv.net/tags/*
// @version     1.0
// @run-at      document-start
// @author      zhuzemin
// @license     Mozilla Public License 2.0; http://www.mozilla.org/MPL/2.0/
// @license     CC Attribution-ShareAlike 4.0 International; http://creativecommons.org/licenses/by-sa/4.0/
// @grant       GM_xmlhttpRequest
// @grant         GM_registerMenuCommand
// @grant         GM_setValue
// @grant         GM_getValue
// @connect-src workers.dev
// ==/UserScript==
var config = {
  'debug': true
}
var debug = config.debug ? console.log.bind(console)  : function () {
};

//this userscript desire for free member use "Sort by popularity"


//pixiv search request through this url will use my cookie.(I'm not premium...)
var cloudFlareUrl='https://proud-surf-e590.zhuzemin.workers.dev/ajax/';

//Obejct use for xmlHttpRequest
class requestObject{
    constructor(keyword) {
        this.method = 'GET';
        this.url = cloudFlareUrl+'https://www.pixiv.net/ajax/search/artworks/'+keyword+'?word='+keyword+'&order=date&mode=all&p=1&s_mode=s_tag&type=all';
        this.data=null,
            this.headers = {
                'User-agent': 'Mozilla/4.0 (compatible) Greasemonkey',
                'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8'
                //'Accept': 'application/atom+xml,application/xml,text/xml',
                //'Referer': window.location.href,
            };
        this.charset = 'text/plain;charset=utf8';
        this.package=null;
    }
}


// prepare UserPrefs
setUserPref(
    'cloudFlareUrl',
    cloudFlareUrl,
    'Set cloudFlareUrl',
    `cloudFlareUrl only working for "Sort by popularity"`,
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
function intercept(responseDetails){
    //response from my server
    var newData=responseDetails.response;
    debug(newData);
    //insert override function to page, include response
    addJS_Node(`
    var originalFetch = fetch;
    fetch = function() {
        return originalFetch.apply(this,arguments).then((response) => {
    console.log(response.url);
    if(response.url.includes('https://www.pixiv.net/ajax/search/artworks/')){
    response.json().then((data) => {
        console.log(data);
        data=`+JSON.stringify(newData)+`;
        console.log(data);
        return data;
    });
    }
});
    };
 `);
    //trigger fetch by click "Newest" or "Oldest"
    var div=document.querySelectorAll('div.sc-LzMhL.krKUte')[1];
    div.querySelector('a').click();

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
        debug("init");
        //create button
    var div=document.querySelectorAll('div.sc-LzMhL.krKUte')[1];
    var btn =document.createElement('button');
    btn.innerHTML='Sort by popularity';
        btn.addEventListener('click',sortByPopularity);
    div.insertBefore(btn,null);
}

window.addEventListener('load', init);

//get current search word, then use xmlHttpRequest get response(from my server)
function sortByPopularity() {
    var keyword=window.location.href.match(/https:\/\/www\.pixiv\.net\/(\w*\/)?tags\/(.*)\//)[2];
    debug(keyword);
    var obj=new requestObject(keyword);
    request(obj,intercept);

}
function request(object,func) {
    var retries = 3;
    GM_xmlhttpRequest({
        method: object.method,
        url: object.url,
        headers: object.headers,
        responseType: 'json',
        overrideMimeType: object.charset,
        timeout: 60000,
        //synchronous: true
        onload: function (responseDetails) {
            if (responseDetails.status != 200) {
                // retry
                if (retries--) {          // *** Recurse if we still have retries
                    setTimeout(request(),2000);
                    return;
                }
            }
            debug(responseDetails);
            //Dowork
            func(responseDetails);
        },
        ontimeout: function (responseDetails) {
            debug(responseDetails);
            // retry
            if (retries--) {          // *** Recurse if we still have retries
                setTimeout(request,2000);
                return;
            }
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
