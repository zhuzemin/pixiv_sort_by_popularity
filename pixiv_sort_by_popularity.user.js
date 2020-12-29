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
// @version     1.23
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


//this userscript desire for free member use "Sort by popularity"


//config
let config = {
    'debug': false,
    api: {
        'base': 'https://proud-surf-e590.zhuzemin.workers.dev',
        //pixiv search request through this url will use premium user.
        'ajax': null,
        //get premium users number
        'userNum': null,
        //share cookie
        'share': null,
        'guides': 'https://zhuzemin4.github.io/pixiv_sort_by_popularity',
        'bookmark': 'https://www.pixiv.net/bookmark.php?rest=show&p=',
    },
    'nav': null,
    'btn': null,
    'bookmarkSupport': GM_getValue('bookmarkSupport'), //support bookmark in search result page, but loading will slower.
    'illustId_list': [],
}
config.api.ajax = config.api.base + '/ajax';
config.api.userNum = config.api.base + '/userNum';
config.api.share = config.api.base + '/share';
var debug = config.debug ? console.log.bind(console) : function () {
};


// prepare UserPrefs
setUserPref(
    'bookmarkSupport',
    false,
    'bookmark support',
    `support bookmark in search result page, but loading will slower.`,
);


// prepare UserPrefs
setUserPref(
    'shareCookie',
    'PHPSESSID=***_******, 30',
    'Share my cookie',
    `This script depend pixiv premium user share his cookie, for keep script work need at least one user register pixiv premium and share his cookie.\n 
    but because security strategy of browser, userscript can't get cookie automaticatlly,\n
    here is a guides to teach you get cookie, than you can come back fill those parameters below.
    *Guides----> `+ config.api.guides + `
    *Second parameter is how many days you want cookie be share.`,
    shareCookie,
);


/**
 * Obejct use for xmlHttpRequest
 * @param {string} originUrl
 * @param {int} page
 * @param {string} order
 */
class requestObject {
    constructor(originUrl, page = null, order = null) {
        this.method = 'GET';
        this.respType = 'json';
        this.url = originUrl;
        if (order != null) {
            this.url = config.api.ajax + '/' + originUrl
                .replace(/(https:\/\/www\.pixiv\.net\/)(\w*\/)?tags\/([^\/]*)\/(\w*)\?([^\/\?]*)/,
                    function (match, $1, $2, $3, $4, $5, offset, original) { return $1 + 'ajax/search/' + $4 + '/' + $3 + '?' + $5; })
                .replace(/p=\d*/, '').replace(/order=[_\w]*/, '') + '&p=' + page + '&order=' + order;
        }
        else if (page != null) {
            this.url = originUrl + page;
        }
        this.body = null;
        this.headers = {
            "Content-Type": "application/x-www-form-urlencoded",
            'User-agent': window.navigator.userAgent,
            'Referer': window.location.href,
        };
        this.package = null;
    }
}


//for override fetch, I think override function sure insert to page, otherwise userscript don't have permission modified fetch in page?
function addJS_Node(text) {
    var scriptNode = document.createElement('script');
    scriptNode.type = "text/javascript";
    if (text) scriptNode.textContent = text;

    var targ = document.getElementsByTagName('head')[0] || d.body || d.documentElement;
    targ.appendChild(scriptNode);
}


