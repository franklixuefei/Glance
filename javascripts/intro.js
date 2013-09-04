/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var intro = function() {
  var spinningWheelOpened = false;
  var username = "";
  var fullname = "";
  var firstname = "";
  var lastname = "";
  var prefername = "";
  var orig_prefername = "";
  var age = null; // need user to fill out
  var gender = ""; // need user to fill out
  var user_country = ""; // if permission denied, need user to fill out
  var user_city = ""; // if permission denied, need user to fill out
  var user_lat = ""; // if permission denied, need user to fill out
  var user_lng = ""; // if permission denied, need user to fill out
  var user_country_iso = ""; // if permission denied, need user to fill out
  var current_profilepic = ""; // this is used to hold current profile picture retrieved from DB.

  var kik_profilepic;
  var imported_profilepic;

  var imported_pic_width;
  var imported_pic_height;

  var nameOptionsShown = false;
  var ageOptionsShown = false;
  var genderOptionsShown = false;
  var locationOptionsShown = false;
  var location_options_count = 0;
  
  
    function handleBackButton() {
        // called when back button is pressed
//      FlurryAgent.logEvent("MyProfile: Back Button Tap");
        if (spinningWheelOpened) {
            $(App.getPage()).find('.basic-info-buttons#age').trigger('tap');
            spinningWheelOpened = false;
            return false;
        }
    }
  
  var initialize = function(page, user) {
    spinningWheelOpened = false;
    location_options_count = 0;
    nameOptionsShown = false;
    ageOptionsShown = false;
    genderOptionsShown = false;
    locationOptionsShown = false;
    kik_profilepic = null;
    imported_profilepic = null;
    imported_pic_width = null;
    imported_pic_height = null;
    // TODO: show loading indicator
    loadingProfile(page, user, function() { // success callback
      // TODO: hide loading indicator
      localStorage["user_country"] = user_country;
      localStorage["user_city"] = user_city;

      //$(page).find('.debug').html("username: " + localStorage["username"] + "<br> fullname" + localStorage["fullname"] + "<br> firstname" + localStorage["firstname"] + "<br> lastname" + localStorage["lastname"] + "<br> age" + localStorage["age"] + "<br> gender" + localStorage["gender"] + "<br> profilepic_large" + localStorage["profilepic_large"] + "<br> profilepic_thumb" + localStorage["profilepic_thumb"] + "<br> user_country" + localStorage["user_country"] + "<br> user_city" + localStorage["user_city"]);

      initProfileData(page, true);
      initInlineChoicePanel(page, true);


    }, function(error_type, err_obj) { // fail callback
      // TODO: error callback, store user_country and user_city to localStorage according to user selection.
      if (error_type === "loc_name_not_found_err") { // given lat and lng, name of the position is not found

        // TODO: handle this error
        initProfileData(page, false);
        initInlineChoicePanel(page, false);
      } else if (error_type === "get_geoloc_err") { // user does not allow browser to get geolocation
        // TODO: handle this error
        initProfileData(page, false);
        initInlineChoicePanel(page, false);
        if (err_obj) {
          switch (err_obj.code)
          {
            case err_obj.PERMISSION_DENIED:

              break;
            case err_obj.POSITION_UNAVAILABLE:

              break;
            case err_obj.TIMEOUT:

              break;
            case err_obj.UNKNOWN_ERROR:

              break;
            default:
          }
        }
      } else { // general error
        // TODO: handle general error.
      }

    });

        
        if (cards.browser && cards.browser.back) {
            cards.browser.back(handleBackButton);
        }
    
  };

  var destroy = function(page) {
    username = "";
    fullname = "";
    firstname = "";
    lastname = "";
    prefername = "";
    orig_prefername = "";
    age = null;
    gender = "";
    user_country = "";
    user_city = "";
    kik_profilepic = "";
    imported_profilepic = "";
    current_profilepic = "";


  };

  var loadingProfile = function(page, user, success, fail) {
//        var user = {
//            username: "franklixuefei",
//            fullName: "Frank Li",
//            firstName: "Frank",
//            lastName: "Li",
//            pic: "http://profilepics.kik.com/u1qfmYdqU56q787xUd0IVD_Is9s/orig.jpg"
//        };


    var pushData = {
      task: 'getUserByKikID',
      kik_id: user.username,
      format: 'json'
    };
    $.ajax({
      type: 'POST',
      url: SERVER_URL,
      // data to be added to query string:
      data: pushData,
      // type of data we are expecting in return:
      dataType: 'json',
      success: function(data) {
        if (data.status === "success") {
          if (data.response.user) { // user exists in database // all below values are retrieved from db.
            var userModel = data.response.user;

            localStorage['user_id'] = userModel.user_id;

            console.log(userModel);
            username = userModel.kik_id;
            fullname = user.fullName;
            firstname = user.firstName;
            lastname = user.lastName;
            // store user info into localStorage
            localStorage["username"] = username;
            localStorage["fullname"] = fullname;
            localStorage["firstname"] = firstname;
            localStorage["lastname"] = lastname;

            prefername = userModel.user_display_name;
            orig_prefername = prefername;
            age = userModel.birthday_timestamp;//sok.utils.ageForBirthday(userModel.birthday_timestamp);
            gender = userModel.user_gender === "male" ? "Male" : "Female";
            user_city = userModel.user_city;
            user_lat = userModel.location.lat;
            user_lng = userModel.location.lng;
            user_country_iso = userModel.location.iso_country;
            user_country = userModel.user_country;
            var sizes = userModel.image.image.sizes;
            current_profilepic = sok.utils.generateImagePathForLevel(userModel.image, 5);
            // settings 

            localStorage["match_pref_gender"] = userModel.gender_preference; // male || female || everyone
            localStorage["match_pref_slider_value"] = parseInt(userModel.preferred_distance_m) / 1000;
            localStorage["match_pref_thumb_pos"] = parseInt(userModel.preferred_thumb_pos);
            var disabled_notification_types = userModel.disabled_notification_types;
            localStorage["hearts_on"] = false;
            localStorage["matches_on"] = false;
            if (disabled_notification_types.indexOf('admire') === -1) {
              localStorage["hearts_on"] = true;
            }
            if (disabled_notification_types.indexOf('match') === -1) {
              localStorage["matches_on"] = true;
            }
            getLocation(success, fail);
          } else { // brand new user


            username = user.username;
            fullname = user.fullName;
            firstname = user.firstName;
            lastname = user.lastName;
            if (user.pic) {
              var orig_pic_arr = user.pic.split('/');
              kik_profilepic = 'http://profilepics.kik.com/' + orig_pic_arr[3] + '/' + orig_pic_arr[4];
            } else {
              kik_profilepic = "no_kik_profilepic";
            }
            // store user info into localStorage
            localStorage["username"] = username;
            localStorage["fullname"] = fullname;
            localStorage["firstname"] = firstname;
            localStorage["lastname"] = lastname;


            prefername = fullname;
            orig_prefername = prefername;

            age = null;
            gender = "";
            user_city = "";
            user_country = "";
            // settings 

            localStorage["match_pref_gender"] = "everyone"; // male || female || everyone. Will be set in registration stage.
            localStorage["match_pref_slider_value"] = 200; // 90km // preferred_distance_m / 1000
            localStorage["match_pref_thumb_pos"] = 216;
            localStorage["hearts_on"] = false; // must be true || false
            localStorage["matches_on"] = true; // must be true || false
            getLocation(success, fail);

          }
          $(page).find('#name-input').val(prefername);
        } else {
          // TODO: handle server error
        }


      },
      error: function(xhr, type) {
        //console.log('Ajax error!');
      }

// end in callback
    });
  };

  var getLocation = function(success, fail) {
    var latitude = geoip_latitude();
    var longitude = geoip_longitude();
    user_lat = latitude;
    user_lng = longitude;
    getLocationName(latitude, longitude, success, fail);

//        if (navigator.geolocation)
//        {
//            navigator.geolocation.getCurrentPosition(function(position) {
//                FlurryAgent.logEvent("Location Services Enabled");
//                var latitude = position.coords.latitude;
//                var longitude = position.coords.longitude;
//                user_lat = latitude;
//                user_lng = longitude;
//                getLocationName(latitude, longitude, success, fail);
//            }, function(error) {
//                // TODO: handle error
//                fail("get_geoloc_err", error);
//
//            });
//        }
//        else {
//            // geolocation not supported in this browser.
//            fail("browser_not_supported_err");
//        }
  };

  var getLocationName = function(latitude, longitude, success, fail) {

    $.ajax({
      type: 'POST',
      url: SERVER_URL,
      data: {
        task: 'searchForCityByLocation',
        latitude: latitude,
        longitude: longitude,
        format: 'json'
      },
      // type of data we are expecting in return:
      dataType: 'json',
      success: function(data) {
        if (data.status === "success") {
          console.log(data);
          var cityInfo = data.response.city;
          user_city = cityInfo.city_name;
          user_country = cityInfo.country_name;
          user_country_iso = cityInfo.geolocation_info.iso_country;
          success();
        } else {
          fail("loc_name_not_found_err");
        }
      },
      error: function(xhr, type) {
        fail("loc_name_not_found_err");
      }
    });
//        $.getJSON('http://maps.googleapis.com/maps/api/geocode/json?latlng=' + latitude + ',' + longitude + '&sensor=true', function(data) {
//            var city_found = false;
//            var country_found = false;
//            for (var k = 0; k < data.results.length; k++) {
//                for (var i = 0; i < data.results[k].address_components.length; i++) {
//                    for (var j = 0; j < data.results[k].address_components[i].types.length; j++) {
//                        if (data.results[k].address_components[i].types[j] === 'locality') {
//                            user_city = data.results[k].address_components[i].long_name;
//                            city_found = true;
//                        }
//                        if (data.results[k].address_components[i].types[j] === 'country') {
//                            user_country = data.results[k].address_components[i].long_name;
//                            user_country_iso = data.results[k].address_components[i].short_name;
//                            country_found = true;
//                        }
//                        if (city_found && country_found) {
//                            success();
//                            return;
//                        }
//                    }
//                }
//            }
//            fail("loc_name_not_found_err");
//        });
  };

  var initProfileData = function(page, locationDetected) {

    $(page).find('.register').on('tap', function() {
      register(page);
    }).bind('touchstart', function() {
      $(this).addClass('button-pressed');
    }).bind('touchend', function() {
      $(this).removeClass('button-pressed');
    }).bind('touchmove', function() {
      $(this).removeClass('button-pressed');
      return false;
    });

    $(page).find('.camera-container').on('tap', function() {
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
          // photos is a list of data URLs
          //$(page).find('.photos-container').css('background', 'url("'+ photos[0] +'")');
          FlurryAgent.logEvent("Login-Review: Change Profile Pic");
          importProfilePic(page, $(page).find('.intro-profile-pic'), photos[0]);
        }
      });
    }).bind('touchstart', function() {
      $(this).find('span').addClass('button-pressed');
    }).bind('touchend', function() {
      $(this).find('span').removeClass('button-pressed');
    }).bind('touchmove', function() {
      $(this).find('span').removeClass('button-pressed');
      return false;
    });
    // init profile pic
    if (kik_profilepic !== "no_kik_profilepic" || current_profilepic) {
      initProfilePic(page, $(page).find('.intro-profile-pic'));
    }

