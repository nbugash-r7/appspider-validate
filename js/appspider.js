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
        retrieve: function (id, callback) {
            chrome.storage.local.get(id, function (result) {
                console.log("Attack " + id + " loaded!!");
                callback(result[id]);
            });
        },
        retrieveAll: function (callback) {
            chrome.storage.local.get(null, function(results){
                console.log("All attacks were retrieved!!");
                callback(results);
            });
        }
    },
    attack: {
        save: function(attack_id, attack_obj){
            return AppSpider.chrome.store(attack_id,attack_obj);
        },
        load: function(attack_id, callback){
            AppSpider.chrome.retrieve(attack_id,callback);
        }
    },
    attacks: {
        loadAll: function (callback) {
            AppSpider.chrome.retrieveAll(callback);
        }
    }
};

/* EVENT HANDLERS */
$(document).ready( function(e){
    $("#appspider-logo").trigger('click');
    $("#step-1").trigger('click');
});
