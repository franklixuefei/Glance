/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


// TODO: save all modified user data/preference to localStorage and server.
// TODO: put all frequently used images to preload div in index.html

// matchGame
var myScroll;
var iScrollArray;

// matchList
var matchListScroll;

// myProfile
var myProfileScroll;

// notification
var notificationScroll;

var sok = function() {
    
    
    var init = function() {
        myScroll = null;
        currentIScroll = null;
        iScrollArray = [];
        
        if (cards.browser) {
            cards.browser.setOrientationLock('portrait');
        }

        localStorage['window_width'] = window.innerWidth;
        localStorage['os'] = cards.utils.platform.os.name;
        localStorage['os_version'] = cards.utils.platform.os.version;

        App.populator('intro', function(page, user) {
            intro.init(page, user);
        }, function(page) {
            intro.destroy(page);
        });

        App.populator('register', function(page) {
            register.init(page);
        }, function(page) {
            register.destroy(page);
        });

        App.populator('matchGame', function(page, params) {
            matchGame.init(page);
            imageViewer.init(page, 44, false);
            matchGame.prepareData(page);
            notification.prepare(page);
            $(page).on('appShow', function() {
                $(page).find('#notification-bubble span').text(notification.getNotificationListCount());
            });
            $(page).on('appHide', function() {
                imageViewer.swipeGesture.removeSwipePassedUsers();
            });

        }, function(page) { // destructor
            imageViewer.destroy(page);
            matchGame.destroy(page);
        });

        App.populator('vup', function(page, params) {
            vup.init(page);
            imageViewer.init(page, 88, true);
            vup.prepareData(page, params);
            notification.prepare(page);
            $(page).on('appShow', function() {
                $(page).find('#notification-bubble span').text(notification.getNotificationListCount());
            });
        }, function(page) {
            imageViewer.destroy(page);
            vup.destroy(page);
        });

        App.populator('preferences', function(page) {
            preferences.init(page);
            notification.prepare(page);
            $(page).on('appShow', function() {
                $(page).find('#notification-bubble span').text(notification.getNotificationListCount());
            });
        }, function(page) {

        });

        App.populator('settings', function(page) {
            settings.init(page);
            notification.prepare(page);
            $(page).on('appShow', function() {
                $(page).find('#notification-bubble span').text(notification.getNotificationListCount());
            });
        }, function(page) {

        });

        App.populator('matchList', function(page) {
            matchList.init(page);
            notification.prepare(page);
            $(page).on('appShow', function() {
                $(page).find('#notification-bubble span').text(notification.getNotificationListCount());
            });
        }, function(page) {
            matchList.destroy(page);
        });

        App.populator('myProfile', function(page) {
            myProfile.init(page);
            notification.prepare(page);
            $(page).on('appShow', function() {
                $(page).find('#notification-bubble span').text(notification.getNotificationListCount());
            });
        }, function(page) {
            myProfile.destroy(page);
        });

        App.populator('upsell', function(page) {
            upsell.init(page);
        });

        if (localStorage["intro_flow_done"] === "true") {
// initialize menu with user info (retrieve from localStorage)
            menu.init(); // call only once here
// initialize notification panel
            notification.init(); // call only once here
            App.load('matchGame', {}, function() {
                menu.prepare($(App.getPage()));
            });
        } else {
            FlurryAgent.logEvent("Login-Review: Entry");
            App.load('register', {}, function() {
            });
        }
//        menu.init();
////        notification.init();
//        localStorage['user_id'] = 737;
//        App.load('myProfile', {}, function() {
//            menu.prepare($(App.getPage()));
//        });
    };

    var utils = function() {

        var showGeneralDialog = function(title, body, okText) {
            var mask = $('<div>').attr('class', 'mask');
            $(App.getPage()).find('.page-container').append(mask);
            if (localStorage['os'] === 'ios') {
                mask.addClass('fadeIn');
            } else {
                mask.css('opacity', '0.9');
            }

            var gdTitle = $('<div>').attr('id', 'gd-title').text(title);
            var gdContent = $('<div>').attr('id', 'gd-content').text(body);
            var gdOk = $('<div>').attr('id', 'gd-ok').text(okText ? okText : "OK");

            var generalDialog = $('<div>').attr('class', 'general-dialog');
            $(App.getPage()).find('.page-container').append(generalDialog);

            generalDialog.append(gdTitle).append(gdContent).append(gdOk);

            gdOk.on('tap', function() {
                generalDialog.removeClass('active');
                if (localStorage['os'] === 'ios') {
                    mask.addClass('fadeOut');
                    setTimeout(function() {
                        generalDialog.remove();
                        mask.remove();
                    }, 160);
                } else {
                    generalDialog.remove();
                    mask.remove();
                }
            }).bind('touchstart', function() {
                $(this).addClass('button-pressed-blue');
            }).bind('touchend', function() {
                $(this).removeClass('button-pressed-blue');
            }).bind('touchmove', function() {
                $(this).removeClass('button-pressed-blue');
                return false;
            });

            var contentHeight = gdContent.height();

            if (contentHeight > 40) {
                var newHeight = 40 + (contentHeight + 12) + 40;
                generalDialog.css('height', newHeight + 'px').css('margin-top', (-1 * Math.round(newHeight / 2)) + 'px');
            }
            generalDialog.addClass('active');
        };

        var showConfirmDialog = function(title, body, okCallback, cancelCallback, okText, cancelText) {
            var mask = $('<div>').attr('class', 'mask');
            $(App.getPage()).find('.page-container').append(mask);
            if (localStorage['os'] === 'ios') {
                mask.addClass('fadeIn');
            } else {
                mask.css('opacity', '0.9');
            }
            var cdTitle = $('<div>').attr('id', 'cd-title').text(title);
            var cdContent = $('<div>').attr('id', 'cd-content').text(body);
            var cdOk = $('<div>').attr('class', 'cd-buttons').attr('id', 'cd-ok').text(okText ? okText : "OK");
            var cdCancel = $('<div>').attr('class', 'cd-buttons').attr('id', 'cd-cancel').text(cancelText ? cancelText : "Cancel");

            var verticalDelimiter = $('<div>').attr('id', 'vertical-delimiter');

            var confirmDialog = $('<div>').attr('class', 'confirm-dialog');
            $(App.getPage()).find('.page-container').append(confirmDialog);

            confirmDialog.append(cdTitle).append(cdContent).append(cdOk).append(cdCancel);

            cdOk.on('tap', function() {
                confirmDialog.removeClass('active');
                if (localStorage['os'] === 'ios') {
                    mask.addClass('fadeOut');
                    setTimeout(function() {
                        confirmDialog.remove();
                        mask.remove();
                        okCallback();
                    }, 160);
                } else {
                    confirmDialog.remove();
                    mask.remove();
                    okCallback();
                }
            }).bind('touchstart', function() {
                $(this).addClass('button-pressed-blue');
            }).bind('touchend', function() {
                $(this).removeClass('button-pressed-blue');
            }).bind('touchmove', function() {
                $(this).removeClass('button-pressed-blue');
                return false;
            });

            cdCancel.on('tap', function() {
                if (localStorage['os'] === 'ios') {
                    confirmDialog.removeClass('active');
                    mask.addClass('fadeOut');
                    setTimeout(function() {
                        confirmDialog.remove();
                        mask.remove();
                        cancelCallback();
                    }, 160);
                } else {
                    confirmDialog.remove();
                    mask.remove();
                    cancelCallback();
                }
            }).bind('touchstart', function() {
                $(this).addClass('button-pressed-blue');
            }).bind('touchend', function() {
                $(this).removeClass('button-pressed-blue');
            }).bind('touchmove', function() {
                $(this).removeClass('button-pressed-blue');
                return false;
            });

            var contentHeight = cdContent.height();

            if (contentHeight > 40) {
                var newHeight = 40 + (contentHeight + 12) + 40;
                confirmDialog.css('height', newHeight + 'px').css('margin-top', (-1 * Math.round(newHeight / 2)) + 'px');
            }
            confirmDialog.append(verticalDelimiter);
            confirmDialog.addClass('active');
        };

        var enableAndroidScrolling = function(pageName, scroller, wrapper, touchStartCallback, touchMoveCallback, touchEndCallback) {
            if (localStorage['os'] !== 'ios') { // emulates scrolling.
			/*
                wrapper.removeClass('scrollable');
                scroller.addClass('android-scrollable');
                var startY = 0;
                var offset = 0;
                var moveDist = 0;
                var newPos = 0;
                scroller.bind('touchstart', function(e) {
                    startY = e.targetTouches[0].clientY;
                    if (touchStartCallback)
                        touchStartCallback(newPos, startY, offset, moveDist);
                }).bind('touchmove', function(e) {
                    moveDist = e.targetTouches[0].clientY - startY;
                    newPos = offset + moveDist;
                    var wrapperHeight = wrapper.height();
                    var scrollerHeight = scroller.height();
                    if (newPos < wrapperHeight - scrollerHeight)
                        newPos = wrapperHeight - scrollerHeight;
                    if (newPos > 0)
                        newPos = 0;
                    moveDist = newPos - offset;
                    $(this).css('-webkit-transform', 'translate3d(0,' + newPos + 'px,0)');
                    if (touchMoveCallback)
                        touchMoveCallback(newPos, startY, offset, moveDist);
                }).bind('touchend', function(e) {
                    offset += moveDist;
                    if (touchEndCallback)
                        touchEndCallback(newPos, startY, offset, moveDist);
                });
				*/
			
                wrapper.removeClass('scrollable');
                scroller.addClass('android-scrollable');

                if (pageName === "matchGame" || pageName === "vup") {
                    myScroll = new IScroll(wrapper[0], {
                        probeType: 3,
                        bounce: false
                    });

                    myScroll.on('scrollStart', function() {
                        if (touchStartCallback)
                            touchStartCallback(this.y>>0);
                    });
                    myScroll.on('scroll', function() {
                        if (touchMoveCallback)
                            touchMoveCallback(this.y>>0);
                    });
                    myScroll.on('scrollEnd', function() {
                        if (touchEndCallback)
                            touchEndCallback(this.y>>0);
                    });
                    iScrollArray.push(myScroll);
                    if (iScrollArray.length > 4) {
                        for (var i = 0; i < iScrollArray.length; ++i) {
                            if (iScrollArray[i] && !iScrollArray[i].wrapper.parentNode) {
                                iScrollArray[i].destroy();
                                iScrollArray[i] = null;
                                break;
                            }
                        }
                    }
                } else if (pageName === "matchList") {
                    if (matchListScroll) matchListScroll.destroy();
                    matchListScroll = null;
                    matchListScroll = new IScroll(wrapper[0], {
                        probeType: 3,
                        bounce: false
                    });

                    matchListScroll.on('scrollStart', function() {
                        if (touchStartCallback)
                            touchStartCallback(this.y>>0);
                    });
                    matchListScroll.on('scroll', function() {
                        if (touchMoveCallback)
                            touchMoveCallback(this.y>>0);
                    });
                    matchListScroll.on('scrollEnd', function() {
                        if (touchEndCallback)
                            touchEndCallback(this.y>>0);
                    });
                    
                } else if (pageName === "myProfile") {
                    if (myProfileScroll) myProfileScroll.destroy();
                    myProfileScroll = null;
                    myProfileScroll = new IScroll(wrapper[0], {
                        probeType: 3,
                        bounce: false
                    });

                    myProfileScroll.on('scrollStart', function() {
                        if (touchStartCallback)
                            touchStartCallback(this.y>>0);
                    });
                    myProfileScroll.on('scroll', function() {
                        if (touchMoveCallback)
                            touchMoveCallback(this.y>>0);
                    });
                    myProfileScroll.on('scrollEnd', function() {
                        if (touchEndCallback)
                            touchEndCallback(this.y>>0);
                    });
                } else if (pageName === "notification") {
                    if (notificationScroll) notificationScroll.destroy();
                    notificationScroll = null;
                    notificationScroll = new IScroll(wrapper[0], {
                        probeType: 3,
                        bounce: false
                    });

                    notificationScroll.on('scrollStart', function() {
                        if (touchStartCallback)
                            touchStartCallback(this.y>>0);
                    });
                    notificationScroll.on('scroll', function() {
                        if (touchMoveCallback)
                            touchMoveCallback(this.y>>0);
                    });
                    notificationScroll.on('scrollEnd', function() {
                        if (touchEndCallback)
                            touchEndCallback(this.y>>0);
                    });
                }
            }
        };

        var quickFit = function(elemsArr, totalWidth) {
            var actualWidth = 0;
            for (var i = 0; i < elemsArr.length; ++i) {
                var elemWidth = $(elemsArr[i]).width();
                if (elemWidth) {
                    actualWidth += elemWidth;
                } else {
                    return;
                }
            }
            while (actualWidth > totalWidth) {
                for (var i = 0; i < elemsArr.length; ++i) {
                    var fontSizeStr = $(elemsArr[i]).css('font-size');
                    if (fontSizeStr) {
                        var origFontSize = parseInt(Math.round(fontSizeStr.replace('px', '')));
                        origFontSize--;
                        $(elemsArr[i]).css('font-size', origFontSize + 'px');
                    } else {
                        return;
                    }
                }
                actualWidth = 0;
                for (var i = 0; i < elemsArr.length; ++i) {
                    var elemWidth = $(elemsArr[i]).width();
                    if (elemWidth) {
                        actualWidth += elemWidth;
                    } else {
                        return;
                    }
                }
            }
        };

        var truncateText = function(text, len, tail) {
            var truncatedText = "";
            if (text.indexOf(' ') !== -1) {
                truncatedText = text.split(' ')[0];
                if (truncatedText.length > 10) {
                    truncatedText = truncatedText.substring(0, len) + tail;
                }
            } else {
                truncatedText = text.substring(0, len) + tail;
            }
            return truncatedText;
        };

        var loadImage = function(src, wrapper_obj, fadeDuration) {
            var img = new Image();
            img.src = src;

            if (!img.complete) {
                img.onload = function() {
                    $(wrapper_obj).css('background-image', 'url("' + src + '");').css('background-size', 'cover').css('background-position', 'center');
                };
            } else {
                $(wrapper_obj).css('background-image', 'url("' + src + '");').css('background-size', 'cover').css('background-position', 'center');
            }

        };

        var loadImg = function(src, img_class, img_id, fadeDuration, wrapper) {
            var img = new Image();
            img.src = src;
            img.className = img_class;
            img.id = img_id;
            $(wrapper).append($(img));
            if (!img.complete) {
                $(img).css('opacity', '0');
                img.onload = function() {
                    $(this).animate({
                        'opacity': 1
                    }, fadeDuration, 'ease-out');
                };
            }
        };

        var ageForBirthday = function(birthdayTimestamp) {
            return Math.floor(((new Date()).getTime() / 1000 - parseInt(birthdayTimestamp)) / 3600 / 24 / 365);
        };

        var generateImagePathForLevel = function(imageObj, level) { // 0,1,2,3,4,5
            return imageObj.image.base_path + '_' + imageObj.image.sizes[level];
        };

        var createUserMessageObject = function(user, message) {
            var notif_obj = {};
            notif_obj.sender_id = message.sender_id;
            notif_obj.message_id = message.message_id;
            notif_obj.read = message.read;
            notif_obj.receiver_id = message.receiver_id;
            notif_obj.timestamp = message.message_time;
            notif_obj.message_type = message.message_type;
            notif_obj.user_prefername = user.user_display_name;
            notif_obj.user_gender = user.user_gender;
            notif_obj.user_age = sok.utils.ageForBirthday(parseInt(user.birthday_timestamp));
            notif_obj.user_current_profile_image_obj = user.image;
            notif_obj.user_profile_images_array = user.images;
            notif_obj.user_kik_id = user.kik_id;
            notif_obj.user_city = user.user_city;
            notif_obj.user_country = user.user_country;
            notif_obj.iso = user.location.iso_country;
            return notif_obj;
        };

        var createUserObject = function(user) {
            var profileObj = {};
            var tmp_last_image_id = "0";
            profileObj.user_id = user ? user.user_id : null;
            profileObj.name = user ? user.user_display_name : null;
            profileObj.kik_id = user ? user.kik_id : null;
            profileObj.age = user ? sok.utils.ageForBirthday(user.birthday_timestamp) : null;
            profileObj.from = user ? user.user_city : null;
            profileObj.iso = user ? user.location.iso_country : null;
            if (user) {
                var imageArray = [];
                for (var j = 0; j < user.images.length; ++j) {
                    imageArray.push(sok.utils.generateImagePathForLevel(user.images[j], 5));
                    tmp_last_image_id = user.images[j].id;
                }
                profileObj.url = imageArray;
                profileObj.last_image_id = tmp_last_image_id;
            } else {
                profileObj.url = null;
                profileObj.last_image_id = null;
            }
            profileObj.current_profile_image_medium = user ? (user.image ? sok.utils.generateImagePathForLevel(user.image, 2) : "") : null;
            profileObj.current_profile_image_large = user ? (user.image ? sok.utils.generateImagePathForLevel(user.image, 3) : "") : null;
            return profileObj;
        };

        var createTutorial = function() {
            var tutorialArr = [];
            var tutCount = 3;
            for (var i = 0; i < tutCount; ++i) {
                var tutObj = {};
                tutObj.tutNum = i + 1; // 1 2 3 ...
                tutObj.user_id = null;
                tutObj.name = null;
                tutObj.kik_id = null;
                tutObj.age = null;
                tutObj.from = null;
                tutObj.url = null;
                tutObj.last_image_id = null;
                tutObj.current_profile_image_medium = null;
                tutObj.current_profile_image_large = null;
                tutorialArr.push(tutObj);
            }
            return tutorialArr;
        };

        var createDetailPanel = function(detailObj) {
            detailObj.detailPanel = true;
            detailObj.admireCount = detailObj.admire_count;
            detailObj.admireRange = detailObj.admire_range;
            detailObj.totalAdmireCount = detailObj.total_admire_count;
            detailObj.user_id = null;
            detailObj.name = null;
            detailObj.kik_id = null;
            detailObj.age = null;
            detailObj.from = null;
            detailObj.url = null;
            detailObj.last_image_id = null;
            detailObj.current_profile_image_medium = null;
            detailObj.current_profile_image_large = null;
            return detailObj;
        };

        var convertUserMessageObjectToUserObject = function(userMessageObject) {
            var userObj = {};
            var tmp_last_image_id = "0";
            userObj.user_id = userMessageObject.sender_id;
            userObj.name = userMessageObject.user_prefername;
            userObj.kik_id = userMessageObject.user_kik_id;
            userObj.age = userMessageObject.user_age;
            userObj.from = userMessageObject.user_city;
            userObj.iso = userMessageObject.iso;
            var imageArray = [];
            for (var j = 0; j < userMessageObject.user_profile_images_array.length; ++j) {
                imageArray.push(sok.utils.generateImagePathForLevel(userMessageObject.user_profile_images_array[j], 5));
                tmp_last_image_id = userMessageObject.user_profile_images_array[j].id;
            }
            userObj.url = imageArray;
            userObj.last_image_id = tmp_last_image_id;
            userObj.current_profile_image_medium = sok.utils.generateImagePathForLevel(userMessageObject.user_current_profile_image_obj, 2);
            userObj.current_profile_image_large = sok.utils.generateImagePathForLevel(userMessageObject.user_current_profile_image_obj, 3);
            return userObj;
        };

        var generateDateTimeForSecondsSince1970 = function(seconds) {
            var d = new Date();
            var monthNames = ["January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"];
            var strTime = null;
            var date = new Date(seconds * 1000);
            if ((d.getTime() - seconds * 1000) / 1000 / 3600 / 24 >= 1) {
                strTime = [date.getDate(), monthNames[date.getMonth()], date.getFullYear()].join('-');
            } else {
                var hours = date.getHours();
                var minutes = date.getMinutes();
                var ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12;
                hours = hours ? hours : 12; // the hour '0' should be '12'
                minutes = minutes < 10 ? '0' + minutes : minutes;
                strTime = hours + ':' + minutes + ' ' + ampm;
            }
            return strTime;
        };

        var convertBirthdayTimestamp = function(birthday_timestamp) {
            if (birthday_timestamp === -1)
                return "";
            var months = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'};
            var birthDate = new Date(birthday_timestamp * 1000);
            var monthString = months[birthDate.getUTCMonth() + 1];
            return monthString + '-' + birthDate.getUTCDate() + '-' + birthDate.getUTCFullYear();
        };

        var hashCode = function(s) {
            return s.split("").reduce(function(a, b) {
                a = ((a << 5) - a) + b.charCodeAt(0);
                return a & a;
            }, 0);
        };

        var getCurrentProfilePicture = function(callback) { // for menu use
            $.ajax({
                type: 'POST',
                url: SERVER_URL,
                data: {
                    task: "getCurrentProfilePicture",
                    format: "json",
                    user_id: localStorage['user_id']
                },
                dataType: 'json',
                success: function(data) {
                    if (data.status === "success") {
                        var imageObj = data.response;
                        var image_url = sok.utils.generateImagePathForLevel(imageObj, 3);
                        callback(image_url);
                    } else {
                        callback();
                    }
                }, error: function(xhr, type) {
//                    $(page).text(xhr.responseText);
                    callback();
                }
            });
        };

        return {
            showGeneralDialog: showGeneralDialog,
            showConfirmDialog: showConfirmDialog,
            quickFit: quickFit,
            truncateText: truncateText,
            enableAndroidScrolling: enableAndroidScrolling,
            loadImage: loadImage,
            loadImg: loadImg,
            ageForBirthday: ageForBirthday,
            generateImagePathForLevel: generateImagePathForLevel,
            createUserMessageObject: createUserMessageObject,
            createUserObject: createUserObject,
            generateDateTimeString: generateDateTimeForSecondsSince1970,
            convertUserMessageObjectToUserObject: convertUserMessageObjectToUserObject,
            convertBirthdayTimestamp: convertBirthdayTimestamp,
            hashCode: hashCode,
            getCurrentProfilePicture: getCurrentProfilePicture,
            createTutorial: createTutorial,
            createDetailPanel: createDetailPanel
        };
    }();

    return {
        init: init,
        utils: utils
    };
}();

Zepto(function($) {
    sok.init();
});

window.addEventListener('load', function(e) {

    window.applicationCache.addEventListener('updateready', function(e) {
        if (window.applicationCache.status === window.applicationCache.UPDATEREADY) {
            // Browser downloaded a new app cache.
            // Swap it in and reload the page to get the new hotness.
            window.applicationCache.swapCache();
            sok.utils.showConfirmDialog("Reload Glance",
                    "A new version of Glance is available. Reload it?",
                    function() { // ok
                        console.log('reloading page due to cache update...');
                        window.location.reload();
                    },
                    function() { // cancel

                    }, "Reload", "Cancel");
        } else {
            // Manifest didn't changed. Nothing new to server.
        }
    }, false);

}, false);