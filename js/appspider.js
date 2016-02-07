/**
 * Created by nbugash on 14/01/16.
 */
var AppSpider = {
    chrome: {
        store: function (id, obj) {
            var object = {};
            object[id] = obj;
            chrome.storage.local.set(object, function () {
                console.log("Object " + id + " was saved to the chrome.storage.local");
                return true;
            });
        },
        retrieve: function ($scope, id, callback) {
            chrome.storage.local.get(id, function (result) {
                console.log("Attack " + id + " loaded!!");
                $scope.$apply(function(){
                    callback(result[id]);
                });
            });
        },
        retrieveAll: function ($scope, callback) {
            chrome.storage.local.get(null, function(results){
                console.log("All attacks were retrieved!!");
                $scope.$apply(function(){
                    callback(results);
                });
            });
        }
    },
    attack: {
        save: function(attack_id, attack_obj){
            return AppSpider.chrome.store(attack_id,attack_obj);
        },
        load: function($scope, attack_id, callback){
            AppSpider.chrome.retrieve($scope, attack_id,callback);
        },
        update: function(attack_id, attack_key, attack_value) {
            AppSpider.chrome.retrieve(attack_id, function(attack) {
                attack[attack_key] = attack_value;
                AppSpider.attack.save(attack_id,attack);
            });
        }
    },
    attacks: {
        getAllAttacks: function ($scope, callback) {
            AppSpider.chrome.retrieveAll($scope, callback);
        }
    },
    request: {
        send: function(protocol, attack_id, callback) {
            /* Loading attack... */
            AppSpider.attack.load(attack_id, function(attack) {
                var data = {};

                /* http_request_type: GET, POST, DELETE, PUT */
                var http_request = attack.headers.REQUEST.split(' ');
                data.http_request_type = http_request[0].trim();
                data.url = protocol.toLowerCase() + "://" + attack.headers.Host + http_request[1];
                data.http_version = http_request[2];

                /* Setting up the attack */
                delete attack.headers.REQUEST;
                data.headers = attack.headers;
                if (attack.payload) {
                    data.payload = attack.payload;
                }

                /* Sending the message...*/
                var channel = chrome.runtime.connect({name: "appspider.js"});
                channel.postMessage({
                    type: "send_request",
                    data: data
                });

                /* Wait for asynchronous callback */
                channel.onMessage.addListener(function(message, sender) {
                    switch(message.type) {
                        case "http_response":
                            console.log("appspider.js: Receive http response!!");
                            callback(message.data);
                            break;
                        default:
                            console.log("appspider.js: Unable to handle message from " + message.from);
                            break;
                    }
                });

            });
        }
    },
    helper: {
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
        },
        convertJSONToString: function(jsonObj) {
            var str = "";
            if (jsonObj.REQUEST) {
                str = jsonObj.REQUEST.method + " " + jsonObj.REQUEST.uri + " " + jsonObj.REQUEST.version + "\r\n";
            }
            for (var key in jsonObj) {
                switch(key){
                    case "REQUEST":
                        break; //skip
                    case "Cookie":
                        str += key +": " + JSON.stringify(jsonObj[key], null, '\t') + "\r\n";
                        break;
                    default:
                        if (typeof jsonObj[key] === "object") {
                            str += key + ": " + AppSpider.helper.convertJSONToString(jsonObj[key]);
                        } else {
                            str += key + ": " + jsonObj[key].trim() + "\r\n";
                        }
                        break;
                }
            }
            return str;
        }
    }
};

chrome.storage.onChanged.addListener(function(attacks, namespace){
    for (var attack_id in attacks) {
        var attack_storage = attacks[attack_id];
        console.log('Storage key "%s" in namespace "%s" changed. ' +
            'Old value was "%s", new value is "%s".',
            attack_id,
            namespace,
            attack_storage.oldValue,
            attack_storage.newValue);
        $('textarea#attack-request-headers-'+attack_id).val(AppSpider.helper.convertJSONToString(attack_storage.newValue.headers));
        $('textarea#attack-attack-request-payload-'+attack_id).val(attack_storage.newValue.payload);
        $('textarea#attack-response-headers-'+attack_id).val(attack_storage.newValue.response_headers);
        $('textarea#attack-response-content-'+attack_id).val(attack_storage.newValue.response_content);
    }
});