/**
 * Created by nbugash on 12/01/16.
 */

/* GLOBAL VARIABLE*/
var encodedHTTPRequest;

/* Helper functions */
var httpFunctions = {
    decodeRequest: function(encodedRequest) {
        return window.atob(encodedRequest);
    },

    /* Split the decoded request to multiple requests*/
    splitRequests: function(decodedRequests) {
        var requests = decodedRequests.split(/(#H#G#F#E#D#C#B#A#)/);
        for(var i = 0; i < requests.length; i++) {
            if (requests[i].match(/(#H#G#F#E#D#C#B#A#)/)){
                delete requests[i];
            }
        }
        return requests;
    },

    /* Split the request to header, payload, and description */
    splitRequest: function(request){
        var array = request.split(/(A#B#C#D#E#F#G#H#)/);
        var header_payload = array[0];
        return {
            header: header_payload.split('\r\n\r\n')[0].trim(),
            payload: header_payload.split('\r\n\r\n')[1].trim(),
            description: array[2].trim()
        }
    },

    convertHeaderStringToJSON: function(headerString) {
        var headerArray = headerString.split("\r\n");
        var header = {};
        for (var i = 0; i < headerArray.length; i++) {
            if (headerArray[i].toUpperCase().match(/GET|POST|PUT|DELETE/)) {
                header['REQUEST'] = headerArray[i].trim();
            } else if (headerArray[i].indexOf(":") > -1 ) {
                header[headerArray[i].split(":")[0]] = headerArray[i].split(":")[1].trim();
            }
        }
        return header;
    }

};

/* Coming from the Content.js */
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.from === "content.js"){
        var type = request.type;
        switch (type) {
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
                * (2) Split request to headers and payload
                * (3) Convert header to json object
                * (4) Save JSON header, Payload, and Description
                * */

                /* (1) Decode request */
                var decodedRequests = httpFunctions.decodeRequest(encodedHTTPRequest);
                var requests = httpFunctions.splitRequests(decodedRequests);

                /* (2) For each requests, split into headers and payload */
                var step = 1;
                for (var i = 0; i < requests.length; i++) {
                    /* For each defined element */
                    if (requests[i]){
                        var request = httpFunctions.splitRequest(requests[i]);
                        /* (3) Convert header to JSON Object */
                        request.header = httpFunctions.convertHeaderStringToJSON(request.header);
                        /* (4) Save request as with step being the key */
                        var attack_obj = {};
                        attack_obj[step] = request;
                        chrome.storage.local.set(attack_obj, function(){
                            console.log("Request save to key: '"+ step +"'");
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
    } else {
        console.log("Can not handle request from other scripts!!")
    }
});

