/**
 * Created by nbugash on 12/01/16.
 */

/* GLOBAL VARIABLE*/
var encodedHTTPRequest;
var restrictedChromeHeaders = [
    "ACCEPT-CHARSET",
    "ACCEPT-ENCODING",
    "ACCESS-CONTROL-REQUEST-HEADERS",
    "ACCESS-CONTROL-REQUEST-METHOD",
    "CONTENT-LENGTHNECTION",
    "CONTENT-LENGTH",
    "COOKIE",
    "CONTENT-TRANSFER-ENCODING",
    "DATE",
    "EXPECT",
    "HOST",
    "KEEP-ALIVE",
    "ORIGIN",
    "REFERER",
    "TE",
    "TRAILER",
    "TRANSFER-ENCODING",
    "UPGRADE",
    "USER-AGENT",
    "VIA"
];
var token = "appspider-";
var global_headers;
/* Helper functions */
var httpFunctions = {
    decodeRequest: function (encodedRequest) {
        return window.atob(encodedRequest);
    },

    /* Split the decoded request to multiple requests*/
    splitRequests: function (decodedRequests) {
        var requests = decodedRequests.split(/(#H#G#F#E#D#C#B#A#)/);
        for (var i = 0; i < requests.length; i++) {
            if (requests[i].match(/(#H#G#F#E#D#C#B#A#)/)) {
                delete requests[i];
            }
        }
        return requests;
    },

    /* Split the request to header, payload, and description */
    splitRequest: function (request) {
        var array = request.split(/(A#B#C#D#E#F#G#H#)/);
        var header_payload = array[0];
        return {
            header: header_payload.split('\r\n\r\n')[0].trim(),
            payload: header_payload.split('\r\n\r\n')[1].trim(),
            description: array[2].trim()
        }
    },

    convertHeaderStringToJSON: function (headerString) {
        var headerArray = headerString.split("\r\n");
        var header = {};
        for (var i = 0; i < headerArray.length; i++) {
            if (headerArray[i].toUpperCase().match(/GET|POST|PUT|DELETE/)) {
                var request = headerArray[i].split(" ");
                header['REQUEST'] = request;
            } else if (headerArray[i].indexOf(":") > -1) {
                var a = headerArray[i].split(":");
                var header_name = a[0].trim();
                switch(header_name) {
                    case "Referer":
                        header[header_name] = a.slice(1).join(":").trim();
                        break;
                    case "Cookie":
                        var cookiearray = a[a.length - 1].split(';');
                        var cookieValues = {};
                        for (var x = 0; x < cookiearray.length; x++) {
                            if (cookiearray[x].indexOf("=") > -1){
                                var array = cookiearray[x].split("=");
                                cookieValues[array[0].trim()] = array[array.length -1].trim();
                            }
                        }
                        header[header_name] = cookieValues;
                        break;
                    default:
                        header[header_name] = a[a.length - 1].trim();
                        break;
                }
            }
        }
        return header;
    }

};

/* Coming from the Content.js */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    switch (request.from) {
        case "content.js":
            switch (request.type) {
                case "open_validate_page":
                    chrome.tabs.create({
                        url: chrome.extension.getURL('../validate.html'),
                        active: false
                    }, function (tab) {
                        // After the tab has been created, open a window to inject the tab
                        chrome.windows.create({
                            tabId: tab.id,
                            type: 'popup',
                            focused: true,
                            width: 940,
                            height: 745
                            // incognito, top, left, ...
                        });
                    });
                    console.log("Opening validate page");
                    break;
                case "save_encoded_http_request":
                    /* Saving the encodedHTTPRequest */
                    encodedHTTPRequest = request.data.encodedHTTPRequest;
                    console.log("Saving encoded http request");
                    break;
                case "parse_and_save_http_request":
                    /*
                     * (1) Decode request to header, payload, and description
                     * (2) Split request to global_headers and payload
                     * (3) Convert header to json object
                     * (4) Save JSON header, Payload, and Description
                     * */

                    /* (1) Decode request */
                    var decodedRequests = httpFunctions.decodeRequest(encodedHTTPRequest);
                    var requests = httpFunctions.splitRequests(decodedRequests);

                    /* (2) For each requests, split into global_headers and payload */
                    var step = 1;
                    for (var i = 0; i < requests.length; i++) {
                        /* For each defined element */
                        if (requests[i]) {
                            var request = httpFunctions.splitRequest(requests[i]);
                            /* (3) Convert header to JSON Object */
                            request.header = httpFunctions.convertHeaderStringToJSON(request.header);
                            /* (4) Save request as with step being the key */
                            var attack_obj = {};
                            attack_obj[step] = request;
                            chrome.storage.local.set(attack_obj, function () {
                                console.log("Request save to key: '" + step + "'");
                            });
                            step++;
                        }
                    }
                    console.log("http request saved! Clearing encoded http request");
                    encodedHTTPRequest = null;
                    break;
                default:
                    break;
            }
            break;
        default:
            console.log("Background.js: Can not handle request from "+ request.from + " script!!");
            break;
    }
});

chrome.runtime.onConnect.addListener(function(channel) {
    var channel_name = channel.name;
    try {
        channel.onMessage.addListener(function(message){
            switch(channel_name) {
                case "appspider.js":
                    switch(message.type) {
                        case "send_request":
                            /* TODO: return attack_response.header & attack_response.content */
                            var httpRequest = message.data;
                            var xhr = new XMLHttpRequest();
                            global_headers = {};
                            xhr.onreadystatechange = function () {
                                if (xhr.readyState === 4 && xhr.status === 200) {
                                    channel.postMessage({
                                        type: 'http_response',
                                        data: {
                                            header: xhr.getAllResponseHeaders(),
                                            content: xhr.responseText
                                        }
                                    });
                                } else {
                                    /* Need to better handle an invalid http request / response*/
                                    channel.postMessage({
                                        type: 'http_response_error',
                                        data: {
                                            header: 'Request error',
                                            content: 'Unable to send attack request'
                                        }
                                    });
                                }
                            };
                            switch (httpRequest.http_request_type.toUpperCase()) {
                                case 'GET':
                                    xhr.open('GET', httpRequest.url, true);
                                    break;
                                case 'POST':
                                    xhr.open('POST', httpRequest.url, true);
                                    break;
                                default:
                                    console.error("Background.js: Unable to handle http request type: "
                                        + httpRequest.http_request_type );
                                    break;
                            }
                            for (var header in httpRequest.headers) {
                                if (restrictedChromeHeaders.indexOf(header.toUpperCase()) > -1) {
                                    switch(header) {
                                        case 'Cookie':
                                            var cookievalue = "";
                                            for (var cookie in httpRequest.headers.Cookie) {
                                                cookievalue += cookie + "=" + httpRequest.headers.Cookie[cookie] + ";"
                                            }
                                            global_headers[header] = cookievalue;
                                            //httpRequest.global_headers[header] = cookievalue;
                                            //xhr.setRequestHeader(token + header, cookievalue);
                                            break;
                                        default:
                                            global_headers[header] = httpRequest.headers[header];
                                            //xhr.setRequestHeader(token + header, httpRequest.global_headers[header]);
                                            break;
                                    }
                                } else {
                                    xhr.setRequestHeader(header, httpRequest.headers[header]);
                                }
                                //global_headers[header] = httpRequest.global_headers[header];
                            }
                            switch (httpRequest.http_request_type.toUpperCase()) {
                                case 'GET':
                                    xhr.send();
                                    break;
                                case 'POST':
                                    xhr.send(httpRequest.payload);
                                    break;
                            }
                            break;
                        default:
                            console.error("Background.js: Unable to handle request type: "
                                + message.type +" request from " + message.from);
                            break;
                    }
                    break;
                case "app.js":
                    switch(message.type) {
                        case "savehttpHeaders":
                            global_headers = message.data.headers;
                            channel.postMessage({
                                from: "background.js",
                                type: "httpHeaderSaved"
                            });
                            break;
                        default:
                            console.error("Background.js: Unable to handle " + message.type);
                            break;
                    }

                default:
                    break;
            }
        });
    } catch(err) {
        console.error("Background.js: " + err);
    }
});

chrome.webRequest.onBeforeSendHeaders.addListener(
    function (details) {
        try {
            if (details.url.match(new RegExp(global_headers.Host)) ||
                Object.keys(global_headers).length > 0) {
                var headers = details.requestHeaders;
                var cookievalue = "";


                /* Sanitize Global Headers */
                delete global_headers.REQUEST;
                for (var cookie in global_headers.Cookie) {
                    cookievalue += cookie + "=" + global_headers.Cookie[cookie] + ";"
                }
                global_headers.Cookie = cookievalue;
                for (var header in global_headers) {
                    var found = false;
                    for(var index = 0; index < headers.length && !found; index++) {
                        if (headers[index].name.toLowerCase() === header.toLowerCase()) {
                            console.log("Found a match!!");
                            headers[index].value = global_headers[header];
                            delete global_headers[header];
                            found = true;
                        }
                    }
                    if (!found) {
                        headers.push({
                            name: header,
                            value: global_headers[header]
                        });
                        delete global_headers[header];
                    }
                }
            }
        } catch(err) {
            console.log(err);
        }

        //var headers = details.requestHeaders;
        ////for (var header in global_headers ) {
        ////    var found = false;
        ////    for (var index = 0; index < headers.length && !found; index++) {
        ////        if (headers[index].name == header) {
        ////            headers[index].value = global_headers[header];
        ////            found = true;
        ////        }
        ////    }
        ////    if (!found) {
        ////        headers.push({
        ////            name: header,
        ////            value: global_headers[header]
        ////        });
        ////    }
        ////}
        ///* RESET global headers */
        //global_headers = {};
        return {requestHeaders: headers};
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);
