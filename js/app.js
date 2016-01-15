/**
 * Created by nbugash on 15/01/16.
 */
var AppSpiderValidateApp = angular.module('AppSpiderValidateApp', []);
AppSpiderValidateApp.controller('AttackController', function () {
    var appspider = this;

    //AppSpider.attacks.loadAll(function(results) {
    //   appspider.attacks = results;
    //});

    //angular.element(document).ready(function(){
    //    AppSpider.attacks.loadAll(function(results) {
    //        appspider.attacks = results;
    //    });
    //});
    //appspider.attacks = appspider.getAttacks();
    //appspider.attacks = [
    //    {
    //        1:{
    //            header:{
    //                header1:'Header 1-1',
    //                header2:'Header 2-1',
    //            },
    //            payload: 'Payload for attack 1'
    //        }
    //    },
    //    {
    //        2:{
    //            header:{
    //                header1:'Header 1-2',
    //                header2:'Header 2-2',
    //            },
    //            payload: 'Payload for attack 2'
    //        }
    //    }
    //];
    AppSpider.attacks.loadAll(function (results) {
        appspider.attacks = results;
    });

    appspider.getAttacks = function() {
        return appspider.attacks;
    };
});
AppSpiderValidateApp.controller('PanelController', function () {
    var panel = this;
    panel.tab = 1;
    panel.selectTab = function (setTab) {
        panel.tab = setTab;
    };
    panel.isSelected = function (checkTab) {
        return panel.tab === checkTab;
    };
});