//        var fullname = localStorage["fullname"];
//        var firstname = localStorage["firstname"];
//        var lastname = localStorage["lastname"];
//        prefername = fullname;
    $(page).find('#name-value').text(prefername);
//        $(page).find('#name-text-1').text(firstname);
//        var combinedname = firstname + ' ' + lastname.substr(0, 1) + '.';
//        $(page).find('#name-text-2').text(combinedname);
//        $(page).find('#name-text-3').text(fullname);
//        if (prefername === firstname) {
//            $(page).find('#name-text-1').parent().addClass('selected');
//        } else if (prefername === combinedname) {
//            $(page).find('#name-text-2').parent().addClass('selected');
//        } else {
//            $(page).find('#name-text-3').parent().addClass('selected');
//        }

//        age = 21;


    $(page).find('#age-value').text(age !== null ? sok.utils.convertBirthdayTimestamp(age) : "");

    var genderMale = "Male";
    var genderFemale = "Female";

//        gender = "Male";
    $(page).find('#gender-value').text(gender);
    $(page).find('#gender-text-1').text(genderMale);
    $(page).find('#gender-text-2').text(genderFemale);
    if (gender === "Male") {
      $(page).find('#gender-text-1').parent().addClass('selected');
    } else if (gender === "Female") {
      $(page).find('#gender-text-2').parent().addClass('selected');
    }

    if (locationDetected) {
      $(page).find('#location-value').text(localStorage["user_city"]);
//      disableLocationSelection(page);
    } else {
//            user_city = "Waterloo";
      $(page).find('#location-value').text(user_city);
    }

    checkValidity(page);

  };

  var initProfilePic = function(page, imageContainer) {
    var source = kik_profilepic ? kik_profilepic : current_profilepic; // if new user, kik_profilepic inited, otherwise, old user, current_profilepic retrieved.
    var img = new Image();
    if (kik_profilepic) {
      img.crossOrigin = 'anonymous';
    }
    img.src = source;

    if (!img.complete) {
      img.onload = function() {
        if (kik_profilepic) {
          imported_profilepic = convertToDataUrl(this);
          source = imported_profilepic;
//                    $(page).text(source);
          imported_pic_width = this.width;
          imported_pic_height = this.height;

        }
        imageContainer.css('background-image', 'url(' + source + ')').css('background-size', 'cover').css('background-position', 'center');

      };
    } else {
      if (kik_profilepic) {
        imported_profilepic = convertToDataUrl(img);
        source = imported_profilepic;
        imported_pic_width = img.width;
        imported_pic_height = img.height;
//                $(page).text(source);
      }
      imageContainer.css('background-image', 'url(' + source + ')').css('background-size', 'cover').css('background-position', 'center');

    }


  };

  var convertToDataUrl = function(img) {
    var imgCanvas = document.createElement("canvas"),
            imgContext = imgCanvas.getContext("2d");

// Make sure canvas is as big as the picture
    imgCanvas.width = img.width;
    imgCanvas.height = img.height;

// Draw image into canvas element
    imgContext.drawImage(img, 0, 0, img.width, img.height);

// Get canvas contents as a data URL
    return imgCanvas.toDataURL("image/jpg");
  };

  var importProfilePic = function(page, imageContainer, newImgData) {
    var src = newImgData;
    var img = new Image();
    img.src = src;
    if (!img.complete) {
      img.onload = function() {
        imageContainer.css('background-image', 'url(' + src + ')').css('background-size', 'cover').css('background-position', 'center');
        imported_pic_width = this.width;
        imported_pic_height = this.height;
      };
    } else {
      imageContainer.css('background-image', 'url(' + src + ')').css('background-size', 'cover').css('background-position', 'center');
      imported_pic_width = img.width;
      imported_pic_height = img.height;
    }

    imported_profilepic = newImgData;
    checkValidity(page);

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
      setTimeout(function() {
        $(page).find('.app-content')[0].scrollTop = 350;
        $(page).find('#location-search-input').focus();
      }, 300);
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
      }).bind('focus', function() {
        $(page).find('.app-content')[0].scrollTop = 350;
      });
    } else {
      $(page).find('#location-search-input').blur();
      clearTimeout(timer);
      $(page).find('#location-search-input').off('input');
    }
  };




  var foldupAllSelect = function(page, indicator) {
    $(page).find('.basic-info-wrapper').removeClass('moveup');
    $(page).find('.basic-info-wrapper').removeClass('moveup2');
    $(page).find('.select').removeClass('selected');
    $(page).find('.basic-info-options-container').css('height', '');
    if (indicator !== nameOptionsShown)
      nameOptionsShown = false;
    if (ageOptionsShown)
      SpinningWheel.close();
      spinningWheelOpened = false;
    if (indicator !== ageOptionsShown)
      ageOptionsShown = false;
    if (indicator !== genderOptionsShown)
      genderOptionsShown = false;
    if (indicator !== locationOptionsShown)
      locationOptionsShown = false;
    $(page).find('input').blur();

  };

  var initInlineChoicePanel = function(page, locationDetected) {

    var listenToNameChange = function(shown) {
      if (shown) {
        $(page).find('#name-input').focus();
        $(page).find('#name-input').on('input', function() {
          var partialName = $(this).val();
          $(page).find('#name-value').text(partialName);
          prefername = partialName;
          checkValidity(page);
        });
      } else {
        $(page).find('#name-input').blur();
        $(page).find('#name-input').off('input');
      }

    };

    $(page).find('.basic-info-buttons#name').on('tap', function() {
      foldupAllSelect(page, nameOptionsShown);
      if (!nameOptionsShown) {
        $(page).find('.basic-info-wrapper').addClass('moveup2');
        $(this).addClass('selected');
        var numNameOptions = 1;
        $(page).find('.basic-info-options-container#name-options').css('height', numNameOptions * 46 + 'px');
        listenToNameChange(true);
        nameOptionsShown = true;
      } else {
        $(page).find('.basic-info-wrapper').removeClass('moveup2');
        $(this).removeClass('selected');
        $(page).find('.basic-info-options-container#name-options').css('height', '');
        listenToNameChange(false);
        nameOptionsShown = false;
      }

    });


    $(page).find('.basic-info-buttons#age').on('tap', function() {
      foldupAllSelect(page, ageOptionsShown);

      if (!ageOptionsShown) {
        $(page).find('.basic-info-wrapper').addClass('moveup');
        $(this).addClass('selected');
        var numNameOptions = 1;
        // determine how many options by whether we have last name or not. If we have last name
        //$(page).find('.basic-info-options-container#age-options').css('height', numNameOptions * 46 +'px');
        showAgeOptions(page, $(this));

        ageOptionsShown = true;
      }

      else {
        $(page).find('.basic-info-wrapper').removeClass('moveup');
        $(this).removeClass('selected');
        SpinningWheel.close();
        spinningWheelOpened = false;
        ageOptionsShown = false;
      }

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


    });
    $(page).find('.basic-info-buttons#location').on('tap', function() {
      foldupAllSelect(page, locationOptionsShown);
      if (!locationOptionsShown) {

        $(this).addClass('selected');
        // determine how many options by whether we have last name or not. If we have last name
        var appContentHeight = window.innerHeight;

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


    });

    $(page).find('.basic-info-options').on('tap', function() {
      optionSelected(page, $(this));
    });
//    if (locationDetected) {
//      disableLocationSelection(page);
//    }
  };

  var optionSelected = function(page, option) {
    foldupAllSelect(page);
    $(option).parent().children().removeClass('selected');
    $(option).addClass('selected');
    if ($(option).parent().attr('id') === "name-options") { // deprecated
      prefername = $(option).find('.option-text').text();
      $(page).find('#name-value').text(prefername);
    } else if ($(option).parent().attr('id') === "gender-options") {
      gender = $(option).find('.option-text').text();
      $(page).find('#gender-value').text(gender);
    } else if ($(option).parent().attr('id') === "location-options") {
//            user_city = $(option).find('.option-text').text();
      user_city = $(option).data('city');
      user_country = $(option).data('country');
      user_country_iso = $(option).data('iso_country_code');
      user_lat = $(option).data('lat');
      user_lng = $(option).data('lng');
      $(page).find('#location-value').text(user_city);
      setTimeout(function() {
        $(page).find('#location-search-input').val("");
        $(page).find('#location-options .basic-info-buttons').remove();
      }, 200);
      // TODO: remove the following
//                $.getJSON('http://maps.google.com/maps/api/geocode/json?address=' + user_city + ',' + user_country + '&sensor=false', function(data) {
//                    // TODO: enable GO button and remove loading indicator.
//                    user_lat = 0;
//                    user_lng = 0;
//                    user_country_iso = "UNKNOWN";
//                    for (var k = 0; k < data.results.length; k++) {
//                        for (var i = 0; i < data.results[k].address_components.length; i++) {
//                            for (var j = 0; j < data.results[k].address_components[i].types.length; j++) {
//                                if (data.results[k].address_components[i].types[j] === 'country') {
//                                    user_country_iso = data.results[k].address_components[i].short_name;
//                                }
//                            }
//                        }
//                        if (data.results[k].geometry) {
//                            user_lat = data.results[k].geometry.location.lat;
//                            user_lng = data.results[k].geometry.location.lng;
//                        }
//                    }
//                });
      // end of remove

    } else {
      // nothing
    }
    checkValidity(page);
  };


  var showAgeOptions = function(page, myself) {
    var numbers = {0: 15, 1: 16, 2: 17, 3: 18, 4: 19, 5: 20, 6: 21, 7: 22, 8: 23, 9: 24, 10: 25, 11: 26, 12: 27, 13: 28, 14: 29, 15: 30, 16: 31, 17: 32, 18: 33, 19: 34, 20: 35, 21: 36, 22: 37, 23: 38, 24: 39, 25: 40, 26: 41, 27: 42, 28: 43, 29: 44, 30: 45, 31: 46, 32: 47, 33: 48, 34: 49, 35: 50, 36: 51, 37: 52, 38: 53, 39: 54, 40: 55, 41: 56, 42: 57, 43: 58, 44: 59, 45: 60, 46: 61, 47: 62, 48: 63, 49: 64, 50: 65, 51: 66, 52: 67, 53: 68, 54: 69, 55: 70, 56: 71, 57: 72, 58: 73, 59: 74, 60: 75, 61: 76, 62: 77, 63: 78, 64: 79, 65: 80, 66: 81, 67: 82, 68: 83, 69: 84, 70: 85, 71: 86, 72: 87, 73: 88, 74: 89, 75: 90, 76: 91, 77: 92, 78: 93, 79: 94, 80: 95, 81: 96, 82: 97, 83: 98, 84: 99};
//        SpinningWheel.addSlot(numbers, 'center');

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

    var birthDate;
    if (age === null) {
      var defaultDate = (new Date()).getTime() - 20 * 365 * 24 * 3600 * 1000;
      birthDate = new Date(defaultDate);
    }
    else {
      birthDate = new Date(age * 1000);
    }

    SpinningWheel.addSlot(months, 'center', birthDate.getUTCMonth() + 1);
    SpinningWheel.addSlot(days, 'center', birthDate.getUTCDate());
    SpinningWheel.addSlot(years, 'center', birthDate.getUTCFullYear());

    SpinningWheel.setCancelAction(cancelAction);
    SpinningWheel.setDoneAction(doneAction);

    function cancelAction() {
      $(page).find('.basic-info-wrapper').removeClass('moveup');
      $(page).find('.select.selected').removeClass('selected');
      setTimeout(function() {
        ageOptionsShown = false;
      }, 600);
//            $('#sw-frame').off('tap')
    }

    function doneAction() {
      $(page).find('.basic-info-wrapper').removeClass('moveup');
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
      age = Math.floor(Date.UTC(parseInt(results.values[2]), parseInt(i) - 1, parseInt(results.values[1])) / 1000);

      setTimeout(function() {
        ageOptionsShown = false;

      }, 600);
    }

    SpinningWheel.open();
    spinningWheelOpened = true;
    $('#sw-wrapper').css('z-index', 2001);
//        $('.sw-center').find('ul').css('-webkit-transform', 'translate3d(0, ' + -44 * (age - 15) + 'px, 0)');

  };

  var disableLocationSelection = function(page) {
    $(page).find('#location-arrow').remove();
    $(page).find('.select#location').off('tap');
    $(page).find('#location-value').css('right', '12px');
  };

  var checkValidity = function(page) {
    var notValid = (age === null || gender === "" || prefername === "" || user_country === "" || user_city === "" || user_lat === "" || user_lng === "" || user_country_iso === "" || (imported_profilepic === null && (kik_profilepic === null || kik_profilepic === 'no_kik_profilepic') && current_profilepic === ""));
    if (notValid) {
      $(page).find('.register').addClass('disabled');
    } else {
      $(page).find('.register').removeClass('disabled');
    }
    return !notValid;
  };


  var register = function(page) {

    if (!checkValidity(page)) {
      return;
    }

    $(page).find('.register').addClass('loading');

    localStorage["age"] = age;
    localStorage["gender"] = gender;
    localStorage["match_pref_gender"] = (gender === "Male") ? "female" : "male"; // opposite to user's gender
    localStorage["prefername"] = prefername;
    localStorage["user_country"] = user_country;
    localStorage["user_city"] = user_city;
    localStorage["current_profilepic"] = current_profilepic ? current_profilepic : (kik_profilepic && kik_profilepic !== 'no_kik_profilepic' ? kik_profilepic : 'images/placeholder.png');
    localStorage['user_lat'] = user_lat;
    localStorage['user_lng'] = user_lng;
    localStorage['user_country_iso'] = user_country_iso;
//        var d = new Date();
//        d.setYear(d.getYear() - age);

    var disabled_notification_types = new Array();
    if (localStorage["hearts_on"] !== "true") {
      disabled_notification_types.push('admire');
    }

    if (localStorage["matches_on"] !== "true") {
      disabled_notification_types.push('match');
    }
    var pushData = {
      task: 'setProfile',
      kik_id: username,
      interested_in: localStorage["match_pref_gender"],
      user_display_name: prefername,
      fullname: fullname,
      firstname: firstname,
      lastname: lastname,
      birthday_timestamp: age,
      user_gender: gender,
      user_city: user_city,
      user_country: user_country,
      country_code: user_country_iso,
      latitude: user_lat,
      longitude: user_lng,
      preferred_distance_m: parseInt(localStorage["match_pref_slider_value"]) * 1000,
      preferred_thumb_pos: parseInt(localStorage["match_pref_thumb_pos"]),
      disabled_notification_types: JSON.stringify(disabled_notification_types),
      in_kik_card: 1,
      format: 'json'
    };

    if (localStorage["user_id"]) {
      pushData['user_id'] = localStorage["user_id"];
    }

    if (kik_profilepic && kik_profilepic !== 'no_kik_profilepic') {
//            pushData['kik_profilepic'] = kik_profilepic;
      pushData['user_image_source'] = "kik"; // in Kik card, cannot distinguish between camera and collection
    }

    if (imported_profilepic) {
      pushData['user_image'] = imported_profilepic.split(',')[1];
      pushData['user_image_source_id'] = sok.utils.hashCode(imported_profilepic.split(',')[1].slice(-128)); // TODO figure out how to get a unique id
      pushData['user_image_width'] = imported_pic_width;
      pushData['user_image_height'] = imported_pic_height;
      pushData['user_image_source'] = "collection"; // in Kik card, cannot distinguish between camera and collection
    }

    $.ajax({
      type: 'POST',
      url: SERVER_URL,
      // data to be added to query string:
      data: pushData,
      // type of data we are expecting in return:
      dataType: 'json',
      success: function(data) {
//                console.log(data.response.user_id);
        if (data.status === "success" || data.status === "banned") {
          FlurryAgent.logEvent("Login: Entry");
          FlurryAgent.logEvent("Login: Tapped Kik Login");

          localStorage["user_id"] = data.response.user_id;
          localStorage["intro_flow_done"] = true;
          // initialize menu with user info (retrieve from localStorage)
          menu.init(); // call only once here
          // initialize notification panel
          notification.init(); // call only once here
          // go to match game (should be inside ajax callback)
          sok.utils.getCurrentProfilePicture(function(new_profile_pic_url) {
            if (new_profile_pic_url) {
              localStorage['current_profilepic'] = new_profile_pic_url;
              menu.reloadDataPerLocalStorage();
            }
          });
          App.load('matchGame', {}, function() {
            menu.prepare($(App.getPage()));
            App.removeFromStack();
          });
          if (cards.browser && cards.browser.unbindBack) {
            cards.browser.unbindBack(handleBackButton);
          }
        } else {
          // TODO: handle server error
          $(page).find('.register').removeClass('loading');
        }
      },
      error: function(xhr, type) {
//                $(page).text(type + xhr.responseText);
        $(page).find('.register').removeClass('loading');
      }
    });
// 
// 

  };


  return {
    init: initialize,
    destroy: destroy
  };
}();