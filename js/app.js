/**
 * Created by nbugash on 15/01/16.
 */

var AppSpiderValidateApp = angular.module('AppSpiderValidateApp', []);
AppSpiderValidateApp.controller('AttackController', function ($scope) {
    var appspider = this;
    chrome.storage.local.get(null, function(results){
        $scope.$apply(function(){
            appspider.getAttacks(results);
        });
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
    }
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