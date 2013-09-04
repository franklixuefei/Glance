/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var matchList = function() {

    var loading_more = false;

    var loading_threshold = 0;

    var loading_limit = 0;

    var last_item_id = "0";

    var os = '';

    var initialize = function(page) {
        FlurryAgent.logEvent("MyMatches: Entry");
        os = localStorage['os'];
        loading_limit = 20;
        loading_threshold = 100;
        loading_more = false;
        $(page).find('.match-list-container').css('height', window.innerHeight - 44);
//        prependUpsellPortal(page);
        getList(page);
        if (os === 'ios') {
            initLoadMoreListener(page);
        }

        sok.utils.enableAndroidScrolling($(page).attr('data-page'), $(page).find('.match-list-scroller'), $(page).find('.match-list-container'), null, null, function(newPos) {
            if (!loading_more) {
                if (newPos < $(page).find('.match-list-container').height() - $(page).find('.match-list-scroller').height() + loading_threshold) {
                    loadMoreAjax(page, $(page).find('.match-list-scroller'));
                }
            }
        });

        registerBackButtonListener();
    };

    function handleBackButton() {
        if (localStorage['menu_open'] === "true") {
            $(App.getPage()).find('.app-button.right').trigger('tap');
            return false;
        }
        $(App.getPage()).find(".side-page#menu").remove();
        App.back(function() {
            notification.updater.regenerate($(App.getPage()));
            menu.prepare($(App.getPage()));
            imageViewer.swipeGesture.maybeShowBottomBar($(App.getPage()));
            unregisterBackButtonListener();
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

    var loadMoreAjax = function(page, scroller) {
        if (!last_item_id) {
            return;
        }
        loading_more = true;
        console.log('match loading...');
        var loader = $('<div>').attr('class', 'match-list-item match-loading').append($('<img>').attr('src', 'images/loader.gif'));
        scroller.append(loader);
        var pushData = {
            task: 'getData',
            format: 'json',
            user_id: localStorage['user_id'],
            requests: JSON.stringify([{"type": "messages_matches", "limit": loading_limit, "include_users_array": "1", "multiple_images": {"limit": "5"}, "more_messages": {"last_id": last_item_id, "older": "1"}}])
        };
        $.ajax({
            type: 'POST',
            url: SERVER_URL,
            // data to be added to query string:
            data: pushData,
            // type of data we are expecting in return:
            dataType: 'json',
            success: function(data) {
//                console.log(data.response.user_id);
                if (data.status === "success") {
//                        console.log(data.response);
                    var messages = data.response.data[0].messages;
                    var users = data.response.data[0].users;
                    if (messages.length < loading_limit) {
                        if (os === 'ios') {
                            $(page).find('.match-list-container').unbind('scroll');
                        } else {
                            last_item_id = '';
                        }
                    }
                    var matchedUsersList = [];
                    for (var i = 0; i < messages.length; ++i) {
                        var notif_obj = sok.utils.createUserMessageObject(users[i], messages[i]);
                        matchedUsersList.push(notif_obj);
                        last_item_id = notif_obj.message_id;
                    }
                    generateList(page, matchedUsersList);
                    setTimeout(function() {
                        if (matchListScroll) matchListScroll.refresh();
                    }, 100);
                    loader.remove();
                    loading_more = false;
                } else {
                    // TODO: handle server error
                    loading_more = false;
                    loader.remove();
//                            $(page).text(data.status);
                }
            },
            error: function(xhr, type) {
                // TODO: handle server error
                loading_more = false;
                loader.remove();
//                        $(page).text(xhr.responseText);
            }
        });
    };

    var initLoadMoreListener = function(page) {
        $(page).find('.match-list-container').bind('scroll', function() {
            if (loading_more) {
                return false;
            }
            if ($(this).scrollTop() >= this.scrollHeight - this.clientHeight - loading_threshold) {
                loadMoreAjax(page, $(page).find('.match-list-scroller'));
            }
        });
    };

    var destroy = function(page) {

    };


    var prependUpsellPortal = function(page) {
//        $.ajax({
//            type: 'POST',
//            url: SERVER_URL,
//            // data to be added to query string:
//            data: {
//                task: 'isInIos',
//                user_id: localStorage['user_id'],
//                format: 'json'
//            },
//            // type of data we are expecting in return:
//            dataType: 'json',
//            success: function(data) {
//                if (data.status === "success") {
//                    if (!parseInt(data.response.in_ios_app)) {
//                        
//                    }
//                } else {
//                    // TODO: handle server error
//                }
//            },
//            error: function(xhr, type) {
//                // TODO: handle server error
//                $(page).text(xhr.responseText);
//            }
//        });
        if (cards.utils.platform.os.name === 'ios') {
            var entry = $('<div>').attr('class', 'match-list-item upsell-portal')
                    .append($('<span>').attr('class', 'item-detail').html('<img src="images/info-icon.png"/> &nbsp;Want more matches? Get the full experience!'));
            entry.on('tap', function() {
                App.load('upsell');
            });
            $(page).find('.match-list-scroller').prepend(entry);
        }
    };

    var getList = function(page) {
        // TODO: AJAX call
        var loader = $('<div>').attr('class', 'match-list-item match-loading').append($('<img>').attr('src', 'images/loader.gif'));
        $(page).find('.match-list-scroller').append(loader);
        loading_more = true;
        var pushData = {
            task: "getData",
            format: "json",
            user_id: localStorage['user_id'],
            // TODO: only_match_and_admire should be 1
            requests: JSON.stringify([{"type": "messages_matches", "limit": loading_limit, "include_users_array": "1", "multiple_images": {"limit": "5"}}])
        };
        $.ajax({
            type: 'POST',
            url: SERVER_URL,
            // data to be added to query string:
            data: pushData,
            // type of data we are expecting in return:
            dataType: 'json',
            success: function(data) {
//                console.log(data.response.user_id);
                if (data.status === "success") {
//                        console.log(data.response);
                    var messages = data.response.data[0].messages;
                    var users = data.response.data[0].users;

                    var matchedUsersList = [];
                    for (var i = 0; i < messages.length; i++) {
                        var notif_obj = sok.utils.createUserMessageObject(users[i], messages[i]);
                        last_item_id = notif_obj.message_id;
                        matchedUsersList.push(notif_obj);
                    }
                    if (messages.length < loading_limit) {
                        if (os === 'ios') {
                            $(page).find('.match-list-container').unbind('scroll');
                        } else {
                            last_item_id = '';
                        }
                    }
                    generateList(page, matchedUsersList);
                    setTimeout(function() {
                        if (matchListScroll) matchListScroll.refresh();
                    }, 100);
                    loader.remove();
                    loading_more = false;
                } else {
                    // TODO: handle server error
                    loader.remove();
                    loading_more = false;
//                    $(page).text(data.status);
                }
            },
            error: function(xhr, type) {
                // TODO: handle server error
                loader.remove();
                loading_more = false;
//                $(page).text(xhr.responseText);
            }
        });




//        var fakeData = new Array(
//                {name: 'Christina', age: '33', city: 'San Francisco', country: 'United States', profile_pic: 'images/sample3.jpg', timestamp: '3:00PM', unread: 1},
//        {name: 'Ariel', age: '23', city: 'Waterloo', country: 'Canada', profile_pic: 'images/sample3.jpg', timestamp: '2:00PM', unread: 1},
//        {name: 'Sarah', age: '20', city: 'New Jersey', country: 'United States', profile_pic: 'images/sample3.jpg', timestamp: '1:00PM', unread: 0},
//        {name: 'Victoria', age: '21', city: 'Vancouver', country: 'Canada', profile_pic: 'images/sample3.jpg', timestamp: '1:00PM', unread: 0},
//        {name: 'Christina', age: '33', city: 'San Francisco', country: 'United States', profile_pic: 'images/sample3.jpg', timestamp: '3:00PM', unread: 1},
//        {name: 'Ariel', age: '23', city: 'Waterloo', country: 'Canada', profile_pic: 'images/sample3.jpg', timestamp: '2:00PM', unread: 1},
//        {name: 'Sarah', age: '20', city: 'New Jersey', country: 'United States', profile_pic: 'images/sample3.jpg', timestamp: '1:00PM', unread: 0},
//        {name: 'Victoria', age: '21', city: 'Vancouver', country: 'Canada', profile_pic: 'images/sample3.jpg', timestamp: '1:00PM', unread: 0},
//        {name: 'Christina', age: '33', city: 'San Francisco', country: 'United States', profile_pic: 'images/sample3.jpg', timestamp: '3:00PM', unread: 1},
//        {name: 'Ariel', age: '23', city: 'Waterloo', country: 'Canada', profile_pic: 'images/sample3.jpg', timestamp: '2:00PM', unread: 1},
//        {name: 'Sarah', age: '20', city: 'New Jersey', country: 'United States', profile_pic: 'images/sample3.jpg', timestamp: '1:00PM', unread: 0},
//        {name: 'Victoria', age: '21', city: 'Vancouver', country: 'Canada', profile_pic: 'images/sample3.jpg', timestamp: '1:00PM', unread: 0});
//
////        generateList(page, fakeData);
    };

    var generateList = function(page, list) {
        for (var i = 0; i < list.length; ++i) {
            var entry = generateEntry(page, list[i]);
            $(page).find('.match-list-scroller').append(entry);
        }
    };

    var generateEntry = function(page, item) {
        var entry = $('<div>').attr('class', 'match-list-item')
                .append($('<span>').attr('class', 'item-name').text(item.user_prefername).append(!parseInt(item.read) ? $('<div>').attr('class', 'unread-dot') : ''))
                .append($('<span>').attr('class', 'item-detail').text(item.user_age + ' / ' + item.user_city + ', ' + item.user_country))
                .append($('<span>').attr('class', 'item-timestamp').text(sok.utils.generateDateTimeString(item.timestamp)));
        var profile_pic_wrapper = $('<div>');
        entry.append(profile_pic_wrapper);
        var path = sok.utils.generateImagePathForLevel(item.user_current_profile_image_obj, 1);
        sok.utils.loadImage(path, profile_pic_wrapper, 100);
        entry.on('tap', function() {
            var thisEntry = $(this);
            thisEntry.addClass('button-pressed-blue');
            $(page).find('.app-button.right').off('tap');
            $(page).find('.side-page#menu').remove();
            unregisterBackButtonListener();
            App.load('vup', item, function() {
                thisEntry.removeClass('button-pressed-blue');
                notification.updater.reload();
                menu.prepare($(App.getPage()));
            });
            markMessageAsRead(entry, item.message_id);
        });
        return entry;
    };

    var markMessageAsRead = function(entry, message_id) {
        entry.find('.unread-dot').remove();
        $.ajax({
            type: 'POST',
            url: SERVER_URL,
            // data to be added to query string:
            data: {
                task: 'markMessageRead',
                format: 'json',
                user_id: localStorage['user_id'],
                message_id: message_id
            },
            // type of data we are expecting in return:
            dataType: 'json',
            success: function(data) {
//                console.log(data.response.user_id);
                if (data.status === "success") {
//                        console.log(data.response);
                } else {
                    // TODO: handle server error
//                    $(page).text(data.status);
                }
            },
            error: function(xhr, type) {
                // TODO: handle server error
//                $(page).text(xhr.responseText);
            }
        });
    };

    return {
        init: initialize,
        destroy: destroy,
        registerBackButtonListener: registerBackButtonListener,
        unregisterBackButtonListener: unregisterBackButtonListener
    };
}();