//override fetch
function intercept() {
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
var init = function () {
    //create button
    if (window.self === window.top) {
        debug("init");
        var interval = setInterval(function () {
            var navList = document.querySelectorAll('nav');
            debug('navList.length: ' + navList.length)
            if (navList.length == 2) {
                clearInterval(interval);
                config.nav = navList[0];
                config.btn = document.createElement('button');
                config.btn.innerHTML = 'Sort by popularity';
                config.btn.addEventListener('click', sortByPopularity);
                config.btn.disabled = true;
                config.nav.insertBefore(config.btn, null);
                let select = document.createElement('select');
                select.id = 'sortByPopularity';
                var optionObj = {
                    'Popular with all': 'popular_d',
                    'Popular (male)': 'popular_male_d',
                    'Popular (female)': 'popular_female_d'
                }
                for (var key of Object.keys(optionObj)) {
                    var option = document.createElement('option');
                    option.innerHTML = key;
                    option.value = optionObj[key];
                    select.insertBefore(option, null);
                }
                config.nav.insertBefore(select, null);
                if (config.bookmarkSupport) {
                    if (unsafeWindow.dataLayer[0].login != 'yes') {
                        let lebal = document.createElement('lebal');
                        lebal.innerHTML = 'bookmark support need login';
                        lebal.style.color = 'red';
                        config.nav.insertBefore(lebal, config.btn);
                        return;
                    }
                }
                getPreUserNum();
            }
        }, 4000);
    }

}
window.addEventListener('load', init);


//get current search word, then use xmlHttpRequest get response(from my server)
function sortByPopularity(e) {
    config.btn.innerHTML = 'Searching...'
    try {
        var page;
        //var matching=window.location.href.match(/https:\/\/www\.pixiv\.net\/(\w*\/)?tags\/(.*)\/\w*\?(order=[^\?&]*)?&?(mode=(\w\d*))?&?(p=(\d*))?/);
        debug(e.target.tagName);
        if (/(\d*)/.test(e.target.textContent) && (e.target.tagName.toLowerCase() == 'span' || e.target.tagName.toLowerCase() == "a")) {
            page = e.target.textContent.match(/(\d*)/)[1];
        }
        else if (e.target.tagName.toLowerCase() == 'svg' || e.target.tagName.toLowerCase() == 'polyline') {
            //debug('e.target.parentElement.tagName: '+e.target.parentElement.tagName);
            if (e.target.parentElement.tagName.toLowerCase() == 'a') {
                page = e.target.parentElement.href.match(/p=(\d*)/)[1];

            }
            else {
                page = e.target.parentElement.parentElement.href.match(/p=(\d*)/)[1];

            }
        }
        //for test
        /*else if(matching[7]!=null){
            page=matching[7];
        }*/
        else {
            page = 1;
        }
        page = parseInt(page);
        debug('page: ' + page);
        var order = document.querySelector('#sortByPopularity').value;
        var obj = new requestObject(window.location.href, page, order);
        obj.package = page;
        debug('JSON.stringify(obj): ' + JSON.stringify(obj));
        getBookmark(obj);

    }
    catch (e) {
        debug('[Error]: ' + e)
    }

}


function getBookmark(obj, totalPage = 1, page = 1) {
    if (config.bookmarkSupport) {
        let reqObj = new requestObject(config.api.bookmark, page);
        reqObj.respType = 'text';
        request(reqObj, function (responseDetails, package) {
            if (responseDetails.responseText != null) {
                let dom = new DOMParser().parseFromString(responseDetails.responseText, "text/html");
                let count_badge = parseInt(dom.querySelector('span.count-badge').textContent.match(/(\d{1,9})/)[1]);
                if (count_badge > 0) {
                    for (let elem of dom.querySelectorAll('li.image-item')) {
                        let illustId = elem.querySelector('a').href.match(/(\d{1,20})/)[1];
                        debug('illustId: ' + illustId);
                        config.illustId_list.push(illustId);
                    }
                    let elm_page_list = dom.querySelector('ul.page-list');
                    if (elm_page_list != null) {
                        totalPage = elm_page_list.childElementCount;
                        debug('totalPage: ' + totalPage);
                    }
                }
                if (page != totalPage) {
                    page++;
                    getBookmark(obj, totalPage, page);
                    debug('page: ' + page);
                }
                else {
                    debug('config.illustId_list: ' + config.illustId_list);
                    request(obj, replaceContent);

                }

            }
            else {
                request(obj, replaceContent);
            }
        });

    }
    else {
        debug('config.illustId_list: ' + config.illustId_list);
        request(obj, replaceContent);

    }
}


function replaceContent(responseDetails, obj) {
    let page = obj.package;
    debug("responseDetails.response: " + JSON.stringify(responseDetails.response));
    let remoteResponse = responseDetails.response;
    if (config.illustId_list.length > 0) {
        for (let data of remoteResponse.body.illustManga.data) {
            debug('data.illustId: ' + data.id);
            if (config.illustId_list.includes(data.id)) {
                debug('data.illustId: ' + data.id);
                data.bookmarkData = { "id": "123", "private": false };
            }
        }
    }
    debug("remoteResponse: " + JSON.stringify(remoteResponse));
    //debug("remoteResponse.body.illustManga.data[0]: "+JSON.stringify(remoteResponse.body.illustManga.data[0]));
    unsafeWindow.newData = JSON.stringify(remoteResponse, null, 2);
    unsafeWindow.interceptEnable = true;
    unsafeWindow.newUrl = obj.url.replace(config.api.ajax + 'https://www.pixiv.net', '');
    //trigger fetch by click "Newest" or "Oldest"
    var spanList = document.querySelectorAll('span');
    for (var span of spanList) {
        if (/(Newest)|(Oldest)|(按最新排序)|(按旧|舊排序)|(新しい順)|(古い順)|(최신순)|(과거순)/.test(span.textContent)) {
            if (span.parentElement.tagName.toLowerCase() == 'a') {
                span.parentElement.click();
                break;
            }
        }
    }
    var interval = setInterval(function () {
        var navList = document.querySelectorAll('nav');
        debug('navList.length: ' + navList.length)
        if (navList.length == 2) {
            let nav = navList[1];
            debug('nav: ' + nav.innerHTML)
            nav.addEventListener('click', sortByPopularity);
            if (page <= 7 && page > 1) {
                //nav button "1" text -> current page number
                nav.childNodes[1].childNodes[0].innerText = page;
                //nav button "1" href -> current page href
                nav.childNodes[1].href = nav.childNodes[page].href;
                //current page button text -> "1"
                nav.childNodes[page].innerText = 1;
                //current page button href -> origin nav button "1" href
                nav.childNodes[page].href = nav.childNodes[0].href;
                //switch two button positon
                nav.insertBefore(nav.childNodes[1], nav.childNodes[page]);
                nav.insertBefore(nav.childNodes[page], nav.childNodes[1]);

            }
            else if (page > 7) {
                var currentPositionInNav = page % 7;
                debug("currentPositionInNav: " + currentPositionInNav);
                var buttonStartNumber = page - currentPositionInNav;
                debug("buttonStartNumber: " + buttonStartNumber);
                var navButtonCount = 1;
                //switch two button positon
                nav.insertBefore(nav.childNodes[1], nav.childNodes[currentPositionInNav + 1]);
                nav.insertBefore(nav.childNodes[currentPositionInNav + 1], nav.childNodes[1]);
                for (var i = buttonStartNumber; i <= (buttonStartNumber + 6); i++) {
                    debug("navButtonCount: " + navButtonCount);
                    debug("i: " + i);
                    nav.childNodes[navButtonCount].childNodes[0].innerText = i;
                    nav.childNodes[navButtonCount].href = nav.childNodes[8].href.replace(/p=\d*/, 'p=' + (i));
                    navButtonCount++;
                }
            }
            if (page != 1) {
                //display previous button
                nav.childNodes[0].style = 'opacity:1!important;';
                //previous button href
                nav.childNodes[0].href = nav.childNodes[8].href.replace(/p=\d*/, 'p=' + (page - 1));
                //next button href
                nav.childNodes[8].href = nav.childNodes[8].href.replace(/p=\d*/, 'p=' + (page + 1));

            }
            config.btn.innerHTML = 'Sort by popularity';
            clearInterval(interval);

        }
    }, 4000);
}


function request(object, func, timeout = 60000) {
    GM_xmlhttpRequest({
        method: object.method,
        url: object.url,
        headers: object.headers,
        responseType: object.respType,
        data: object.body,
        timeout: timeout,
        onload: function (responseDetails) {
            debug(responseDetails);
            //Dowork
            func(responseDetails, object);
        },
        ontimeout: function (responseDetails) {
            debug(responseDetails);
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


//get premium users number
function getPreUserNum() {
    debug('getPreUserNum');
    let obj = new requestObject(config.api.userNum);
    obj.respType = 'json';
    request(obj, function (responseDetails) {
        debug('responseDetails.status: ' + responseDetails.status);
        if (responseDetails.status == 200) {
            let json = responseDetails.response;
            let num = json.data.userNum;
            debug('num: ' + num);
            if (num > 0) {
                config.btn.disabled = false;
                intercept();
            }
            let style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = `
        [data-tooltip]:before {
            /* needed - do not touch */
            content: attr(data-tooltip);
            position: absolute;
            opacity: 0;
            
            /* customizable */
            transition: all 0.15s ease;
            padding: 10px;
            color: #333;
            border-radius: 5px;
            box-shadow: 2px 2px 1px silver;    
        }
        
        [data-tooltip]:hover:before {
            /* needed - do not touch */
            opacity: 1;
            
            /* customizable */
            background: white;
            margin-top: -50px;
            margin-left: 20px;    
        }
            `;
            document.getElementsByTagName('head')[0].appendChild(style);
            config.btn.setAttribute('data-tooltip', 'Current shared premium user: ' + num);
        }
    });
}


/**
 * Create a user setting prompt
 * @param {string} varName
 * @param {any} defaultVal
 * @param {string} menuText
 * @param {string} promtText
 * @param {function} func
 * @param {string} sep
 */
function setUserPref(varName, defaultVal, menuText, promtText, func = null) {
    GM_registerMenuCommand(menuText, function () {
        var val = prompt(promtText, GM_getValue(varName, defaultVal));
        if (val === null) { return; }  // end execution if clicked CANCEL
        GM_setValue(varName, val);
        if (func != null) {
            func(val);
        }
    });
}


//share cookie
function shareCookie(val) {
    if (/[^,]+,\s?\d+/.test(val)) {
        if (unsafeWindow.dataLayer[0].premium == 'yes') {
            let array = val.split(',');
            let userId = unsafeWindow.dataLayer[0].user_id;
            let cookie = array[0];
            let expire = array[1].trim();
            let obj = new requestObject(config.api.share);
            obj.method = 'POST';
            obj.respType = 'json';
            obj.body = encodeURIComponent(
                JSON.stringify(
                    {
                        'key': 'user:' + userId,
                        'value': null,
                        'metadata': {
                            'userId': userId,
                            'cookie': cookie,
                            'expire': expire,
                        },
                    }
                )
            );
            debug('obj: ' + JSON.stringify(obj));
            request(obj, function (responseDetails) {
                let json = responseDetails.response;
                debug('json: ' + JSON.stringify(json));
                if (responseDetails.status == 200) {
                    if (json.status == 200) {
                        alert('Share success, thank you!');
                    }
                }
            });
        }
        else {
            alert('You are not premium user.');
        }
    }
    else {
        alert('Parameter invalid.');
    }
}