/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var menu = function() {

    var menuPanelObject = null;

    var initialize = function() {
        // register refresh listener
//        registerListener();
        localStorage['menu_open'] = false;
    };

    var prepareMenu = function(page) {

        var menuOpened = false;
        localStorage['menu_open'] = false;

        var loadButton = function(buttonBackground, button_id, buttonText, tapEventCallback, menuContainer, mainButton) {
            var button = $('<div>').attr('class', 'menu-button' + (mainButton ? ' main-button' : '')).attr('id', button_id).css('background-image', 'url("' + buttonBackground + '")').append($('<span>').text(buttonText));
            menuContainer.append(button);
            button.bind('touchstart', function() {
                $(this).addClass('button-pressed');
            }).bind('touchend', function() {
                $(this).removeClass('button-pressed');
            }).bind('touchmove', function() {
                $(this).removeClass('button-pressed');
                return false;
            });
            button.on('tap', tapEventCallback);
        };

        var page_mask = null;
        // TODO: bind events to buttons in menu
        // prepend the menu element to corresponding app-page

        var profile_pic_container = $('<div>').attr('class', 'profile-pic-container')
                .append($('<div>').attr('class', 'menu-name-ribbon').append($('<span id="ribbon-name">').text(localStorage["prefername"])).append($('<span>').attr('id', 'person')));
        sok.utils.loadImage(localStorage["current_profilepic"], profile_pic_container, 100);
        profile_pic_container.bind('touchstart', function() {
            $(this).addClass('button-pressed-opacity');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed-opacity');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed-opacity');
            return false;
        });
        profile_pic_container.on('tap', function() {
            foldMenu('myProfile', menu_panel, page_mask, function() {
                $(page).find('.app-bottombar').removeClass('show');
                menu_panel.remove();
                $(page).find('.app-button.right').off('tap');
                App.load('myProfile', function() {
                    prepareMenu($(App.getPage()));
                });
            });
        });

        var buttons_wrapper = $('<div>').attr('class', 'buttons-wrapper');

        loadButton('images/matchgame.png', 'match-game-button', 'Match Game', function() {
            foldMenu('matchGame', menu_panel, page_mask, function() {
// need to remove menu before loading another page. Otherwise weirdness.
                $(page).find('.app-bottombar').removeClass('show');
                menu_panel.remove();
                $(page).find('.app-button.right').off('tap');
                App.removeFromStack(); // if matchGame is in the stack, remove it first.
                App.load('matchGame', function() {
                    prepareMenu($(App.getPage()));
                    App.removeFromStack();
                });
            });
        }, buttons_wrapper, true);

        loadButton('images/mymatches.png', 'my-matches-button', 'My Matches', function() {
            foldMenu('matchList', menu_panel, page_mask, function() {
// need to remove menu before loading another page. Otherwise weirdness.
                $(page).find('.app-bottombar').removeClass('show');
                menu_panel.remove();
                $(page).find('.app-button.right').off('tap');
                App.load('matchList', function() {
                    prepareMenu($(App.getPage()));
                });
            });
        }, buttons_wrapper, true);
        loadButton('images/bg-pref.png', 'match-pref-button', 'Match Preferences', function() {
            foldMenu('preferences', menu_panel, page_mask, function() {
                $(page).find('.app-bottombar').removeClass('show');
                menu_panel.remove();
                $(page).find('.app-button.right').off('tap');
                App.load('preferences', function() {
                    prepareMenu($(App.getPage()));
                });
            });
        }, buttons_wrapper);
        loadButton('images/bg-settings.png', 'settings-button', 'Settings', function() {
            foldMenu('settings', menu_panel, page_mask, function() {
                $(page).find('.app-bottombar').removeClass('show');
                menu_panel.remove();
                $(page).find('.app-button.right').off('tap');
                App.load('settings', function() {
                    prepareMenu($(App.getPage()));
                });
            });
        }, buttons_wrapper);
        loadButton('images/bg-share.png', 'kik-share-button', 'Kik Share', function() {
            foldMenu('', menu_panel, page_mask, function() {
                cards.kik.send({
                    title: 'Glance',
                    text: 'Hi there! Checkout Glance!',
                    pic: CLIENT_URL + 'images/app@2x.png', // optional
                    big: true, // optional
                    noForward: false, // optional
                });
            });
        }, buttons_wrapper);
//        loadButton('images/bg-feedback.png', 'feedback-button', 'Feedback', function() {
//            foldMenu('feedback', menu_panel, page_mask, function() {
//                location.href = 'mailto: frank@jinguapps.com';
//            });
//        }, buttons_wrapper);

        var footer_container = $('<div>').attr('class', 'footer-container');

        var privacy_policy = $('<span>').attr('class', 'footer-button').attr('id', 'privacy_policy').html('Privacy Policy&nbsp;&nbsp;|&nbsp;&nbsp;');
        var terms_of_service = $('<span>').attr('class', 'footer-button').attr('id', 'terms_of_service').html('Terms of Service&nbsp;&nbsp;|&nbsp;&nbsp;');
        var feedback = $('<span>').attr('class', 'footer-button').attr('id', 'feedback').html('Feedback');

        footer_container.append(privacy_policy).append(terms_of_service).append(feedback);

        var mailBody = 'Please%20type%20out%20your%20issue%20below...%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A%0D%0A' + '------------%0D%0APlease do not modify the information below so we can better help you.%0D%0A' + 'Glance%20ID:%20' + localStorage['user_id'] + '%0D%0AGlance%20Name:%20' + localStorage['prefername'] + '%0D%0AKik%20ID:%20' + localStorage['username'] + '%0D%0AApplication:%20Glance%20(Kik%20Card)' + '%0D%0AApplication%20version:%201.0' + '%0D%0APlatform:%20' + cards.utils.platform.os.name + '%0D%0AOS%20Version: ' + cards.utils.platform.os.versionString;

        privacy_policy.on('tap', function() {
            cards.open('http://www.singlesonkik.com/privacypolicy.html');
        }).bind('touchstart', function() {
            $(this).addClass('button-pressed-text-gray');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed-text-gray');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed-text-gray');
            return false;
        });

        terms_of_service.on('tap', function() {
            cards.open('http://www.singlesonkik.com/termsconditions.html');
        }).bind('touchstart', function() {
            $(this).addClass('button-pressed-text-gray');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed-text-gray');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed-text-gray');
            return false;
        });

        feedback.on('tap', function() {
            FlurryAgent.logEvent("Feedback: Entry");
            location.href = 'mailto:frank@jinguapps.com?subject=Glance%20Feedback&body=' + mailBody;
        }).bind('touchstart', function() {
            $(this).addClass('button-pressed-text-gray');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed-text-gray');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed-text-gray');
            return false;
        });


        var menu_container = $('<div>').attr('class', 'side-page-container').attr('id', 'menu-container').append(profile_pic_container).append(buttons_wrapper).append(footer_container);

        var foldMenu = function(pageName, menuObj, maskObj, callback) {

            menuObj.css('z-index', '');
            $(page).find('.page-container').removeClass('menuSlideLeft');
//            $('#sw-wrapper').css('visibility', '');
            if (localStorage['os'] === 'ios') {
                maskObj.addClass('fadeOut');
                setTimeout(function() {
                    maskObj.remove();
                    if ($(App.getPage()).attr('data-page') !== pageName) {
                        if (callback)
                            callback();
                    }
                    menuOpened = false;
                    localStorage['menu_open'] = false;
                    menuObj.css('display', 'none');
                }, 160);
            } else {
                maskObj.remove();
                if ($(App.getPage()).attr('data-page') !== pageName) {
                    if (callback)
                        callback();
                }
                menuOpened = false;
                localStorage['menu_open'] = false;
                menuObj.css('display', 'none');
            }
        };

        var menu_panel = $('<div>').attr('class', 'side-page').attr('id', 'menu').append(menu_container);

        menu_panel.prependTo(page);

        menuPanelObject = menu_panel;

        $(page).find('.app-button.right').on('tap', function() {
            if (!menuOpened) {
                menu_panel.css('display', 'block');
                if ($(page).attr('data-page') === "matchGame") {
                    FlurryAgent.logEvent("MatchGame: Menu Tapped");
                } else if ($(page).attr('data-page') === "matchList") {
                    FlurryAgent.logEvent("MyMatches: Menu Tapped");
                }
                menuOpened = true;
                localStorage['menu_open'] = true;
                page_mask = $('<div>').attr('class', 'mask');
                $(page).find('.page-container').append(page_mask);
                if (localStorage['os'] === 'ios') {
                    page_mask.addClass('fadeIn');
                } else {
                    page_mask.css('opacity', '0.9');
                }
                page_mask.on('tap', function() {
                    foldMenu('', menu_panel, page_mask);
                });
                $(page).find('.page-container').addClass('menuSlideLeft');
//            $('#sw-wrapper').css('visibility', 'hidden');
                myProfile.closeSpinningWheel(page);
                if (localStorage['os'] === 'ios') {
                    setTimeout(function() {
                        menu_panel.css('z-index', '3003');
                    }, 160);
                }
            } else {
                foldMenu('', menu_panel, page_mask);
            }
        }).bind('touchstart', function() {
            $(this).find('span').addClass('button-pressed');
        }).bind('touchend', function() {
            $(this).find('span').removeClass('button-pressed');
        }).bind('touchmove', function() {
            $(this).find('span').removeClass('button-pressed');
            return false;
        });

    };

    var reloadData = function() {
        // reload current profile picture
        sok.utils.loadImage(localStorage["current_profilepic"], $(menuPanelObject).find('.profile-pic-container'), 100);
        // TODO: refresh display name
        menuPanelObject.find('.menu-name-ribbon span#ribbon-name').text(localStorage["prefername"]);
    };

    return {
        init: initialize,
        prepare: prepareMenu,
        reloadDataPerLocalStorage: reloadData
    };
}();