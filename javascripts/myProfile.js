/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */

var myProfile = function() {
    var profile_image_count = 0;

    var nameOptionsShown = false;
    var ageOptionsShown = false;
    var genderOptionsShown = false;
    var locationOptionsShown = false;

    // TODO: use localstorage data // done
    var old_prefername;
    var old_age;
    var old_gender;
    var old_user_city;
    var old_user_country;
    var old_user_lat;
    var old_user_lng;
    var old_user_country_iso;

    var new_prefername;
    var new_age;
    var new_gender;
    var new_user_city;
    var new_user_country;
    var new_user_lat;
    var new_user_lng;
    var new_user_country_iso;
    // END TODO


    var loading_more_images = false;

    var last_image_id = "0";

    var loading_threshold = 0;

    var loading_limit = 0;

    var location_options_count = 0;

    var os = '';

    var init = function(page) {
        FlurryAgent.logEvent("MyProfile: Entry");
        
        os = localStorage['os'];
        location_options_count = 0;
        loading_more_images = false;
        loading_threshold = 200;
        loading_limit = 5;

        $(page).find('.myprofile-container').css('height', window.innerHeight - 44);

        old_prefername = localStorage["prefername"];
        old_age = parseInt(localStorage["age"]);
        old_gender = localStorage["gender"];
        old_user_city = localStorage["user_city"];
        old_user_country = localStorage["user_country"];
        old_user_lat = localStorage["user_lat"];
        old_user_lng = localStorage["user_lng"];
        old_user_country_iso = localStorage["user_country_iso"];

        new_prefername = localStorage["prefername"];
        new_age = parseInt(localStorage["age"]);
        new_gender = localStorage["gender"];
        new_user_city = localStorage["user_city"];
        new_user_country = localStorage["user_country"];
        new_user_lat = localStorage["user_lat"];
        new_user_lng = localStorage["user_lng"];
        new_user_country_iso = localStorage["user_country_iso"];

        nameOptionsShown = false;
        ageOptionsShown = false;
        genderOptionsShown = false;
        locationOptionsShown = false;
        initMyProfileData(page);
        initInlineChoicePanel(page);

        disableSelection(page, 'age');
        disableSelection(page, 'gender');

        initProfilePictures(page);
        if (os === 'ios') {
            initProfilePicturesLoadingListener(page);
        }
        sok.utils.enableAndroidScrolling($(page).attr('data-page'), $(page).find('.myprofile-scroller'), $(page).find('.myprofile-container'), null, null, function(newPos) {
            if (!loading_more_images) {
                if (newPos < $(page).find('.myprofile-container').height() - $(page).find('.myprofile-scroller').height() + loading_threshold) {
                    loadingMorePicsAjax(page);
                }
            }  
        });

        $(page).find('.add-new-photo').on('tap', function() {
            addNewPhoto(page);
        }).bind('touchstart', function() {
            $(this).addClass('button-pressed');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed');
            return false;
        });

        function handleBackButton() {
            // called when back button is pressed
            FlurryAgent.logEvent("MyProfile: Back Button Tap");

            $(page).find('input').blur();
            var storeToServer = maybeStoreDataToServer();
            menu.reloadDataPerLocalStorage();
            internalDestroy(page);
            App.back(function() {
                if (storeToServer && $(App.getPage()).attr('data-page') === 'matchGame') {
                    matchGame.reload('.app-page');
                }
                notification.updater.regenerate($(App.getPage()));
                menu.prepare($(App.getPage()));
                imageViewer.swipeGesture.maybeShowBottomBar($(App.getPage()));
                if (cards.browser && cards.browser.unbindBack) {
                    cards.browser.unbindBack(handleBackButton);
                }
            });
//            return false; // optionally cancel default behavior
        }
        if (cards.browser && cards.browser.back) {
            cards.browser.back(handleBackButton);
        }

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
    };

    var RegisterSearchAutocompleteListener = function(page, shown) {
        var timer;
        var request;
        function genEntry(item) {
            var entry = $('<div>').attr('class', 'basic-info-buttons basic-info-options').data('city', item.city_name).data('country', item.country_name).data('region', item.region_name).data('iso_country_code', item.geolocation_info.iso_country).data('lat', item.geolocation_info.lat).data('lng', item.geolocation_info.lng)
                    .append($('<span>').attr('class', 'option-text').text(item.city_name + ' - ' + item.region_name))
                    .append($('<img>').attr('class', 'option-arrow').attr('src', 'images/icon-check.png'));
            entry.on('tap', function() {
                optionSelected(page, $(this));
            });
            return entry;
        }

        function genList(list) {
            $(page).find('#location-options .basic-info-buttons').remove();
            for (var i = 0; i < list.length; ++i) {
                var entry = genEntry(list[i]);
                $('.basic-info-options-container#location-options').append(entry);
            }
        }

        if (shown) {
            $(page).find('#location-search-input').focus();
            $(page).find('#location-search-input').on('input', function() {
                clearTimeout(timer);
                if (request)
                    request.abort();
                var pat = $(this).val();
                if (pat !== "") {
                    timer = setTimeout(function() {
                        request = $.ajax({
                            type: 'POST',
                            url: SERVER_URL,
                            data: {
                                task: 'searchForCityByName',
                                partial_name: pat,
                                limit: location_options_count,
                                iso_country: old_user_country_iso,
                                format: 'json'
                            },
                            // type of data we are expecting in return:
                            dataType: 'json',
                            success: function(data) {
                                if (data.status === "success") {
                                    console.log(data);
                                    var cityList = data.response.cities;
                                    genList(cityList);
                                } else {
                                    // TODO: handle server error
                                }
                            },
                            error: function(xhr, type) {

                            }
                        });
                    }, 300);
                } else {
                    $(page).find('#location-options .basic-info-buttons').remove();
                }
            });
        } else {
            $(page).find('#location-search-input').blur();
            clearTimeout(timer);
            $(page).find('#location-search-input').off('input');
        }
    };

    var maybeStoreDataToServer = function() {
        var pushData = {
            task: "setProfile",
            format: "json",
            kik_id: localStorage["username"],
            user_id: localStorage["user_id"]
        };
        var pushDataObjectPropertyCount = 0;
        if (new_prefername !== old_prefername) {
            pushData.user_display_name = new_prefername;
            localStorage["prefername"] = new_prefername;
            pushDataObjectPropertyCount++;
        }
        if (new_age !== old_age) {
//            var d = new Date();
//            d.setYear(d.getYear() - new_age);
            pushData.birthday_timestamp = new_age;
            localStorage["age"] = new_age;
            pushDataObjectPropertyCount++;
        }
        if (new_gender !== old_gender) {
            pushData.user_gender = new_gender;
            localStorage["gender"] = new_gender;
            pushDataObjectPropertyCount++;
        }
        if (new_user_city !== old_user_city) {
            pushData.user_city = new_user_city;
            localStorage["user_city"] = new_user_city;
            pushDataObjectPropertyCount++;
        }
        if (new_user_country !== old_user_country) {
            pushData.user_country = new_user_country;
            localStorage["user_country"] = new_user_country;
            pushDataObjectPropertyCount++;
        }
        if (new_user_lat !== old_user_lat) {
            pushData.latitude = new_user_lat;
            localStorage["user_lat"] = new_user_lat;
            pushDataObjectPropertyCount++;
        }
        if (new_user_lng !== old_user_lng) {
            pushData.longitude = new_user_lng;
            localStorage["user_lng"] = new_user_lng;
            pushDataObjectPropertyCount++;
        }
        if (new_user_country_iso !== old_user_country_iso) {
            pushData.country_code = new_user_country_iso;
            localStorage["user_country_iso"] = new_user_country_iso;
            pushDataObjectPropertyCount++;
        }
        if (pushDataObjectPropertyCount) { // if any changes, push to server.
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

                    } else {
                        // TODO: handle server error
                    }
                },
                error: function(xhr, type) {
//                    $(page).text(type + xhr.responseText);
                }
            });
        }
        return pushDataObjectPropertyCount;
    };

    var disableSelection = function(page, type) {
        $(page).find('#' + type + '-arrow').remove();
        $(page).find('.select#' + type).off('tap');
        $(page).find('#' + type + '-value').css('right', '12px');
    };

