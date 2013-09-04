var imageViewer = function() {

    var invalidPageReached = false;

    var os = '';
    
    var needsRetrieveMorePic = false; // a switch. Currently we don't retrieve more images for a profile.
    
    var init = function(page, heightOffset, isVup) {
        $(page).find('.image-viewer-wrapper').css('height', window.innerHeight - heightOffset);
        swipeGesture.initWithHeightOffset(heightOffset);
        swipeGesture.initWithVup(isVup);
        invalidPageReached = false;
        os = localStorage['os'];
        needsRetrieveMorePic = false;
    };

    var destroy = function(page) {
        console.log('destroy called in imageviewer');
        $(page).find('.image-viewer-wrapper').off('swipeLeft');
        $(page).find('.image-viewer-wrapper').off('swipeRight');
        swipeGesture.reset(page);
        for (var i = 0; i < iScrollArray.length; ++i) {
            if (iScrollArray[i]) {
                iScrollArray[i].destroy();
                iScrollArray[i] = null;
            }
        }
        iScrollArray = [];
        if (myScroll) {
            myScroll.destroy();
            myScroll = null;
        }
    };

    var swipeGesture = function() {

        var slider_img;
        var slider_counter = 0;
        var slider_width;
        var slider_sliding = false;
        var sliding_time;
        var autoscroll = false;
        var pause_time;
        var slider_num;
        var heightOffset = 0;

        var isVup = false;

        var last_user_id = "";

        var loading_more_images = false;

        var loading_more_profiles = false;

        var loading_threshold = 0;

        var hang_tight_appended = false;

        var profile_loading_num_limit = 0;

        var usersToBeDismissed = [];

        var swipePassedUsers = [];
        
        var loadUserProfilePictures = function(srcArray, userCardObj, initialCall) {
            for (var i = 0; i < srcArray.length; ++i) {
                (function(i) {
                    var src = srcArray[i];
                    var img = new Image();
                    img.className = 'image-list-image';
                    img.src = src;

                    var imageContainer;

                    var imageContainerWidth = parseInt(localStorage['window_width']) - 64;

                    if (i === 0) {
                        initialCall ? imageContainer = $('<div>').attr('class', 'image-container').css('width', imageContainerWidth).css('height', window.innerHeight - heightOffset - 44 - 13 - (isVup ? 0 : 45)) :
                                imageContainer = $('<div>').attr('class', 'image-container').css('width', imageContainerWidth).css('height', window.innerHeight - heightOffset - 44 - 13 - (isVup ? 0 : 45)).css('margin-top', (isVup ? '-44px' : '-77px'));
                        if (i === srcArray.length - 1) { // means length == 1
                            imageContainer.css('margin-bottom', (isVup ? '57px' : '96px'));
                        }
                    } else if (i !== srcArray.length - 1) {
                        imageContainer = $('<div>').attr('class', 'image-container').css('height', window.innerHeight - heightOffset - 44 - 13 - (isVup ? 0 : 45)).css('width', imageContainerWidth).css('margin-top', '13px');
                    } else {
                        imageContainer = $('<div>').attr('class', 'image-container').css('height', window.innerHeight - heightOffset - 44 - 13 - (isVup ? 0 : 45)).css('width', imageContainerWidth).css('margin-top', '13px').css('margin-bottom', (isVup ? '57px' : '96px'));
                    }

                    userCardObj.append(imageContainer);
                    
                    if (!img.complete) {
                        img.onload = function() {
                            imageContainer.css('height', srcArray.length === 1 ? window.innerHeight - heightOffset - 44 - 13 - (isVup ? 0 : 45) : imageContainerWidth * (this.height / this.width)).css('background-image', 'url(' + src + ')').css('background-size', 'cover').css('background-position', 'center');
                            if (i === srcArray.length - 1) {
                                setTimeout(function() {
                                    if (myScroll) myScroll.refresh();
                                }, 100);
                            }
                        };
                    } else {
                        imageContainer.css('height', srcArray.length === 1 ? window.innerHeight - heightOffset - 44 - 13 - (isVup ? 0 : 45) : imageContainerWidth * (img.height / img.width)).css('background-size', 'cover').css('background-image', 'url(' + src + ')').css('background-position', 'center');
                        if (i === srcArray.length - 1) {
                            setTimeout(function() {
                                if (myScroll) myScroll.refresh();
                            }, 100);
                        }
                    }

                })(i);

            }
        };

        var loadMorePicsAjax = function(cardObj, imageWrapper, imageScroller) {
            if (!imageWrapper.attr('last_image_id')) {
                return;
            }
            loading_more_images = true;
            console.log('loading...');
            
            var loader = $('<div>').attr('class', 'image-container-loader').append($('<img>').attr('src', 'images/loader.gif'));

            var pushData = {
                task: "getData",
                format: "json",
                user_id: localStorage['user_id'],
                requests: JSON.stringify([{"type": "profile_images", "target_id": cardObj.user_id, "limit": "5", "more_images": {"last_id": imageWrapper.attr('last_image_id'), "older": "1"}}])
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
                        console.log(data.response.data[0].images);
                        var morePics = data.response.data[0].images;
                        loader.remove();
                        if (morePics.length) {
                            var morePicsArray = [];
                            var temp_last_image_id = "0";
                            for (var j = 0; j < morePics.length; ++j) {
                                morePicsArray.push(sok.utils.generateImagePathForLevel(morePics[j], 5));
                                temp_last_image_id = morePics[j].id;
                            }
                            imageWrapper.attr('last_image_id', temp_last_image_id);
                            loadUserProfilePictures(morePicsArray, imageScroller, false);
                        } else {
                            if (os === 'ios') {
                                imageWrapper.unbind('scroll');
                            } else {
                                imageWrapper.attr('last_image_id', '');
                            }
                        }
                        loading_more_images = false;
                    } else {
                        // TODO: handle server error
                        loader.remove();
                        console.log(data);
                        loading_more_images = false;
                    }
				//	myScroll.refresh();
                },
                error: function(xhr, type) {
                    // TODO: error handling
                    loader.remove();
                    console.log(xhr.responseText);
                    loading_more_images = false;
                }
            });
            
            imageScroller.append(loader);
        };

        var loadUserCard = function(page, whichSlide, left, cardObj) {
            var imageWrapper = $('<div>').attr('class', 'image-wrapper scrollable ' + whichSlide).css('left', left).attr('last_image_id', cardObj.last_image_id).css('width', parseInt(localStorage['window_width']) - 40).attr('user_id', cardObj.user_id).attr('id', 'u' + cardObj.user_id);
            $(page).find('.image-pointer').append(imageWrapper);

            var imageScroller = $('<div>').attr('class', 'scroller');
            imageWrapper.append(imageScroller);
            if (cardObj.name !== null || cardObj.url !== null || cardObj.age !== null || cardObj.from !== null) { // not of type hang-tight or loading
                var nameLabel = $('<span>').attr('id', 'username').text(cardObj.name);
                var otherInfoLabel = $('<span>').attr('id', 'other-info').html(cardObj.age + ' / ' + cardObj.from + ' / <img class="flag" src="images/flags/'+ cardObj.iso +'.png">');
                imageScroller.append(nameLabel);
                imageScroller.append(otherInfoLabel);
                sok.utils.quickFit([nameLabel, otherInfoLabel], parseInt(localStorage['window_width']) - 64);

                if (os === 'ios') {
                    imageWrapper.bind('scroll', function() {
//                        console.log($(this).scrollTop());
//                        console.log(this.scrollHeight - this.clientHeight);
                        if (loading_more_images) {
                            return false;
                        }
                        if (needsRetrieveMorePic && $(this).scrollTop() >= this.scrollHeight - this.clientHeight - loading_threshold) {
                            loadMorePicsAjax(cardObj, imageWrapper, imageScroller);
                        }
                    });
                }

                loadUserProfilePictures(cardObj.url, imageScroller, true);

                console.log('user id: ' + cardObj.user_id);
            } else { // if it is of type hang-tight or loading or tut

                if (loading_more_profiles) {
                    if (os === 'ios') {
                        imageWrapper.removeClass('scrollable').addClass('profile-loading');
                    } else {
                        imageScroller.removeClass('android-scrollable');
                        imageWrapper.addClass('profile-loading');
                    }
                    var profile_loading_container = $('<div>').attr('class', 'profile-loading-container').css('height', window.innerHeight - heightOffset)
                            .append($('<img>').attr('src', 'images/LoadingBar.gif'));
                    imageScroller.append(profile_loading_container);
                } else {
                    if (cardObj.tutNum) { // tut
                        if (os === 'ios') {
                            imageWrapper.removeClass('scrollable').addClass('tut-page');
                        } else {
                            imageScroller.removeClass('android-scrollable');
                            imageWrapper.addClass('tut-page');
                        }
                        var tut_container = $('<div>').attr('class', 'tut-container').css('height', window.innerHeight - heightOffset);
                        imageScroller.append(tut_container);
                        var tut = $('<div>').attr('class', 'tut').attr('id', 'tut-' + cardObj.tutNum)
                                .append($('<span>').attr('class', 'tut-title').attr('id', 'tut-title-' + cardObj.tutNum).text(cardObj.tutNum === 1 ? 'How it works...' : ''))
                                .append($('<span>').attr('class', 'tut-description').attr('id', 'tut-description-' + cardObj.tutNum)
                                .html(cardObj.tutNum === 1 ? 'Anonymously "like" or<br/>"pass" on someone.' : cardObj.tutNum === 2 ? 'If you like someone,<br/>we show your profile<br/>in their Match Game.' : cardObj.tutNum === 3 ? 'If they like you back,<br/>you\'re matched and<br/>ready to chat!' : ''))
                                .append($('<div>').attr('class', 'tut-swipe').append($('<span>').text('Swipe')).append('<br/>').append($('<img>').attr('src', 'images/tut-arrow.png')));
                        tut_container.append(tut);
                    } else if (cardObj.detailPanel) {
                        if (os === 'ios') {
                            imageWrapper.removeClass('scrollable').addClass('detail-panel-page');
                        } else {
                            imageScroller.removeClass('android-scrollable');
                            imageWrapper.addClass('detail-panel-page');
                        }
                        var detail_panel_container = $('<div>').attr('class', 'detail-panel-container').css('height', window.innerHeight - heightOffset);
                        imageScroller.append(detail_panel_container);
                        var detail_panel = $('<div>').attr('class', 'detail-panel')
                                .append($('<span>').attr('class', 'detail-panel-description').html('<span id="admire-count">' + cardObj.admireCount + '</span><br/>out of the next<br/><span id="admire-range">' + cardObj.admireRange + '</span> people have'));
                        detail_panel_container.append(detail_panel);
                    } else { // hang tight
                        if (os === 'ios') {
                            imageWrapper.removeClass('scrollable').addClass('hang-tight-page');
                        } else {
                            imageScroller.removeClass('android-scrollable');
                            imageWrapper.addClass('hang-tight-page');
                        }
                        var hang_tight_container = $('<div>').attr('class', 'hang-tight-container').css('height', window.innerHeight - heightOffset);
                        imageScroller.append(hang_tight_container);
                        var hang_tight = $('<div>').attr('class', 'hang-tight')
                                .append($('<span>').attr('id', 'hang-tight-title').text('Hang tight'))
                                .append($('<span>').attr('id', 'hang-tight-description').html('while more people join<br/>the community'));
                        hang_tight_container.append(hang_tight);
                    }
                }
            }

            $(page).find('.image-wrapper').css('height', window.innerHeight - heightOffset);
            if (cardObj.name !== null || cardObj.url !== null || cardObj.age !== null || cardObj.from !== null) { // not of type hang-tight or loadin
				/*
                sok.utils.enableAndroidScrolling($(page).attr('data-page'), imageScroller, imageWrapper, null, null, function(newPos) {
                    if (!loading_more_images) {
                        if (needsRetrieveMorePic && newPos < imageWrapper.height() - imageScroller.height() + loading_threshold) {
                            loadMorePicsAjax(cardObj, imageWrapper, imageScroller);
                        }
                    }
                });*/
                sok.utils.enableAndroidScrolling($(page).attr('data-page'), imageScroller, imageWrapper, null, null, function(newPos) {
                    if (!loading_more_images) {
                        if (needsRetrieveMorePic && newPos < imageWrapper.height() - imageScroller.height() + loading_threshold) {
                            loadMorePicsAjax(cardObj, imageWrapper, imageScroller);
                        }
                    }
                });

            }
        };

        var initWithHeightOffset = function(offset) {
            heightOffset = offset;
        };

        var initWithVup = function(vup) {
            isVup = vup;
        };

        var appendProfilesToArray = function(users) {
            for (var i = 0; i < users.length; ++i) {
                var profileObj = sok.utils.createUserObject(users[i]);
                last_user_id = users[i].user_id;
                slider_img.push(profileObj);
            }
            slider_num = slider_img.length;
            matchGame.setMatchGameUsers(slider_img);
        };

        var popProfileArray = function() {
            slider_img.pop();
            slider_num = slider_img.length;
            matchGame.setMatchGameUsers(slider_img);
        };

        var appendLoadingOrHangtightUserCardToArray = function() {
            var profileObj = sok.utils.createUserObject(null);
            slider_img.push(profileObj);
            slider_num = slider_img.length;
            matchGame.setMatchGameUsers(slider_img);
        };

        var initialize = function(slider_arr, width, period, pause, page, swipable, last_id) { // slider img src array, window.innerWidth, sliding time, non-negative value, page, swipable boolean
            slider_counter = 0;
            slider_sliding = false;
            slider_img = slider_arr;
            slider_num = slider_img.length;
            slider_width = width;
            sliding_time = period;
            pause_time = pause;
            last_user_id = last_id;

            loading_more_images = false;

            loading_more_profiles = false;

            loading_threshold = 200;

            profile_loading_num_limit = 14;

            hang_tight_appended = false;

            usersToBeDismissed = [];

            swipePassedUsers = [];

            console.log('last_user_id: ' + last_user_id);
//            var leftSlide = slider_img[(slider_counter - 1) < 0 ? slider_num - 1 : slider_counter - 1];

            if (swipable) {

                if (slider_num < profile_loading_num_limit) { // append hang tight if necessary
                    appendLoadingOrHangtightUserCardToArray();
                    hang_tight_appended = true;
                }

                if (slider_counter + 1 <= slider_num - 1) { // append next slide if we have
                    var rightSlide = slider_img[slider_counter + 1];

                    loadUserCard(page, 'next-slide', parseInt(localStorage['window_width']) - 17, rightSlide);
                }
                $(page).find('.image-viewer-wrapper').swipeLeft(function() {
                    if (slider_counter === slider_num - 1) {
                        return false;
                    }
                    next_slide(page);
                }).swipeRight(function() {
                    if (slider_counter === 0) {
                        return false;
                    }
                    prev_slide(page);
                });

                $(page).find('span#left').on('tap', function() {
                    dismissUser(page);
                }).bind('touchstart', function() {
                    $(this).addClass('button-pressed');
                }).bind('touchend', function() {
                    $(this).removeClass('button-pressed');
                }).bind('touchmove', function() {
                    $(this).removeClass('button-pressed');
                    return false;
                });

                $(page).find('span#right').on('tap', function() {
                    FlurryAgent.logEvent("MatchGame: Secretely Admire");
                    admireUser(page);
                }).bind('touchstart', function() {
                    $(this).addClass('button-pressed');
                }).bind('touchend', function() {
                    $(this).removeClass('button-pressed');
                }).bind('touchmove', function() {
                    $(this).removeClass('button-pressed');
                    return false;
                });

            } else {
                $(page).find('.app-content').css('background-image', 'url("images/bg.jpg")').css('background-size', 'cover').css('background-position', 'center');
            }
            var curSlide = slider_img[slider_counter]; // curSlide can be a hang-tight.

            loadUserCard(page, 'current-slide', '20px', curSlide);


        };

        var reset = function(page) {
            slider_img = [];
            slider_counter = 0;
            slider_width = 0;
            slider_sliding = false;
            sliding_time = 0;
            autoscroll = false;
            pause_time = 0;
            slider_num = 0;
            $(page).find('span#left').off('tap');
            $(page).find('span#right').off('tap');
            $(page).find('.prev-slide').remove();
            $(page).find('.next-slide').remove();
            $(page).find('.current-slide').remove();
        };

        var admireUser = function(page) {
            if (slider_sliding)
                return false;
            var pushData = {
                task: "admireUser",
                format: "json",
                user_id: localStorage['user_id'],
                target_user_id: $(page).find('.current-slide').attr('user_id')
            };
            var app_content_mask = $('<div>').attr('class', 'app-content-mask').append($('<img>').attr('src', 'images/LoadingBar.gif'));
            $(page).find('.app-content').prepend(app_content_mask);
            setTimeout(function() { // async
                $('.app-content-mask').addClass('active');
            });
            $.ajax({
                type: 'POST',
                url: SERVER_URL,
                // data to be added to query string:
                data: pushData,
                // type of data we are expecting in return:
                dataType: 'json',
                success: function(data) {
//                    console.log(data);
                    if (data.status === "success" || data.status === "banned") {
                        slider_img[slider_counter].dismissedOrAdmired = true;
                        next_slide(page);
                        app_content_mask.removeClass('active');
                        setTimeout(function() { // async
                            app_content_mask.remove();
                        });
                    } else {
                        // TODO: handle server error
                        console.log(data);
                    }
                },
                error: function(xhr, type) {
                    // TODO: error handling
//          $(page).text(xhr.responseText);
                }
            });
        };

        var dissmissUsersAjax = function(arr, success) {
            var pushData = {
                task: "dismissUsers",
                format: "json",
                user_id: localStorage['user_id'],
                dismissed_users: JSON.stringify(arr),
                context: "match"
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

                        usersToBeDismissed = [];
                    } else {
                        // TODO: handle server error
                        setTimeout(function() {
                            dissmissUsersAjax(arr);
                        }, 3000);
                        console.log(data);
                    }
                    if (success) success();
                },
                error: function(xhr, type) {
                    // TODO: error handling
                    console.log(xhr.responseText);
                }
            });
        };

        var dismissUser = function(page) {
            if (slider_sliding)
                return false;
            slider_img[slider_counter].dismissedOrAdmired = true;
            next_slide(page);
            usersToBeDismissed.push($(page).find('.current-slide').attr('user_id'));
            dissmissUsersAjax(usersToBeDismissed);
        };

        var next_slide = function(page) {
            //console.log(slider_img);
            if (slider_sliding)
                return;
            slider_sliding = true;
            slider_counter++;

            if (slider_counter === 3 && localStorage['old_user'] !== "true") { // special case: when slider counter is 3, tutorial has already been passed.
                localStorage['old_user'] = true;
            }

            var swipePassedUserId = $(page).find('.current-slide').attr('user_id');
            if (swipePassedUserId) {
                swipePassedUsers.push(swipePassedUserId);
            }
//            if (slider_counter > slider_num - 1)
//                slider_counter = 0;profile_loading_num_limit 
            if ((slider_counter + 1 - profile_loading_num_limit / 2) % profile_loading_num_limit === 0 && !hang_tight_appended && !loading_more_profiles) { // not all profiles are retrieved.
                loading_more_profiles = true;
                console.log('loading more profiles...');
                appendLoadingOrHangtightUserCardToArray();
                // after ajax succeeded, pop the slider_img array and reset the slider_num, and then append all retrieved profiles to slider_img and then reset the slider_num. Don't for get to turn off profile_loading flag. Then, if loading user card is now visible, we need to lookup for this card and then remove it and then append first one or two retrieved user profiles, depending on where the loading card is (current_slide or next_slide), and also note, only replace loading user card when slider_sliding is false.!!!
                var pushData = {
                    task: "getData",
                    format: "json",
                    user_id: localStorage['user_id'],
                    requests: JSON.stringify([{"type": "users_match_game", "multiple_images": {"limit": "5"}, "more_users": {"last_id": last_user_id, "older": "1"}}])
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
                            var retrieved_users = data.response.data[0].users;
                            popProfileArray();
                            appendProfilesToArray(retrieved_users);
                            loading_more_profiles = false; // must turn this off as early as now! Otherwise hang-tight will not be appended.
                            if (retrieved_users.length < profile_loading_num_limit) { // append hang tight if necessary
                                appendLoadingOrHangtightUserCardToArray();
                                hang_tight_appended = true;
                            }
                            if ($(page).find('.profile-loading').length) {
                                if ($(page).find('.profile-loading').attr('class').indexOf('current-slide') !== -1) { // profile loading card is current slide

                                    if (slider_num - slider_counter >= 2) { // can append two cards
                                        var curSlide = slider_img[slider_counter];
                                        var nextSlide = slider_img[slider_counter + 1];

                                        loadUserCard(page, 'current-slide', '20px', curSlide);
                                        loadUserCard(page, 'next-slide', parseInt(localStorage['window_width']) - 17, nextSlide);
                                    } else { // can only append one card (i.e., hang-tight card)
                                        loadUserCard(page, 'current-slide', '20px', curSlide);
                                    }
                                } else { // profile loading card is next slide
                                    var nextSlide = slider_img[slider_counter + 1];
                                    loadUserCard(page, 'next-slide', parseInt(localStorage['window_width']) - 17, nextSlide);
                                }
                                $(page).find('.profile-loading').remove();
                                normalPageShowBottomBar(page);
                            }

                        } else {
                            // TODO: handle server error
                            console.log(data);
//                            $(page).find('.profile-loading').text(data);
                        }
                    },
                    error: function(xhr, type) {
                        // TODO: error handling
//                        $(page).find('.profile-loading').text(xhr.responseText + ' ' +type);
                        console.log(xhr.responseText);
                    }
                });
            }


            $(page).find('.image-pointer').css('-webkit-transform', 'translateX(' + -1 * (parseInt(localStorage['window_width']) - 20 - 17) + 'px);');
            var currentSlide = $(page).find('.current-slide');
            var nextSlide = $(page).find('.next-slide');
            if (slider_counter + 1 <= slider_num - 1) {
                var rightSlide = slider_img[slider_counter + 1];
                loadUserCard(page, 'next-slide', parseInt(localStorage['window_width']) * 2 - 17 * 2 - 20, rightSlide);
            }
            if (nextSlide.attr('class').indexOf('hang-tight-page') !== -1 || nextSlide.attr('class').indexOf('profile-loading') !== -1 || slider_img[slider_counter].dismissedOrAdmired || slider_img[slider_counter].tutNum || slider_img[slider_counter].detailPanel) { // if next slide has been admired or dismissed, or is a tut
                invalidPageHideBottomBar(page);
            } else {
                normalPageShowBottomBar(page);
            }
            setTimeout(function() {
                $(page).find('.image-pointer').addClass('notransition').css('-webkit-transform', '');
                ; // reset the position of pointer
                setTimeout(function() {
                    $(page).find('.image-pointer').removeClass('notransition');
                }, 10);

                currentSlide.css('left', 0 - (parseInt(localStorage['window_width']) - 40) + 17);
                nextSlide.css('left', 20);
                $(page).find('.prev-slide').remove();
                currentSlide.removeClass('current-slide');
                currentSlide.addClass('prev-slide');
                nextSlide.removeClass('next-slide');
                nextSlide.addClass('current-slide');
                $(page).find('.next-slide').css('left', parseInt(localStorage['window_width']) - 17);

                slider_sliding = false;
            }, sliding_time + 20);

        };

        var normalPageShowBottomBar = function(page) {
            $(page).find('.app-bottombar').addClass('show');
            invalidPageReached = false;
        };

        var invalidPageHideBottomBar = function(page) {
            $(page).find('.app-bottombar').removeClass('show');
            invalidPageReached = true;
        };

        var maybeShowBottomBar = function(page) {
            if (!invalidPageReached) {
                $(page).find('.app-bottombar').addClass('show');
            }
        }

        var prev_slide = function(page) {
            if (slider_sliding)
                return;

            slider_sliding = true;
            slider_counter--;
//            if (slider_counter < 0)
//                slider_counter = slider_num - 1;
            swipePassedUsers.pop();
            $(page).find('.image-pointer').css('-webkit-transform', 'translateX(' + (parseInt(localStorage['window_width']) - 20 - 17) + 'px);');

            var currentSlide = $(page).find('.current-slide');
            var prevSlide = $(page).find('.prev-slide');
            if (slider_counter - 1 >= 0) {
                var leftSlide = slider_img[slider_counter - 1];

                loadUserCard(page, 'prev-slide', 0 - (parseInt(localStorage['window_width']) - 40) + 17 - 3 - (parseInt(localStorage['window_width']) - 40), leftSlide);
            }
            if (slider_img[slider_counter].dismissedOrAdmired || slider_img[slider_counter].tutNum || slider_img[slider_counter].detailPanel) { // if prev slide has been admired or dismissed, or is tut or is detailpanel
                invalidPageHideBottomBar(page);
            } else {
                normalPageShowBottomBar(page);
            }
            setTimeout(function() {
                $(page).find('.image-pointer').addClass('notransition').css('-webkit-transform', ''); // reset the position of pointer
                setTimeout(function() {
                    $(page).find('.image-pointer').removeClass('notransition');
                }, 10);

                currentSlide.css('left', parseInt(localStorage['window_width']) - 17);
                prevSlide.css('left', 20);
                $(page).find('.next-slide').remove();
                currentSlide.removeClass('current-slide');
                currentSlide.addClass('next-slide');
                prevSlide.removeClass('prev-slide');
                prevSlide.addClass('current-slide');
                $(page).find('.prev-slide').css('left', 0 - (parseInt(localStorage['window_width']) - 40) + 17);

                slider_sliding = false;
            }, sliding_time + 20);
        };

        var removeSwipePassedUsers = function(callback) {
            if (swipePassedUsers.length) {
                dissmissUsersAjax(swipePassedUsers, callback);
            } else {
                if (callback) callback();
            }
        };

//        var autoslide = function() {
//            setInterval(function() {
//                if (autoscroll) {
//                    next_slide();
//                } else {
//                    return;
//                }
//            }, pause_time);
//        };

        return {
            init: initialize,
            reset: reset,
            initWithHeightOffset: initWithHeightOffset,
            initWithVup: initWithVup,
            prevSlide: prev_slide,
            nextSlide: next_slide,
            normalPageShowBottomBar: normalPageShowBottomBar,
            invalidPageHideBottomBar: invalidPageHideBottomBar,
            maybeShowBottomBar: maybeShowBottomBar,
            removeSwipePassedUsers: removeSwipePassedUsers

        };

    }();

    return {
        init: init,
        destroy: destroy,
        swipeGesture: swipeGesture
    };
}();