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
var current_step;

var token = 'appspider-';
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
            headers: header_payload.split('\r\n\r\n')[0].trim(),
            payload: header_payload.split('\r\n\r\n')[1].trim(),
            description: array[2].trim()
        }
    },

    convertHeaderStringToJSON: function (headerString) {
        var headerArray = headerString.split("\r\n");
        var headers = {};
        for (var i = 0; i < headerArray.length; i++) {
            if (headerArray[i].toUpperCase().match(/GET|POST|PUT|DELETE/)) {
                var requestArray = headerArray[i].split(" ");
                headers.REQUEST = {
                    method: requestArray[0],
                    uri: requestArray[1],
                    version: requestArray[2]
                };
            } else if (headerArray[i].indexOf(":") > -1) {
                var a = headerArray[i].split(":");
                var header_name = a[0].trim();
                switch(header_name) {
                    case "Referer":
                        headers[header_name] = a.slice(1).join(":").trim();
                        break;
                    case "Cookie":
                        var cookiearray = a[a.length - 1].split(';');
                        var cookieValues = {};
                        for (var x = 0; x < cookiearray.length; x++) {
                            if (cookiearray[x].indexOf("=") > -1) {
                                var array = cookiearray[x].split("=");
                                cookieValues[array[0].trim()] = array[array.length -1].trim();
                            }
                        }
                        headers[header_name] = cookieValues;
                        break;
                    default:
                        headers[header_name] = a[a.length - 1].trim();
                        break;
                }
            }
        }
        return headers;
    }

};

/* Coming from the Content.js */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {

    switch (request.from.toLocaleLowerCase()) {
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
                            request.headers = httpFunctions.convertHeaderStringToJSON(request.headers);
                            //$http({
                            //    method: global_headers.REQUEST.method,
                            //    url: "http://" + global_headers.Host + global_headers.REQUEST.uri,
                            //    data: request.payload
                            //}).then(function successRequest(response){
                            //    console.log("Success http response!!");
                            //    request.response_headers = response.headers();
                            //    request.response_content = response.data;
                            //}, function errorRequest(response){
                            //    console.error("Background.js: Error -" + response);
                            //});

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
                case "send_http_request":
                    /* Getting all steps */
                    chrome.storage.local.get(null, function (attacks) {
                        for (var id in attacks) {
                            console.log("Getting attack with id: " + id);
                            var attack = attacks[id];
                            //var xhr = new XMLHttpRequest();
                            //xhr.onreadystatechange = function(){
                            //    if (xhr.status === 200 && xhr.readyState == 4) {
                            //        console.log("HTTP response success for attack id: " + id );
                            //        attack.response_headers = xhr.getAllResponseHeaders();
                            //        attack.response_content = xhr.responseText;
                            //    } else {
                            //        console.error("Response header error!!");
                            //        attack.response_headers = 'Request Error';
                            //        attack.response_content = 'Unable to send attack request'
                            //    }
                            //};
                            //
                            //xhr.open(
                            //    global_headers.REQUEST.method,
                            //    "http://" + global_headers.Host + global_headers.REQUEST.uri,
                            //    true
                            //);
                            //
                            //switch(global_headers.REQUEST.method.toUpperCase()) {
                            //    case 'GET':
                            //        xhr.send();
                            //        break;
                            //    case 'POST':
                            //        xhr.send(attack.payload);
                            //        break;
                            //    default:
                            //        console.error("Background.js: Unable to send request");
                            //        break;
                            //}

                            var headers = {};
                            for (var header in attack.headers) {
                                if(_.contains(restrictedChromeHeaders, header.toUpperCase())){
                                    if (header === "Cookie") {
                                        var cookie_str = "";
                                        for(var key in attack.headers.Cookie) {
                                            cookie_str += key + "=" + attack.headers.Cookie[key] + "; "
                                        }
                                        headers[token+header] = cookie_str;
                                    } else {
                                        headers[token+header] = attack.headers[header];
                                    }
                                } else {
                                    headers[header] = attack.headers[header];
                                }
                            }
                            var http_request;
                            http_request = $.ajax({
                                type: attack.headers.REQUEST.method,
                                url: "http://" + attack.headers.Host + attack.headers.REQUEST.uri,
                                headers: headers,
                                data: attack.payload,
                                success: function (data, text_status, request) {
                                    attack.response_headers = request.getAllResponseHeaders();
                                    attack.response_content = data;
                                    var attack_obj = {};
                                    attack_obj[id] = attack;
                                    chrome.storage.local.set(attack_obj, function(){
                                        console.log("Attack "+ id + " was saved!!");
                                        return true;
                                    });
                                },
                                error: function(data, text_status, request) {
                                    console.error("Background.js: " + data);
                                }
                            });
                        }
                    });
                    break;
                case "save_http_response":
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
                case "app.js":
                    switch(message.type) {
                        case "setCurrentStep":
                            current_step = message.data.current_step;
                            channel.postMessage({
                                from: "Background.js",
                                type: "currentStep"
                            });
                            break;
                        default:
                            console.error("Background.js: Unable to handle " + message.type);
                            break;
                    }
                case "cookieapp.js":
                    switch(message.type) {
                        case "getCurrentStep":
                            channel.postMessage({
                                from: "Background.js",
                                type: "currentStep",
                                data: {
                                    current_step: current_step
                                }
                            });
                            break;
                        default:
                            break;
                    }
                    break;
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
            //if (Object.getOwnPropertyNames(global_headers).length != 0 &&
            //    details.url.match(new RegExp(global_headers.Host))) {
            //    var headers = details.requestHeaders;
            //    var cookie_string = "";
            //
            //
            //    /* Sanitize Global Headers */
            //    delete global_headers.REQUEST;
            //    for (var cookie in global_headers.Cookie) {
            //        cookie_string += cookie + "=" + global_headers.Cookie[cookie] + ";"
            //    }
            //    global_headers.Cookie = cookie_string;
            //    for (var header in global_headers) {
            //        var found = false;
            //        for(var index = 0; index < headers.length && !found; index++) {
            //            if (headers[index].name.toLowerCase() === header.toLowerCase()) {
            //                console.log("Found a match!!");
            //                headers[index].value = global_headers[header];
            //                delete global_headers[header];
            //                found = true;
            //            }
            //        }
            //        if (!found) {
            //            headers.push({
            //                name: header,
            //                value: global_headers[header]
            //            });
            //            delete global_headers[header];
            //        }
            //    }
            //}

            var headers = details.requestHeaders;
            var map = {};
            var new_headers = [];
            for( var index = 0; index < headers.length; index++) {
                if(!headers[index].name.match(new RegExp(TOKEN))){
                    map[headers[index].name] = headers[index].value;
                }
            }
            for( var index = 0; index < headers.length; index++) {
                if(headers[index].name.match(new RegExp(TOKEN))){
                    //slice the name
                    var name = headers[index].name.slice(TOKEN.length);
                    console.log("Name is " + name);
                    map[name] = headers[index].value;
                }
            }
            for(var key in map) {
                new_headers.push({
                    name: key,
                    value: map[key]
                });
                headers = new_headers;
            }
            console.log("Finished!!!")

        } catch(err) {
            //console.log(err);
        }
        return {requestHeaders: headers};
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);