// TODO: also need to retrieve user profile pics from server and then user loadUserPhotos(page, srcArray, 44); to load them properly
    var initMyProfileData = function(page) {
        // TODO: use localStorage data // done

        var fullname = localStorage["fullname"];
        var firstname = localStorage["firstname"];
        var lastname = localStorage["lastname"];
        $(page).find('#name-value').text(old_prefername);
        $(page).find('#name-input').val(old_prefername);
//        $(page).find('#name-text-1').text(firstname);
//        var combinedname = firstname + ' ' + lastname.substr(0, 1) + '.';
//        $(page).find('#name-text-2').text(combinedname);
//        $(page).find('#name-text-3').text(fullname);
//        if (old_prefername === firstname) {
//            $(page).find('#name-text-1').parent().addClass('selected');
//        } else if (old_prefername === combinedname) {
//            $(page).find('#name-text-2').parent().addClass('selected');
//        } else {
//            $(page).find('#name-text-3').parent().addClass('selected');
//        }

        $(page).find('#age-value').text(sok.utils.ageForBirthday(old_age));

        var genderMale = "Male";
        var genderFemale = "Female";
        $(page).find('#gender-value').text(old_gender);
        $(page).find('#gender-text-1').text(genderMale);
        $(page).find('#gender-text-2').text(genderFemale);
        if (old_gender === "Male") {
            $(page).find('#gender-text-1').parent().addClass('selected');
        } else {
            $(page).find('#gender-text-2').parent().addClass('selected');
        }


        $(page).find('#location-value').text(old_user_city);
    };

    var foldupAllSelect = function(page, indicator) {
        RegisterSearchAutocompleteListener(page, false);
        $(page).find('.select').removeClass('selected');
        $(page).find('.basic-info-options-container').css('height', '');
        if (indicator !== nameOptionsShown)
            nameOptionsShown = false;
        if (ageOptionsShown)
            SpinningWheel.close();
        if (indicator !== ageOptionsShown)
            ageOptionsShown = false;
        if (indicator !== genderOptionsShown)
            genderOptionsShown = false;
        if (indicator !== locationOptionsShown)
            locationOptionsShown = false;
        $(page).find('input').blur();
    };

    var initInlineChoicePanel = function(page) {

        var listenToNameChange = function(shown) {
            if (shown) {
                $(page).find('#name-input').focus();
                $(page).find('#name-input').on('input', function() {
                    var partialName = $(this).val();
                    $(page).find('#name-value').text(partialName);
                    if (partialName !== "") {
                        new_prefername = partialName;
                    } else {
                        new_prefername = old_prefername;
                    }
                });
            } else {
                $(page).find('#name-input').blur();
                $(page).find('#name-input').off('input');
            }

        };

        $(page).find('.basic-info-buttons#name').on('tap', function() {
            foldupAllSelect(page, nameOptionsShown);
            if (!nameOptionsShown) {
                $(this).addClass('selected');
                var numNameOptions = 1;
                $(page).find('.basic-info-options-container#name-options').css('height', numNameOptions * 46 + 'px');
                listenToNameChange(true);
                nameOptionsShown = true;
            } else {
                $(this).removeClass('selected');
                $(page).find('.basic-info-options-container#name-options').css('height', '');
                listenToNameChange(false);
                nameOptionsShown = false;
            }
            
            setTimeout(function() {
                if (myProfileScroll) myProfileScroll.refresh();
            }, 300);
            
        });


        $(page).find('.basic-info-buttons#age').on('tap', function() {
            foldupAllSelect(page, ageOptionsShown);
            if (!ageOptionsShown) {
                $(this).addClass('selected');
                var numNameOptions = 1;
                // determine how many options by whether we have last name or not. If we have last name
                //$(page).find('.basic-info-options-container#age-options').css('height', numNameOptions * 46 +'px');
                showAgeOptions(page, $(this));

                ageOptionsShown = true;
            }

            else {
                $(this).removeClass('selected');
                SpinningWheel.close();
                ageOptionsShown = false;
            }
            
            setTimeout(function() {
                if (myProfileScroll) myProfileScroll.refresh();
            }, 300);
            
        });
        
        $(page).find('.basic-info-buttons#gender').on('tap', function() {
            foldupAllSelect(page, genderOptionsShown);
            if (!genderOptionsShown) {
                $(this).addClass('selected');
                var numNameOptions = 2;
                // determine how many options by whether we have last name or not. If we have last name
                $(page).find('.basic-info-options-container#gender-options').css('height', numNameOptions * 46 + 'px');
                genderOptionsShown = true;
            } else {
                $(this).removeClass('selected');
                $(page).find('.basic-info-options-container#gender-options').css('height', '');
                genderOptionsShown = false;
            }
            setTimeout(function() {
                if (myProfileScroll) myProfileScroll.refresh();
            }, 300);

        });
        $(page).find('.basic-info-buttons#location').on('tap', function() {
            foldupAllSelect(page, locationOptionsShown);
            if (!locationOptionsShown) {
                $(this).addClass('selected');
//                var numNameOptions = 1;
                var appContentHeight = window.innerHeight - 44;
                var locationSelectorTop = $(this).offset().top + 184 - $(page).find('.basic-info-wrapper').height();
                $(page).find('.myprofile-container')[0].scrollTop = $(page).find('.myprofile-container')[0].scrollTop + locationSelectorTop - 44;
                var locationOptionsHeight = appContentHeight - 60;
                // determine how many options by whether we have last name or not. If we have last name
                $(page).find('.basic-info-options-container#location-options').css('height', locationOptionsHeight + 'px');
                setTimeout(function() {
                    location_options_count = Math.floor(($('.basic-info-options-container#location-options').height() - $('.location-search-input-container').height() - 9) / $('.basic-info-buttons.basic-info-options').height());
//                    console.log(location_options_count);
                }, 220);

                locationOptionsShown = true;
                RegisterSearchAutocompleteListener(page, true);
            } else {
                $(this).removeClass('selected');
                $(page).find('.basic-info-options-container#location-options').css('height', '');
                locationOptionsShown = false;
                RegisterSearchAutocompleteListener(page, false);
            }
            
            setTimeout(function() {
                if (myProfileScroll) myProfileScroll.refresh();
            }, 300);

        });

        $(page).find('.basic-info-options').on('tap', function() {
            optionSelected(page, $(this));
            
            setTimeout(function() {
                if (myProfileScroll) myProfileScroll.refresh();
            }, 300);
        });

    };

    var optionSelected = function(page, option) {
        foldupAllSelect(page);
        $(option).parent().children().removeClass('selected');
        $(option).addClass('selected');
        if ($(option).parent().attr('id') === "name-options") { // deprecated
            new_prefername = $(option).find('.option-text').text();
            $(page).find('#name-value').text(new_prefername);
        } else if ($(option).parent().attr('id') === "gender-options") {
            new_gender = $(option).find('.option-text').text();
            $(page).find('#gender-value').text(new_gender);
        } else if ($(option).parent().attr('id') === "location-options") {
            new_user_city = $(option).data('city');
            new_user_country = $(option).data('country');
            new_user_country_iso = $(option).data('iso_country_code');
            new_user_lat = $(option).data('lat');
            new_user_lng = $(option).data('lng');
//            console.log(new_user_city);
            $(page).find('#location-value').text(new_user_city);
            setTimeout(function() {
                $(page).find('#location-search-input').val("");
                $(page).find('#location-options .basic-info-buttons').remove();
            }, 200);
//            // TODO: Remove the following and set new_user_lat, new_user_lng, new_user_country_iso after we choose one of the options.
//            $.getJSON('http://maps.google.com/maps/api/geocode/json?address=' + new_user_city + ',' + new_user_country + '&sensor=false', function(data) {
//                // TODO: enable GO button and remove loading indicator.
//                new_user_lat = 0;
//                new_user_lng = 0;
//                new_user_country_iso = "UNKNOWN";
//                for (var k = 0; k < data.results.length; k++) {
//                    for (var i = 0; i < data.results[k].address_components.length; i++) {
//                        for (var j = 0; j < data.results[k].address_components[i].types.length; j++) {
//                            if (data.results[k].address_components[i].types[j] === 'country') {
//                                new_user_country_iso = data.results[k].address_components[i].short_name;
//                            }
//                        }
//                    }
//                    if (data.results[k].geometry) {
//                        new_user_lat = data.results[k].geometry.location.lat;
//                        new_user_lng = data.results[k].geometry.location.lng;
//                    }
//                }
//            });
            // end TODO
        } else {
            // nothing
        }
    };

    var initProfilePictures = function(page) {
        var loader = $('<div>').attr('class', 'photo-container-loader').append($('<img>').attr('src', 'images/loader.gif'));
        $(page).find('.photos-container').prepend(loader);
        var pushData = {
            task: "getData",
            format: "json",
            user_id: localStorage['user_id'],
            requests: JSON.stringify([{"type": "profile_images", "target_id": localStorage['user_id'], "limit": loading_limit}])
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
                    loader.remove();
                    var imagesArray = data.response.data[0];
                    imagesArray = imagesArray.images;
                    
                    profile_image_count = imagesArray.length;

                    for (var i = imagesArray.length - 1; i >= 0; i--) {
                        (function(i) {

                            var p = sok.utils.generateImagePathForLevel(imagesArray[i], 5);
                            var id = imagesArray[i].id;
                            if (i === imagesArray.length - 1) {
                                last_image_id = id;
                            }
                            loadUserPhoto(page, p, id, 44);
                        })(i);
                    }
                    if (imagesArray.length < loading_limit) {
                        if (os === 'ios') {
                            $(page).find('.myprofile-container').unbind('scroll');
                        } else {
                            last_image_id = "";
                        }
                    }
                } else {
                    // TODO: handle server error
                    loader.remove();
                }
            },
            error: function(xhr, type) {
                // TODO: handle server error
                loader.remove();
//                $(page).text(xhr.responseText);
            }
        });
    };

    var loadingMorePicsAjax = function(page) {
        if (!last_image_id) {
            return;
        }
        loading_more_images = true;
        console.log('myprofile pictures loading...');
        var loader = $('<div>').attr('class', 'photo-container-loader').append($('<img>').attr('src', 'images/loader.gif'));
        $(page).find('.myprofile-container').append(loader);
        var pushData = {
            task: "getData",
            format: "json",
            user_id: localStorage['user_id'],
            requests: JSON.stringify([{"type": "profile_images", "target_id": localStorage['user_id'], "limit": loading_limit, "more_images": {"last_id": last_image_id, "older": "1"}}])
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
                    loader.remove();
                    var imagesArray = data.response.data[0];
                    imagesArray = imagesArray.images;
                    if (imagesArray.length < loading_limit) {
                        if (os === 'ios') {
                            $(page).find('.myprofile-container').unbind('scroll');
                        } else {
                            last_image_id = "";
                        }
                    }
                    profile_image_count += imagesArray.length;

                    for (var i = 0; i < imagesArray.length; i++) {
                        (function(i) {
                            var p = sok.utils.generateImagePathForLevel(imagesArray[i], 5);
                            var id = imagesArray[i].id;
                            loadUserPhoto(page, p, id, 44, true);
                        })(i);
                    }
                    loading_more_images = false;
                } else {
                    // TODO: handle server error
                    loader.remove();
                    loading_more_images = false;
                }
            },
            error: function(xhr, type) {
                // TODO: handle server error
                loader.remove();
                loading_more_images = false;
//                        $(page).text(xhr.responseText);
            }
        });
    };

    var initProfilePicturesLoadingListener = function(page) {
        $(page).find('.myprofile-container').bind('scroll', function() {
            if (loading_more_images)
                return false;
            if ($(this).scrollTop() >= this.scrollHeight - this.clientHeight - loading_threshold) {
                loadingMorePicsAjax(page);
            }
        });

    };

    var showAgeOptions = function(page, myself) {
        var numbers = {0: 15, 1: 16, 2: 17, 3: 18, 4: 19, 5: 20, 6: 21, 7: 22, 8: 23, 9: 24, 10: 25, 11: 26, 12: 27, 13: 28, 14: 29, 15: 30, 16: 31, 17: 32, 18: 33, 19: 34, 20: 35, 21: 36, 22: 37, 23: 38, 24: 39, 25: 40, 26: 41, 27: 42, 28: 43, 29: 44, 30: 45, 31: 46, 32: 47, 33: 48, 34: 49, 35: 50, 36: 51, 37: 52, 38: 53, 39: 54, 40: 55, 41: 56, 42: 57, 43: 58, 44: 59, 45: 60, 46: 61, 47: 62, 48: 63, 49: 64, 50: 65, 51: 66, 52: 67, 53: 68, 54: 69, 55: 70, 56: 71, 57: 72, 58: 73, 59: 74, 60: 75, 61: 76, 62: 77, 63: 78, 64: 79, 65: 80, 66: 81, 67: 82, 68: 83, 69: 84, 70: 85, 71: 86, 72: 87, 73: 88, 74: 89, 75: 90, 76: 91, 77: 92, 78: 93, 79: 94, 80: 95, 81: 96, 82: 97, 83: 98, 84: 99};
        var now = new Date();
        now = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
        var days = {};
        var years = {};
        var months = {1: 'Jan', 2: 'Feb', 3: 'Mar', 4: 'Apr', 5: 'May', 6: 'Jun', 7: 'Jul', 8: 'Aug', 9: 'Sep', 10: 'Oct', 11: 'Nov', 12: 'Dec'};

        for (var i = 1; i <= 31; ++i) {
            days[i] = i;
        }

        for (var i = now.getFullYear() - 99; i <= now.getFullYear() - 16; ++i) {
            years[i] = i;
        }

        var birthDate = new Date(new_age * 1000);

        SpinningWheel.addSlot(months, 'center', birthDate.getUTCMonth() + 1);
        SpinningWheel.addSlot(days, 'center', birthDate.getUTCDate());
        SpinningWheel.addSlot(years, 'center', birthDate.getUTCFullYear());

        SpinningWheel.setCancelAction(cancelAction);
        SpinningWheel.setDoneAction(doneAction);

        function cancelAction() {
            $(page).find('.select.selected').removeClass('selected');
            setTimeout(function() {
                ageOptionsShown = false;
            }, 600);
//            $('#sw-frame').off('tap')
        }

        function doneAction() {
            $(page).find('.select.selected').removeClass('selected');

            var results = SpinningWheel.getSelectedValues();
            var month = results.values[0];
            var i;
            for (i in months) {
                if (months[i] === month) {
                    break;
                }
            }
            $(myself).find('.button-value').text(results.values[0] + '-' + results.values[1] + '-' + results.values[2]);
            new_age = Math.floor(Date.UTC(parseInt(results.values[2]), parseInt(i) - 1, parseInt(results.values[1])) / 1000);


            setTimeout(function() {
                ageOptionsShown = false;
            }, 600);

        }

        SpinningWheel.open();
        $('#sw-wrapper').css('z-index', 2001);
//        if (old_age) {
//            $('.sw-center').find('ul').css('-webkit-transform', 'translate3d(0, ' + -44 * ((new_age) ? (new_age - 15) : (old_age - 15)) + 'px, 0)');
//        }

    };

    var addNewPhoto = function(page) {
//        var fakePhotos = ['images/sample.jpeg', 'images/sample2.jpg'];
//        loadUserPhotos(page, fakePhotos, 44);
        cards.photo.get({
            quality: 0.5, // number between 0-1
            minResults: 0, // number between 0-25
            maxResults: 1, // number between 1-25
            maxHeight: 960, // number in pixels between 0-1280
            maxWidth: 960 // number in pixels between 0-1280
        }, function(photos) {
            if (!photos) {
                // action cancelled by user
            }
            else {
                FlurryAgent.logEvent("VUP: Add picture");
                // photos is a list of data URLs
                //$(page).find('.photos-container').css('background', 'url("'+ photos[0] +'")');
//                var loader = $('<div>').attr('class', 'photo-container-loader').append($('<img>').attr('src', 'images/loader.gif'));
//                $(page).find('.photos-container').prepend(loader);
                var tempImg = new Image();
                tempImg.src = photos[0];
                if (!tempImg.complete) {
                    tempImg.onload = function() {
                        var photoContainer = loadUserPhoto(page, photos[0], 0, 44);
                        uploadAndRetrievePhoto(page, photos[0], tempImg.width, tempImg.height, photoContainer);

                        profile_image_count++;
                        showOrHideCloseButton(page);
                    };
                } else {
                    var photoContainer = loadUserPhoto(page, photos[0], 0, 44);
                    uploadAndRetrievePhoto(page, photos[0], tempImg.width, tempImg.height, photoContainer);

                    profile_image_count++;
                    showOrHideCloseButton(page);
                }


            }
        });

    };
    /*
     var loadUserPhotos = function(page, srcArray, heightOffset) {
     var photosContainer = $(page).find('.photos-container');
     
     for (var i = 0; i < srcArray.length; ++i) {
     (function(i) {
     var src = srcArray[i];
     var img = new Image();
     img.src = src;
     
     var photoContainer =
     $('<div>').attr('class', 'photo-container').css('height', window.innerHeight - heightOffset - 44 - 13);
     
     
     if (!img.complete) {
     img.onload = function() {
     photoContainer.css('background', 'url(' + src + '); background-size:cover; background-position: center;')
     };
     } else {
     photoContainer.css('background', 'url(' + src + '); background-size:cover; background-position: center;')
     }
     photosContainer.prepend(photoContainer);
     
     var closeButton = $('<img>').attr('src', 'images/icon-x.png').attr('class', 'photo-delete').on('tap', function() {
     photoContainer.animate({
     opacity: 0
     }, 150, 'ease-in-out', function() {
     photoContainer.remove();
     });
     
     // TODO: also ajax to delete the photo on server here
     
     
     });
     
     photoContainer.append(closeButton);
     })(i);
     }
     
     
     
     //        $(page).find('.image-wrapper').css('height', window.innerHeight - heightOffset);
     };
     */


    var uploadAndRetrievePhoto = function(page, imageData, imageWidth, imageHeight, photoContainerObj) {
        var hashedSourceId = sok.utils.hashCode(imageData.split(',')[1].slice(-128));
        var pushData = {
            task: "uploadProfilePicture",
            format: "json",
            user_id: localStorage['user_id'],
            user_image: imageData.split(',')[1],
            user_image_source: "collection",
            user_image_source_id: hashedSourceId < 0 ? -1 * hashedSourceId : hashedSourceId, // TODO: get the real unique id...
            user_image_width: imageWidth,
            user_image_height: imageHeight
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
                    var imageToken = data.response.image_token;
                    var fullImagePath = SW3_URL + imageToken + '_' + imageWidth + 'x' + imageHeight;
                    var id = data.response.image_id;
//                            $(page).text(fullImagePath);
//                    loader.remove();
                    setPhotoId(photoContainerObj, id);

                    $.ajax({
                        type: 'POST',
                        url: SERVER_URL,
                        // data to be added to query string:
                        data: {
                            task: 'setCurrentProfilePicture',
                            format: 'json',
                            'image_id': id,
                            'user_id': localStorage['user_id']
                        },
                        // type of data we are expecting in return:
                        dataType: 'json',
                        success: function(data) {
//                console.log(data.response.user_id);
                            if (data.status === "success") {
                                // nothing
                                sok.utils.getCurrentProfilePicture(function(new_profile_pic_url) {
                                    if (new_profile_pic_url) {
                                        localStorage['current_profilepic'] = new_profile_pic_url;
                                        menu.reloadDataPerLocalStorage();
                                    }
                                });
                            } else {
                                // nothing
                            }
                        }, error: function(xhr, type) {
//                            $(page).text(xhr.responseText);
                        }
                    });
                } else {
                    // TODO: handle server error
//                    loader.remove();
                }
            },
            error: function(xhr, type) {
                // TODO: handle server error
//                loader.remove();
//                $(page).text(xhr.responseText);
            }
        });
    };


    var showOrHideCloseButton = function(page) {
        if (profile_image_count <= 1)
            $(page).find('.photo-delete').css('display', 'none');
        else
            $(page).find('.photo-delete').css('display', '');
    };

    var setPhotoId = function(photoContainerObj, id) {
        $(photoContainerObj).data('photo-id', id);
    };

    var loadUserPhoto = function(page, src, id, heightOffset, append) {
        var photosContainer = $(page).find('.photos-container');

        var img = new Image();
        img.src = src;
        var imageContainerWidth = parseInt(localStorage['window_width']) - 64;
        var photoContainer =
                $('<div>').attr('class', 'photo-container').css('height', window.innerHeight - heightOffset - 44 - 13);
        
        append ? photosContainer.append(photoContainer) : photosContainer.prepend(photoContainer);
        
        if (!img.complete) {
            img.onload = function() {
                photoContainer.css('height', imageContainerWidth * (this.height / this.width)).css('background', 'url(' + src + '); background-size:cover; background-position: center;');
                setTimeout(function() {
                    if (myProfileScroll) myProfileScroll.refresh();
                }, 100);
            };
        } else {
            photoContainer.css('height', imageContainerWidth * (img.height / img.width)).css('background', 'url(' + src + '); background-size:cover; background-position: center;');
            setTimeout(function() {
                if (myProfileScroll) myProfileScroll.refresh();
            }, 100);
        }
        

        var closeButton = $('<div>').attr('class', 'photo-delete').on('tap', function() {

            if (profile_image_count <= 1) {
                // TODO: maybe add some notice to user saying cannot delete the last profile image.
                return;
            }
            $(this).remove();
            profile_image_count--;
            showOrHideCloseButton(page);
            photoContainer.addClass('fadeOutComplete');
            var toDeleteId = id !== 0 ? id : photoContainer.data('photo-id');
            setTimeout(function() {
                photoContainer.remove();
            }, 310);
            var pushData = {
                task: "deleteProfilePicture",
                format: "json",
                user_id: localStorage['user_id'],
                image_id: toDeleteId
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
//                        var deleted_image_id = data.response.deleted_image_id;
                        sok.utils.getCurrentProfilePicture(function(new_profile_pic_url) {
                            if (new_profile_pic_url) {
                                localStorage['current_profilepic'] = new_profile_pic_url;
                                menu.reloadDataPerLocalStorage();
                            }
                        });
                    } else {
                        // TODO: handle server error
//                        $(page).text(data.status);
                    }
                },
                error: function(xhr, type) {
                    // TODO: handle server error
//                    $(page).text(xhr.responseText);
                }
            });

        }).bind('touchstart', function() {
            $(this).addClass('button-pressed');
        }).bind('touchend', function() {
            $(this).removeClass('button-pressed');
        }).bind('touchmove', function() {
            $(this).removeClass('button-pressed');
            return false;
        });

        photoContainer.append(closeButton);
        showOrHideCloseButton(page);
//        $(page).find('.image-wrapper').css('height', window.innerHeight - heightOffset); 
        return photoContainer;
    };


    var internalDestroy = function(page) {
        $(page).find(".side-page#menu").remove();
        closeSpinningWheel(page);
    };

    var closeSpinningWheel = function(page) {
        if ($(page).find('.basic-info-buttons#age').length) {
            $(page).find('.basic-info-buttons#age').removeClass('selected');
            if ($('#sw-wrapper').length)
                SpinningWheel.close();
            ageOptionsShown = false;
        }
    };

    var destroy = function(page) {
        nameOptionsShown = false;
        ageOptionsShown = false;
        genderOptionsShown = false;
        locationOptionsShown = false;

        old_prefername = "";
        old_age = 0;
        old_gender = "";
        old_user_city = "";
        old_user_country = "";

        new_prefername = "";
        new_age = -1;
        new_gender = "";
        new_user_city = "";
        new_user_country = "";

    };


    return {
        init: init,
        destroy: destroy,
        closeSpinningWheel: closeSpinningWheel
    };
}();