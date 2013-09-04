/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var notification = function() {
    var last_notif_id = "0";

    var latest_notif_id = "0";

    var all_notif_retrieved = false;

    var loading_more = false;

    var loading_threshold = 0;

    var notif_retrieval_threshold = 0;

    var notificationList = [];

    var currentPage = null;

    var retrievingPushToken = false;

    var needToReload = false;

    var os = '';

    var initialize = function() {
        os = localStorage['os'];
        needToReload = false;
        all_notif_retrieved = false;
        loading_threshold = 100;
        loading_more = false;
        last_notif_id = "0";
        latest_notif_id = "0";
        notif_retrieval_threshold = 20;
        currentPage = null;
        notificationList = [];
        retrievingPushToken = false;
        // push notification token to server
        initNotificationListener();
        // register notification listener
        registerListener();
        // get initial notifications
        notificationUpdater.initialLoad(true);
    };

    var getNotificationListCount = function() {
        return notificationList.length;
    };

    var loadMoreNotifAjax = function(page) {
        if (!last_notif_id) {
            return;
        }
        loading_more = true;
        console.log('notif loading...');
        var loader = $('<div>').attr('class', 'notif-list-item notif-loading').append($('<img>').attr('src', 'images/loader.gif'));
        $(page).find('#notification-list-scroller').append(loader);
        var pushData = {
            task: "getData",
            format: "json",
            user_id: localStorage['user_id'],
            requests: JSON.stringify([{"type": "messages_notif", "limit": notif_retrieval_threshold, "include_users_array": "1", "only_match_and_admire": "1", "multiple_images": {"limit": "5"}, "more_messages": {"older": "1", "last_id": last_notif_id}}])
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
//                                console.log(data.response);
                    var messages = data.response.data[0].messages;
                    var users = data.response.data[0].users;
                    for (var i = 0; i < messages.length; ++i) {
                        var notif_obj = sok.utils.createUserMessageObject(users[i], messages[i]);
                        notificationList.unshift(notif_obj);
                        if (i === messages.length - 1)
                            last_notif_id = notif_obj.message_id;
                    }
                    if (messages.length < notif_retrieval_threshold) {
                        if (os === 'ios') {
                            notif_list.unbind('scroll');
                        } else {
                            last_notif_id = '';
                        }
                        all_notif_retrieved = true;
                    }
                    loader.remove();
                    $(page).find('#notification-bubble span').text(notificationList.length);
                    notificationUpdater.generateList(notificationList);
                    setTimeout(function() {
                        if (notificationScroll) notificationScroll.refresh();
                    }, 100);
                    loading_more = false;
                } else {
                    // TODO: handle server error
                    loader.remove();
                    console.log(data);
                    loading_more = false;
                }
            },
            error: function(xhr, type) {
                // TODO: error handling
                loader.remove();
                console.log(xhr.responseText);
                loading_more = false;
            }
        });
    };

    var prepareNotification = function(page) {
        var toggleNotificationPanel = false;
        currentPage = page;
        initNotificationListener();

        var title_label = $('<div>').attr('id', 'title').text('Notifications');
        var notif_list_scroller = $('<div>').attr('id', 'notification-list-scroller');
        var notif_empty_container = $('<div>').attr('id', 'notification-empty-container')
                .append($('<img>').attr('src', 'images/smiley-bubble.png'))
                .append($('<span>').text('There are currently no new notifications'));
        var notif_list = $('<div>').attr('id', 'notification-list-container').css('height', (window.innerHeight < 540) ? '323px' : '').append(notif_list_scroller).append(notif_empty_container);
        var notif_container = $('<div>').attr('class', 'notification-panel-container').append(title_label).append(notif_list);

        var loader = $('<div>').attr('class', 'notif-list-item notif-loading').append($('<img>').attr('src', 'images/loader.gif'));
        notif_list_scroller.prepend(loader);

        if (os === 'ios') {
            notif_list.bind('scroll', function() {
                if (loading_more || all_notif_retrieved) {
                    return false;
                }
                if ($(this).scrollTop() >= this.scrollHeight - this.clientHeight - loading_threshold) {
                    loadMoreNotifAjax(page);
                }
            });
        }

        var notification = $('<div>').attr('class', 'notification-panel').append(notif_container).css('height', (window.innerHeight < 540) ? '400px' : '');
        $(page).find('.app-content').append(notification);
        $(page).find('.notification-button').on('tap', function() {
            if (!toggleNotificationPanel) {

                if ($(page).attr('data-page') === "matchGame") {
                    FlurryAgent.logEvent("MatchGame: Notifications Tap");
                } else if ($(page).attr('data-page') === "matchList") {
                    FlurryAgent.logEvent("MyMatches: Notifications Tap");
                }


                $('#sw-wrapper').css('visibility', 'hidden');
                if (os === 'ios') {
                    notif_list.addClass('scrollable');
                }
                var mask = $('<div>').attr('class', 'mask');
                $(page).find('.app-content').append(mask);
                mask.on('tap', function() {
                    notification.removeClass('active');
                    if (os === 'ios') {
                        $(this).addClass('fadeOut');
                        setTimeout(function() {
                            notif_list.removeClass('scrollable');
                            notification.css('z-index', '');
                            mask.remove();
                        }, 210);
                    } else {
                        notification.css('z-index', '');
                        mask.remove();
                    }
                    toggleNotificationPanel = !toggleNotificationPanel;
                });
                notification.css('z-index', '3002');
                notification.addClass('active');
                if (os === 'ios') {
                    mask.addClass('fadeIn');
                } else {
                    mask.css('opacity', '0.9');
                }
            } else {
                $('#sw-wrapper').css('visibility', '');
                notification.removeClass('active');
                if (os === 'ios') {
                    $(page).find('.mask').addClass('fadeOut');
                    setTimeout(function() {
                        notif_list.removeClass('scrollable');
                        notification.css('z-index', '');
                        $(page).find('.mask').remove();
                    }, 210);
                } else {
                    notification.css('z-index', '');
                    $(page).find('.mask').remove();
                }
            }
            toggleNotificationPanel = !toggleNotificationPanel;

        }).bind('touchstart', function() {
            $(page).find('span#notification-bubble').addClass('button-pressed');
        }).bind('touchend', function() {
            $(page).find('span#notification-bubble').removeClass('button-pressed');
        }).bind('touchmove', function() {
            $(page).find('span#notification-bubble').removeClass('button-pressed');
            return false;
        });

        if (needToReload) {
            notificationUpdater.reload();
            needToReload = false;
        } else {
            notificationUpdater.initialLoad(false);
        }
                
        sok.utils.enableAndroidScrolling("notification", notif_list_scroller, notif_list, null, null, function(newPos) {
            if (!loading_more && !all_notif_retrieved) {
                if (newPos < notif_list.height() - notif_list_scroller.height() + loading_threshold) {
                    loadMoreNotifAjax(page);
                }
            }  
        });
    };

    var initNotificationListener = function() {
        if (retrievingPushToken)
            return false;
        retrievingPushToken = true;
        if (cards.push) {
            cards.push.getToken(function(token) {
                if (token) {
                    localStorage['kik_card_push_token'] = token;
                    $.ajax({
                        type: 'POST',
                        url: SERVER_URL,
                        data: {
                            task: 'setKikPushToken',
                            format: 'json',
                            user_id: localStorage['user_id'],
                            token: token
                        },
                        dataType: 'json',
                        success: function(data) {
                            if (data.status === "success") {
                                // nothing
                            } else {
                                // TODO: handle server error
                            }
                            retrievingPushToken = false;
                        },
                        error: function(xhr, type) {
                            // TODO: handle server error
                            retrievingPushToken = false;
//                        $(page).text(xhr.responseText);
                        }
                    });

                }
                else {
                    // failed to receive token, retry later
                    setTimeout(initNotificationListener, 3000);
                }
            });
        }
    };

    var registerListener = function() {
        var pushSenderId = 0;
        var pushType = '';
        if (cards.push) {
            var handledPushImmediately = cards.push.handler(function(data) {
                // this function will run for every push received
                // 'data' is the parsed JSON object specified in your push
                // example from above: data === { 'your' : 'json_object' }

                // prepend new notification cell
//            notificationUpdater.insert(data);
                pushSenderId = data.sender_user_id;
                pushType = data.message_type;
                notificationUpdater.reload(); // TODO: maybe in the future we need to implement function to only refresh top.
//            $(App.getPage()).html(data.sender_user_id + '<br>' + localStorage['user_id']);
                if (data.message_type === 'match') {
                    // TODO: don't show match dialog for receiver for now. maybe need to show it in the future. And then we need to implement a queue mechanism to queue all match dialogs, then to show them one by one as we click on close button.
                    matchGame.showMatchDialog($(App.getPage()), data.sender_user_id);
                }
            });
            if (!handledPushImmediately === false && pushType === 'match') {
//            $(App.getPage()).text(pushSenderId);
                var pushData = {
                    task: "getData",
                    format: "json",
                    user_id: localStorage['user_id'],
                    requests: JSON.stringify([{"type": "user_basic_info", "target_id": pushSenderId, "multiple_images": {"limit": "5"}}])
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
                            userData.isUserObject = true;
                            userData.disableBackButton = true;
                            App.load('vup', userData, function() {
                                menu.prepare($(App.getPage()));
                            });
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
        }
//        typeof handledPushImmediately === 'boolean';
    };




    var notificationUpdater = function() {

        var getList = function(dataOnly, callback) {
            if (dataOnly) {
                all_notif_retrieved = false;
                var pushData = {
                    task: "getData",
                    format: "json",
                    user_id: localStorage['user_id'],
                    requests: JSON.stringify([{"type": "messages_notif", "limit": notif_retrieval_threshold, "include_users_array": "1", "only_match_and_admire": "1", "multiple_images": {"limit": "5"}}])
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
                            notificationList = []; // remove existing notifications
                            var messages = data.response.data[0].messages;
                            var users = data.response.data[0].users;
                            if (messages.length < notif_retrieval_threshold) {
                                if (os === 'ios') {
                                    $(App.getPage()).find('#notification-list-container').unbind('scroll');
                                } else {
                                    last_notif_id = '';
                                }
                                all_notif_retrieved = true;
                            }
                            for (var i = messages.length - 1; i >= 0; i--) {
                                var notif_obj = sok.utils.createUserMessageObject(users[i], messages[i]);
                                notificationList.push(notif_obj);
                                if (i === messages.length - 1)
                                    last_notif_id = notif_obj.message_id;
                                if (i === 0)
                                    latest_notif_id = notif_obj.message_id;
                            }
                            $(App.getPage()).find('.notif-loading').remove();
                            if (callback)
                                callback();

                        } else {
                            // TODO: handle server error
                            $(App.getPage()).find('.notif-loading').remove();
//                            $(page).text(data.status);
                        }
                    },
                    error: function(xhr, type) {
                        // TODO: handle server error
                        $(App.getPage()).find('.notif-loading').remove();
//                        $(page).text(xhr.responseText);
                    }
                });
            } else {
                if (notificationList.length === 0) {
                    getList(true, function() {
                        $(App.getPage()).find('#notification-bubble span').text(notificationList.length);
                        generateList(notificationList);
                        setTimeout(function() {
                            if (notificationScroll) notificationScroll.refresh();
                        }, 100);
                    });

                } else {
                    $(App.getPage()).find('#notification-bubble span').text(notificationList.length);
                    generateList(notificationList);
                    setTimeout(function() {
                        if (notificationScroll) notificationScroll.refresh();
                    }, 100);
                }
            }

        };

        var regenerateList = function(page) {
            currentPage = page;

            if (notificationList.length !== 0) {
                generateList(notificationList);
                setTimeout(function() {
                    if (notificationScroll) notificationScroll.refresh();
                }, 100);
            } else {
                reloadNotification();
            }
        };

        var generateList = function(list) {
            if ($(currentPage).find('#notification-list-scroller').length)
                $(currentPage).find('#notification-list-scroller').children().remove(); // remove existing notifications
            if (list.length) {
                $(currentPage).find('#notification-empty-container').hide();
            } else {
                $(currentPage).find('#notification-empty-container').show();
            }
            for (var i = 0; i < list.length; ++i) {
                var entry = generateEntry(list[i]);
                $(currentPage).find('#notification-list-scroller').prepend(entry);
            }
        };


        var generateEntry = function(item) {
            var entry = $('<div>').attr('class', 'notif-list-item');

            var profile_pic_small = $('<div>').attr('class', 'profile-pic-small');
            var notif_message = $('<div>').attr('class', 'notif-message');
            var timestamp = $('<div>').attr('class', 'timestamp');

            entry.append(profile_pic_small).append(notif_message).append(timestamp);
            // TODO: uncomment the following if else. In else we need to handle admire notif message.
            if (item.message_type === "match") {
                var path = sok.utils.generateImagePathForLevel(item.user_current_profile_image_obj, 1);
                sok.utils.loadImage(path, profile_pic_small, 100);
                notif_message.html('You are <b>matched</b> with <b style="color: #73BB3C">' + sok.utils.truncateText(item.user_prefername, 10, "...") + '!</b> Start a Kik chat with ' + (item.user_gender === "female" ? 'her!' : 'him!'));
            } else if (item.message_type === "admire") { // maybe another type
                sok.utils.loadImage('images/anonymous_pic.png', profile_pic_small, 100);
                notif_message.html('Someone secretly <b>hearted</b> you!');
            }
            timestamp.text(sok.utils.generateDateTimeString(parseInt(item.timestamp)));
            
            entry.on('tap', function() {
                var thisEntry = $(this);
                thisEntry.addClass('button-pressed-blue');
                FlurryAgent.logEvent("Panel-Notif: Notif Tap");

                // TODO: consume the notification
                consumeNotification(item);
                // App.load vup with parameter passed in.
                if (item.message_type === "match") {
                    $(App.getPage()).find('.app-button.right').off('tap');
                    $(App.getPage()).find('.side-page#menu').remove();
                    var currentPage = App.getPage();
                    App.load('vup', item, function() {
                        menu.prepare($(App.getPage()));
                        thisEntry.removeClass('button-pressed-blue');
                        $(currentPage).find('.notification-button').trigger('tap');
                    });
                } else if (item.message_type === "admire") { // admire
                    if (App.current() === "matchGame") {
                        $(App.getPage()).find('.notification-button').trigger('tap');
                        imageViewer.swipeGesture.removeSwipePassedUsers(function() {
                            matchGame.reload($(App.getPage()));
                        });
                    } else {
                        $(App.getPage()).find('.app-button.right').off('tap');
                        $(App.getPage()).find('.side-page#menu').remove();
                        App.removeFromStack(); // make sure match game is removed first.
                        App.load('matchGame', {}, function() {
                            menu.prepare($(App.getPage()));
                            thisEntry.removeClass('button-pressed-blue');
                            App.removeFromStack();
                        });
                    }

                }
            });
            
            return entry;

        };


        var insertNotification = function(pushObj) { // deprecated
            var sender_user_id = pushObj.sender_user_id;
            var message_type = pushObj.message_type;
            var message_id = pushObj.message_id;
            // TODO: get the user and message according to user id and message id.
            var pushData = {
                task: "getData",
                format: "json",
                user_id: localStorage['user_id'],
                // TODO: only_match should be 1
                requests: JSON.stringify([{"type": "messages_notif", "limit": "1", "include_users_array": "1", "only_match_and_admire": "1", "multiple_images": {"limit": "5"}, "target_message_id": message_id, "target_user_id": sender_user_id}])
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
                        var messages = data.response.data[0].messages;
                        var users = data.response.data[0].users;
                        if (users.length && messages.length) {
                            var notif_obj = sok.utils.createUserMessageObject(users[0], messages[0]);
                            notificationList.push(notif_obj);
                            latest_notif_id = notif_obj.message_id;
                            if ($(currentPage).find('#notification-list-scroller').length) {
                                var new_entry = generateEntry(notif_obj);
                                $(currentPage).find('#notification-list-scroller').prepend(new_entry);
                            }

                        }
                    } else {
                        // TODO: handle server error
                        $(currentPage).text(data.status);
                    }
                },
                error: function(xhr, type) {
                    // TODO: handle server error
                    $(currentPage).text(xhr.responseText);
                }
            });
            // TODO: in callback, prepend the retrieved info into notificationList
            // TODO: in callback, prepend the retrieved data to notif_list object

        };

        var reloadNotification = function() {
            all_notif_retrieved = false;
            if ($(currentPage).find('#notification-list-scroller').length)
                $(currentPage).find('#notification-list-scroller').children().remove(); // remove existing notifications
            var loader = $('<div>').attr('class', 'notif-list-item notif-loading').append($('<img>').attr('src', 'images/loader.gif'));
            $(App.getPage()).find('#notification-list-scroller').prepend(loader);
            var pushData = {
                task: "getData",
                format: "json",
                user_id: localStorage['user_id'],
                requests: JSON.stringify([{"type": "messages_notif", "limit": notif_retrieval_threshold, "include_users_array": "1", "only_match_and_admire": "1", "multiple_images": {"limit": "5"}}])
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
                        notificationList = []; // remove existing notifications
                        var messages = data.response.data[0].messages;
                        var users = data.response.data[0].users;

                        for (var i = messages.length - 1; i >= 0; i--) {
                            var notif_obj = sok.utils.createUserMessageObject(users[i], messages[i]);
                            notificationList.push(notif_obj);
                            if (i === messages.length - 1)
                                last_notif_id = notif_obj.message_id;
                            if (i === 0)
                                latest_notif_id = notif_obj.message_id;
                        }
                        $(App.getPage()).find('#notification-bubble span').text(notificationList.length);
                        generateList(notificationList);
                        loader.remove();
                        setTimeout(function() {
                            if (notificationScroll) notificationScroll.refresh();
                        }, 100);
                        needToReload = false;
                    } else {
                        // TODO: handle server error
                        loader.remove();
//                        $(page).text(data.status);
                    }
                },
                error: function(xhr, type) {
                    // TODO: handle server error
                    loader.remove();
//                    $(page).text(xhr.responseText);
                }
            });
        }

        var consumeNotification = function(item) {
            var pushData = {
                task: 'consumeNotificationType',
                format: 'json',
                user_id: localStorage['user_id'],
                target_user_id: item.sender_id,
                notification_type: item.message_type,
                latest_notification_id: item.message_id
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
                        needToReload = true;
                        reloadNotification();
                    } else {
                        // TODO: error handling
                    }
                },
                error: function(xhr, type) {
                    // TODO: error handling

                }
            });
        };

        var clearAllNotifications = function() {

        };

        return {
            initialLoad: getList,
            generateList: generateList,
            reload: reloadNotification,
            regenerate: regenerateList, //TODO: called in App.back() callback.
            insert: insertNotification, // deprecated
            consume: consumeNotification,
            clear: clearAllNotifications
        };
    }();

    return {
        init: initialize,
        prepare: prepareNotification,
        updater: notificationUpdater,
        getNotificationListCount: getNotificationListCount
    };
}();