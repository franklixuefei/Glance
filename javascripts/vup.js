/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var vup = function() {

    var initialize = function(page) {
        FlurryAgent.logEvent("VUP: Entry");



        $(page).find('.app-button.back').on('tap', function() {
            handleBackButton();
        }).bind('touchstart', function() {
            $(this).find('span').addClass('button-pressed');
        }).bind('touchend', function() {
            $(this).find('span').removeClass('button-pressed');
        }).bind('touchmove', function() {
            $(this).find('span').removeClass('button-pressed');
            return false;
        });

        registerBackButtonListener();
    };

    function handleBackButton() {
        // called when back button is pressed
        internalDestroy(App.getPage());
        App.back(function() {
            FlurryAgent.logEvent("VUP: Back Button Tap");
            notification.updater.regenerate($(App.getPage()));
            menu.prepare($(App.getPage()));
            if (App.current() === "matchGame") {
                imageViewer.swipeGesture.maybeShowBottomBar($(App.getPage()));
                matchGame.reload($(App.getPage()));
            }
            unregisterBackButtonListener();
//            matchList.registerBackButtonListener();
            
        });
//      return false; // optionally cancel default behavior
    }
    
    var registerBackButtonListener = function() {
        if (cards.browser && cards.browser.back) {
            cards.browser.back(handleBackButton);
        }
    };

    var unregisterBackButtonListener = function() {
        if (cards.browser && cards.browser.unbindBack) {
            cards.browser.unbindBack(handleBackButton);
        }
    };

    var prepareData = function(page, data) {
        var profile = null;
        if (data.isUserObject === true) {
            profile = data;
        } else {
            profile = sok.utils.convertUserMessageObjectToUserObject(data);
        }
        imageViewer.swipeGesture.init(
                [profile],
                320, // img width
                200, // sliding time
                7000, // pause time
                page,
                false, // not swipable, only show first user object passed in.
                0 // last user id. useless here.
                );
        $(page).find('span#kik-me').parent().on('tap', function() {
            startChat(profile.kik_id);
        }).bind('touchstart', function() {
            $(this).addClass('button-pressed-opacity');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed-opacity');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed-opacity');
            return false;
        });
        if (data.disableBackButton === true) {
            $(page).find('.app-button.back').off('tap');
            $(page).find('.app-button.back').remove();
        }
    };

    var startChat = function(user_kikId) {
        cards.kik.send(user_kikId, {
            title: ' ',
            text: 'Hi, I\'m ' + localStorage['prefername']
        });
    };

    var internalDestroy = function(page) {
        $(page).find(".side-page#menu").remove();
    };

    var destroy = function(page) {

    };

    return {
        init: initialize,
        destroy: destroy,
        prepareData: prepareData,
        registerBackButtonListener: registerBackButtonListener,
        unregisterBackButtonListener: unregisterBackButtonListener
    };
}();
