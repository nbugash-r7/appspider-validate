/**
 * Created by nbugash on 15/01/16.
 */

var AppSpiderValidateApp = angular.module('AppSpiderValidateApp', []);
AppSpiderValidateApp.controller('AttackController', function ($scope) {
    var appspider = this;

    AppSpider.attacks.getAllAttacks($scope, function(results){
       appspider.getAttacks(results);
    });
    appspider.getAttacks = function(attacks) {
        appspider.attacks = attacks;
    };
    appspider.prettifyAttack = function(headers) {
        var attack_str = headers['REQUEST'] + "\r\n";
        for (var header in headers) {
            switch(header) {
                case "REQUEST":
                    break;
                case "Cookie":
                    var cookie_str = "";
                    for(var key in headers[header]) {
                        cookie_str += key + "=" + headers[header][key] + "; "
                    }
                    attack_str += header +": " + cookie_str + "\r\n";
                    break;
                default:
                    attack_str += header + ": " + headers[header] + "\r\n";
                    break;
            }
        }
        return attack_str;
    };
    appspider.saveAttack = function(attack, view) {
        switch(view) {
            case "RAW":
                break;
            case "Prettify":
                break;
            default:
                break;
        }
    };
});
AppSpiderValidateApp.controller('PanelController', function () {
    var panel = this;
    panel.tab = "1";
    panel.selectTab = function (setTab) {
        panel.tab = setTab;
    };
    panel.isSelected = function (checkTab) {
        return panel.tab === checkTab;
    };
});

AppSpiderValidateApp.controller('ButtonController', function() {
    var button = this;
    button.view = 'RAW';
    button.protocoltype = 'HTTP';
    button.viewDropdown = function(attack_id, viewtype){
        console.log("View dropdown clicked with value " + viewtype + " on attack id: " + attack_id);
        button.view = viewtype;
    };
    button.protocolDropdown = function(attack_id, protocoltype){
        console.log("Protocol dropdown clicked with value " + protocoltype + " on attack id: " + attack_id);
        button.protocoltype = protocoltype;
    };
    button.proxy = function(attack_id){
        console.log("Proxy button clicked on attack id: " + attack_id);
    };
    button.editCookie = function(attack_id){
        console.log("Edit Cookie button clicked attack id: " + attack_id);
    };
    button.resetRequest = function(attack_id){
        console.log("Reset request button clicked attack id: " + attack_id);
    };
    button.sendRequest = function(attack_id){
        console.log("Send request button clicked attack id: " + attack_id);
        AppSpider.request.send(button.protocoltype, attack_id, function(attack_response){
            /* Populate the Attack Response and Content */
            AppSpider.attack.update(attack_id, 'response_header', attack_response.header);
            AppSpider.attack.update(attack_id, 'response_content', attack_response.content);
        });
    };
    button.compare = function(attack_id){
        console.log("Compare button clicked attack id: " + attack_id);
    };
});