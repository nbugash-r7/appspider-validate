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
        if(_.size(request) != 0) {
            var array = request.split(/(A#B#C#D#E#F#G#H#)/);
            var header_payload = array[0];
            return {
                headers: header_payload.split('\r\n\r\n')[0].trim(),
                payload: header_payload.split('\r\n\r\n')[1].trim(),
                description: array[2].trim(),
                response_headers: "Waiting for attack response....",
                response_content: ""
            }
        }


    },

    convertHeaderStringToJSON: function (headerString) {
        var headerArray = headerString.split("\r\n");
        var headers = {};
        for (var i = 0; i < headerArray.length; i++) {
            if (headerArray[i].toUpperCase().match(/(^GET|^POST|^PUT|^DELETE)/)) {
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
                        headers.Referer = a.slice(1).join(":").trim();
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
                        headers.Cookie = cookieValues;
                        break;
                    default:
                        headers[header_name] = a[a.length - 1].trim();
                        break;
                }
            }
        }
        return headers;
    },

    /* Send the request using JQuery and Ajax
     *  Obtain the response */
    sendAttackUsingAJAX: function(attack_id, attack, success, error, always) {
        console.log('Sending attack using JQuery-Ajax!!');
        var headers = {};
        for (var header in attack.headers) {
            /* Append 'appspider-' to restricted chrome headers */
            if(attack.headers.hasOwnProperty(header)){
                if(_.contains(restrictedChromeHeaders, header.toUpperCase())){
                    if (header === "Cookie") {
                        var cookie_str = "";
                        for(var key in attack.headers.Cookie) {
                            if (attack.headers.Cookie.hasOwnProperty(key)){
                                cookie_str += key + "=" + attack.headers.Cookie[key] + "; "
                            }
                        }
                        headers[token+header] = cookie_str;
                    } else {
                        headers[token+header] = attack.headers[header];
                    }
                } else {
                    headers[header] = attack.headers[header];
                }
            }
        }
        /* Using JQuery Ajax Calls */
        $.ajax({
            type: attack.headers.REQUEST.method,
            url: "http://" + attack.headers.Host + attack.headers.REQUEST.uri,
            data: attack.payload,
            beforeSend: function(xhr){
                console.log("Setting request headers for attack id: " + attack_id);
                for (var h in headers) {
                    if(headers.hasOwnProperty(h)){
                        xhr.setRequestHeader(h, headers[h]);
                    }
                }
                console.log("Done customizing request headers!!");
                console.log("Sending attack id: " + attack_id + " using '" +
                    attack.headers.REQUEST.method + "' in AJAX");
            },
            done: function (data, text_status, jqXHR) {
                console.log("Ajax done!!!!!");
                success(data, text_status, jqXHR);
            },
            fail: function(jqXHR, textStatus, errorThrown) {
                console.error("Ajax failed!!!!!");
                error(jqXHR, textStatus, errorThrown);
            },
            always: function(data, text_status, jqXHR) {
                console.log("Ajax always !!!!!");
                always(data, text_status, jqXHR);
            }
        });
    },
    /* Send the request using XMLHTTPRequest
    *  Obtain the response */
    sendAttackUsingXMLHTTPRequest: function(attack_id, attack, success, error) {
        console.log("Sending attack id: " + attack_id + " using XMLHTTPRequest!!");
        var headers = {};
        for (var header in attack.headers) {
            /* Append 'appspider-' to restricted chrome headers */
            if(attack.headers.hasOwnProperty(header)){
                if(_.contains(restrictedChromeHeaders, header.toUpperCase())){
                    if (header === "Cookie") {
                        var cookie_str = "";
                        for(var key in attack.headers.Cookie) {
                            if (attack.headers.Cookie.hasOwnProperty(key)){
                                cookie_str += key + "=" + attack.headers.Cookie[key] + "; "
                            }
                        }
                        headers[token+header] = cookie_str;
                    } else {
                        headers[token+header] = attack.headers[header];
                    }
                } else {
                    headers[header] = attack.headers[header];
                }
            }
        }
        /* Using XMLHttpRequest */
        var xhr = new XMLHttpRequest();
        xhr.open(
            attack.headers.REQUEST.method,
            "http://" + attack.headers.Host + attack.headers.REQUEST.uri,
            true
        );
        console.log("Customizing http request headers for attack id: " + attack_id);
        for (var h in headers) {
            if(headers.hasOwnProperty(h)){
                xhr.setRequestHeader(h, headers[h]);
            }
        }
        console.log("Done setting custom headers!.");
        xhr.onreadystatechange = function(){
            if (xhr.status == 200) {
                switch(xhr.readyState) {
                    case 0:
                        console.log("Request not yet initialized");
                        break;
                    case 1:
                        console.log("Server connection established.");
                        break;
                    case 2:
                        console.log("Request received");
                        break;
                    case 3:
                        console.log("Processing request");
                        break;
                    case 4:
                        console.log("Request finished and response is ready");
                        console.log("Receiving http response for attack id: " + attack_id +
                            " with readyState: " + xhr.readyState + " and status of " + xhr.status);
                        success(xhr);
                        break;
                    default:
                        error(xhr);
                        console.error("Background.js: xhr.status: "+ xhr.status
                            + " xhr.readyState: " + xhr.readyState
                            + " for attack id: " + attack_id);
                        break;

                }
            } else {
                console.log("Background.js - " + xhr.status + ": Page not found");
            }
        };

        switch(attack.headers.REQUEST.method.toUpperCase()) {
            case 'GET':
                console.log("Sending request using GET XMLHTTPRequest");
                xhr.send();
                break;
            case 'POST':
                console.log("Sending request using POST XMLHTTPRequest");
                xhr.send(attack.payload);
                break;
            default:
                console.error("Background.js: Unable to send request");
                break;
        }
    },

    openNewWindow: function(htmlpage) {
        chrome.tabs.create({
            url: chrome.extension.getURL('../'+ htmlpage),
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
    }

};

/* Coming from the Content.js */
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {

    switch (message.from.toLocaleLowerCase()) {
        case "content.js":
            switch (message.type) {
                case "open_validate_page":
                    httpFunctions.openNewWindow('validate.html');
                    console.log("Opening validate page");
                    break;
                case "save_encoded_http_request":
                    /* Saving the encodedHTTPRequest */
                    encodedHTTPRequest = message.data.encodedHTTPRequest;
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

                        if (_.size(requests[i]) != 0) {
                            /* Split the request to header, payload, description,
                               response_header, and response_content */
                            var attack = httpFunctions.splitRequest(requests[i]);
                            /* (3) Convert header to JSON Object */
                            attack.headers = httpFunctions.convertHeaderStringToJSON(attack.headers);
                            /* (4) Save attack as with step being the key */
                            var attack_obj = {};
                            attack_obj[step] = attack;
                            (function(step){
                                chrome.storage.local.set(attack_obj, function () {
                                    console.log("Attack save with ID: '" + step + "' to the chrome local storage");
                                });
                            })(step);
                            step++;
                        }
                    }
                    console.log("http request saved! Clearing encoded http request");
                    encodedHTTPRequest = null;
                    break;
                case "send_http_request":
                    /* Getting all steps */
                    chrome.storage.local.get(null, function (attacks) {
                        for (var id in attacks) {
                            console.log("Getting attack with id: " + id);
                            if(attacks.hasOwnProperty(id)){
                                var attack = attacks[id];
                                var attack_xmlhttprequest = attack;
                                var attack_ajax = attack;
                                /* Using the XHMLHttpRequest */
                                (function(attack_xmlhttprequest, id){
                                    httpFunctions.sendAttackUsingXMLHTTPRequest(id, attack_xmlhttprequest,
                                        function(xhr) {
                                            attack_xmlhttprequest.response_headers = xhr.getAllResponseHeaders();
                                            attack_xmlhttprequest.response_content = xhr.responseText;
                                            var attack_obj = {};
                                            attack_obj[id] = attack_xmlhttprequest;
                                            chrome.storage.local.set(attack_obj, function () {
                                                console.log("Attack " + id + " was saved using the XMLHTTPRequest!!");
                                            });
                                        },
                                        function(err){
                                            console.error("Background.js: xhr.status: "+ err.status
                                                + " xhr.readyState: " + err.readyState
                                                + " for attack id: " + id);
                                        });
                                })(attack_xmlhttprequest);

                                /* Using the Ajax Call*/
                                (function(attack_ajax, id){
                                    httpFunctions.sendAttackUsingAJAX(id, attack_ajax, function(data, text_status, response){
                                        attack_ajax.response_headers = response.getAllResponseHeaders();
                                        attack_ajax.response_content = data;
                                        var attack_obj = {};
                                        attack_obj[id] = attack_ajax;
                                        chrome.storage.local.set(attack_obj, function(){
                                            console.log("Attack "+ id + " was saved using Ajax!!");
                                            return true;
                                        });
                                    });
                                })(attack_ajax);

                            }
                        }
                    });
                    break;
                case "save_http_response":
                    break;
                case "run_validate_page":
                    var encodedhttp = message.data.encodedHTTPRequest;
                    var storage_type = message.data.storage_type;

                    /*(1) Clearing chrome storage */
                    switch(storage_type) {
                        case "local":
                            chrome.storage.local.clear(function(){
                                console.log("Clearing chrome local storage");
                                /* (2) Decode http request */
                                var decodedhttprequest = httpFunctions.decodeRequest(encodedhttp);
                                /* (3) Split the decoded http request into an array of requests */
                                var requests = _.compact(httpFunctions.splitRequests(decodedhttprequest));
                                /* (4) For each request in the request array, parse into
                                 * a. attack request header
                                 * b. attack request payload
                                 * c. attack description
                                 * d. attack response header
                                 * e. attack response content
                                 * */
                                var step = 1;
                                for (var index = 0; index < requests.length; index++ ) {
                                    var attack = httpFunctions.splitRequest(requests[index]);
                                    attack.id = step;
                                    attack.headers = httpFunctions.convertHeaderStringToJSON(attack.headers);
                                    /* Save attack to chrome.storage.local */
                                    (function(){
                                        var attack_obj = {};
                                        attack_obj[step] = attack;
                                        chrome.storage.local.set(attack_obj, function(){
                                            var key = Object.keys(attack_obj)[0];
                                            console.log("Save attack id: " + key + " with just http request!");
                                            switch (message.data.send_request_as) {
                                                case 'xmlhttprequest':
                                                    /* Use xmlhttprequest to send the attack */
                                                    httpFunctions.sendAttackUsingXMLHTTPRequest(key, attack_obj[key],
                                                        function(xhr) {
                                                            attack_obj[key].response_headers = xhr.getAllResponseHeaders();
                                                            attack_obj[key].response_content = xhr.responseText;
                                                            chrome.storage.local.set(attack_obj, function () {
                                                                console.log("Saving attack id: " + key +
                                                                    " to local storage with http response!!");
                                                            });
                                                        },
                                                        function(err){
                                                            console.error("Background.js: xhr.status: "+ err.status
                                                                + " for attack id: " + key);

                                                        });
                                                    break;
                                                case 'ajax':
                                                    /* Use ajax request to send the attack */
                                                    httpFunctions.sendAttackUsingAJAX(key,attack_obj[key],
                                                        function(data, text_status, jqXHR){ // Success
                                                            console.log("Receive http response for attack id: " + key);
                                                            attack_obj[key].response_headers = jqXHR.getAllResponseHeaders();
                                                            attack_obj[key].response_content = data.responseText;
                                                            chrome.storage.local.set(attack_obj, function(){
                                                                console.log("Saving attack id: "+ key +
                                                                    " to local storage with http response!!");
                                                            });
                                                        },function(jqXHR, textStatus, errorThrown){ // fail
                                                            console.error(textStatus + " Unable to send ajax request with message '" +
                                                                errorThrown + "'")
                                                        }, function(data, text_status, jqXHR){ //always
                                                            console.log("Ajax completed!!");
                                                        });
                                                    break;
                                                default:
                                                    console.error("Background.js: Unknown request type! " +
                                                        "Use either 'xmlhttprequest' or 'ajax'");
                                                    break;
                                            }
                                        });
                                    })();
                                    step++;
                                    chrome.storage.local.get(null, function(attacks){
                                        if(_.size(attacks) >= requests.length){
                                            httpFunctions.openNewWindow('validate.html');
                                        }
                                    });
                                }
                            });
                            break;
                        case "sync":
                            chrome.storage.sync.clear();
                            console.log("Clearing chrome sync storage");
                            break;
                        default:
                            console.error("Background.js: Unable to determine storage type");
                            break;
                    }

                    break;
                default:
                    break;

            }
            break;
        default:
            console.log("Background.js: Can not handle request from "+ message.from + " script!!");
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
                    console.error("Background.js: Unable to handle message from '" + channel_name + "'")
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
            var headers = details.requestHeaders;
            var map = {};
            var new_headers = [];
            for( var index = 0; index < headers.length; index++) {
                if(!headers[index].name.match(new RegExp(token))){
                    map[headers[index].name] = headers[index].value;
                }
            }
            for( var index = 0; index < headers.length; index++) {
                if(headers[index].name.match(new RegExp(token))){
                    //slice the name
                    var name = headers[index].name.slice(token.length);
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

        } catch(err) {
            //console.log(err);
        }
        return {requestHeaders: headers};
    },
    {urls: ["<all_urls>"]},
    ["blocking", "requestHeaders"]);
