/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var matchGame = function() {

    var match_game_users = []; // we maintain a list of retrieved match game users so that we can use whenever we want, for example, MatchDialog.

    var matchDialogShown = false;

    var initialize = function(page) {
        FlurryAgent.logEvent("MatchGame: Entry");
        match_game_users = [];
        matchDialogShown = false;
//    showMatchDialog(page, '5823');
        registerBackButtonListener();
    };
    
    function handleBackButton() {
        // called when back button is pressed
//      FlurryAgent.logEvent("MyProfile: Back Button Tap");
        if (localStorage['menu_open'] === "true") {
            $(App.getPage()).find('.app-button.right').trigger('tap');
            return false;
        }

        var back = App.back(function() {
            notification.updater.regenerate($(App.getPage()));
            menu.prepare($(App.getPage()));
            imageViewer.swipeGesture.maybeShowBottomBar($(App.getPage()));
            unregisterBackButtonListener();
        });
        if (back !== false) {
            $(App.getPage()).find(".side-page#menu").remove();
        }
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

    var destroy = function(page) {
        match_game_users = [];
    };

    var reloadData = function(page) {
        destroy(page);
        imageViewer.destroy(page);
        $(page).find('.image-pointer').children().remove();
        imageViewer.swipeGesture.invalidPageHideBottomBar(page);
        prepareData(page);
    };

    var prepareData = function(page) {
        var pushData = {
            task: "getData",
            format: "json",
            user_id: localStorage['user_id'],
            requests: JSON.stringify([{"type": "users_match_game", "multiple_images": {"limit": "5"}}, {"type": "details_match_game", "limit": "20"}])
        };
        var imageWrapper = $('<div>').attr('class', 'image-wrapper scrollable').css('left', '20px').css('width', parseInt(localStorage['window_width']) - 40 + 'px');
        $(page).find('.image-pointer').append(imageWrapper);
        var profile_loading_container = $('<div>').attr('class', 'profile-loading-container').css('height', window.innerHeight - 44)
                .append($('<img>').attr('src', 'images/LoadingBar.gif'));
        imageWrapper.append(profile_loading_container);
        $.ajax({
            type: 'POST',
            url: SERVER_URL,
            // data to be added to query string:
            data: pushData,
            // type of data we are expecting in return:
            dataType: 'json',
            success: function(data) {
//                console.log(data);
                if (data.status === "success" || data.status === 'banned') {
//                    console.log(data.response.data[0].users);
                    imageWrapper.remove();
                    var profileArray = [];
                    var last_id = "0";
                    var users = data.response.data[0].users;

                    for (var i = 0; i < users.length; ++i) {
                        var profileObj = sok.utils.createUserObject(users[i]);
                        last_id = users[i].user_id;
                        profileArray.push(profileObj);
                        match_game_users = profileArray.slice();
                    }

                    var hasDetail = false;
                    if (data.response.data[1].admire_count > 0) {
                        var detailObj = sok.utils.createDetailPanel(data.response.data[1]);
                        profileArray.unshift(detailObj);
                        hasDetail = true;
                    }
                    var hasTut = false;
                    if (localStorage['old_user'] !== "true") {
                        var tutArr = sok.utils.createTutorial();
                        profileArray = tutArr.concat(profileArray);
                        hasTut = true;
                    }

                    if (!hasTut && !hasDetail && users.length > 0) {
                        imageViewer.swipeGesture.normalPageShowBottomBar(page);
                    } else {
                        imageViewer.swipeGesture.invalidPageHideBottomBar(page);
                    }
                    imageViewer.swipeGesture.init(
                            profileArray,
                            320, // img width
                            200, // sliding time
                            7000, // pause time
                            page,
                            true, // swipable
                            last_id // last user id
                            );
                } else {
                    // TODO: handle server error
//                    $(page).text(data);
                }
            },
            error: function(xhr, type) {
                // TODO: error handling
                console.log(xhr.responseText);
            }
        });
    };

    var getMatchGameUsers = function() {
        return match_game_users;
    };

    var setMatchGameUsers = function(users) {
        match_game_users = users.slice();
    }

    var showMatchDialog = function(page, targetUserId) {
        var user_prefername = "";
        var user_current_profile_image_medium = "";
        var user_current_profile_image_large = "";
        var user_kikId = "";
        var profileFound = false;
        for (var i = 0; i < match_game_users.length; ++i) {
            if (targetUserId === match_game_users[i].user_id) {
                user_prefername = match_game_users[i].name;
                user_current_profile_image_medium = match_game_users[i].current_profile_image_medium;
                user_current_profile_image_large = match_game_users[i].current_profile_image_large;
                user_kikId = match_game_users[i].kik_id;
                profileFound = true;
                break;
            }
        }
        if ($(page).attr('data-page') !== 'matchGame'/* || matchDialogShown*/) // TODO in the future we need to queue dialogs up and show them one by one.
            return false;
        if (profileFound) {
            matchDialogShown = true;
            appendMatchDialog(page, user_prefername, user_current_profile_image_medium, user_current_profile_image_large, user_kikId);
        } else {
            var pushData = {
                task: "getData",
                format: "json",
                user_id: localStorage['user_id'],
                requests: JSON.stringify([{"type": "user_basic_info", "target_id": targetUserId, "multiple_images": {"limit": "5"}}])
            };
            $.ajax({
                type: 'POST',
                url: SERVER_URL,
                // data to be added to query string:
                data: pushData,
                // type of data we are expecting in return:
                dataType: 'json',
                success: function(data) {
//                    console.log(data);
                    if (data.status === "success") {
                        var userData = sok.utils.createUserObject(data.response.data[0].user);
                        appendMatchDialog(page, userData.name, userData.current_profile_image_medium, userData.current_profile_image_large, userData.kik_id);
                    } else {
                        // TODO: handle server error
                    }
                },
                error: function(xhr, type) {
                    // TODO: error handling
                    console.log(xhr.responseText);
                }
            });
        }
    };

    var appendMatchDialog = function(page, user_prefername, user_current_profile_image_medium, user_current_profile_image_large, user_kikId) {
        var os = localStorage['os'];
        var dialog_container = $('<div>').attr('class', 'dialog_container'); // opacity is 0
        var dialog_mask = $('<div>').attr('class', 'mask');
        $(page).find('.page-container').append(dialog_mask);
        $(page).find('.page-container').append(dialog_container);

        var closeButton = $('<div>').attr('class', 'close');

        var dialogTitle = $('<div>').attr('class', 'dialog-title').text("We\'ve Matched!");

        var dialogMain = $('<div>').attr('class', 'dialog-main');

        var KikMeButton = $('<div>').attr('class', 'kik-me-button');

        dialog_container.append(closeButton);
        dialog_container.append(dialogTitle);
        dialog_container.append(dialogMain);
        dialog_container.append(KikMeButton);

        KikMeButton.append($('<span>'));

        sok.utils.loadImg(user_current_profile_image_large, 'background-pic', '', 100, dialogMain);


        var sharpProfilePicWrapper = $('<div>').attr('class', 'target-user-profile-pic-sharp-frame'); // background image is the pic frame
        dialogMain.append(sharpProfilePicWrapper);

        var userCardName = $('<span>').attr('id', 'target-user-name').text(user_prefername);

        dialogMain.append(userCardName);

        var roundedUserCard = $('<div>');

        sok.utils.loadImage(user_current_profile_image_medium, roundedUserCard, 100);

        sharpProfilePicWrapper.append(roundedUserCard);


        closeButton.on('tap', function() {
            FlurryAgent.logEvent("MatchDialog: Close Match");
            closeMatchDialog(dialog_mask, dialog_container);
        }).bind('touchstart', function() {
            $(this).addClass('button-pressed');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed');
            return false;
        });

        KikMeButton.on('tap', function() {
            FlurryAgent.logEvent("MatchDialog: Chat from Match");
            cards.kik.send(user_kikId, {
                title: ' ',
                text: 'Hi, I\'m ' + localStorage['prefername']
            });

        }).bind('touchstart', function() {
            $(this).addClass('button-pressed-blue');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed-blue');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed-blue');
            return false;
        });

        dialog_container.css('z-index', '3002');
        dialog_container.addClass('active');
        if (os === 'ios') {
            dialog_mask.addClass('dialog-mask-fadeIn');
        } else {
            dialog_mask.css('opacity', '1');
        }
    };

    var closeMatchDialog = function(dialogMask, dialogContainer) {
        var os = localStorage['os'];
        if (os === 'ios') {
            dialogMask.addClass('dialog-mask-fadeOut');
            dialogContainer.remove();
            setTimeout(function() {
                matchDialogShown = false;
                dialogMask.remove();
            }, 210);
        } else {
            dialogContainer.remove();
            matchDialogShown = false;
            dialogMask.remove();
        }
    };

    return {
        init: initialize,
        destroy: destroy,
        showMatchDialog: showMatchDialog,
        prepareData: prepareData,
        reload: reloadData,
        getMatchGameUsers: getMatchGameUsers,
        setMatchGameUsers: setMatchGameUsers,
        registerBackButtonListener: registerBackButtonListener,
        unregisterBackButtonListener: unregisterBackButtonListener
    };
}();
