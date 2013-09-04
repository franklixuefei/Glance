/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var preferences = function() {

  var old_gender_preference;
  var new_gender_preference;

  var old_distance_value;
  var new_distance_value;

  var initialize = function(page) {
    old_gender_preference = localStorage["match_pref_gender"];
    new_gender_preference = localStorage["match_pref_gender"];
    old_distance_value = localStorage["match_pref_slider_value"];
    new_distance_value = localStorage["match_pref_slider_value"];

    FlurryAgent.logEvent("MatchPrefs: Entry");
    if (localStorage["match_pref_gender"]) {
      genderSelector.init(page, localStorage["match_pref_gender"]);
    } else {
      genderSelector.init(page, "everyone");
    }

    var init_thumb_pos = 0;
    switch (parseInt(localStorage["match_pref_slider_value"])) {
      case 10:
        init_thumb_pos = 4;
        break;
      case 20:
        init_thumb_pos = 30;
        break;
      case 30:
        init_thumb_pos = 47;
        break;
      case 40:
        init_thumb_pos = 58;
        break;
      case 50:
        init_thumb_pos = 72;
        break;
      case 60:
        init_thumb_pos = 74;
        break;
      case 70:
        init_thumb_pos = 81;
        break;
      case 80:
        init_thumb_pos = 88;
        break;
      case 90:
        init_thumb_pos = 91;
        break;
      case 100:
        init_thumb_pos = 95;
        break;
      case 110:
        init_thumb_pos = 100;
        break;
      case 120:
        init_thumb_pos = 104;
        break;
      case 130:
        init_thumb_pos = 109;
        break;
      case 140:
        init_thumb_pos = 112;
        break;
      case 150:
        init_thumb_pos = 115;
        break;
      case 160:
        init_thumb_pos = 118;
        break;
      case 170:
        init_thumb_pos = 121;
        break;
      case 180:
        init_thumb_pos = 123;
        break;
      case 190:
        init_thumb_pos = 126;
        break;
      case 200:
        init_thumb_pos = 129;
        break;
      case 250:
        init_thumb_pos = 140;
        break;
      case 300:
        init_thumb_pos = 149;
        break;
      case 350:
        init_thumb_pos = 157;
        break;
      case 400:
        init_thumb_pos = 164;
        break;
      case 450:
        init_thumb_pos = 170;
        break;
      case 500:
        init_thumb_pos = 176;
        break;
      case 600:
        init_thumb_pos = 186;
        break;
      case 700:
        init_thumb_pos = 196;
        break;
      case 800:
        init_thumb_pos = 204;
        break;
      case 900:
      case 1000:
        init_thumb_pos = 216;
        break;
    }

    if (init_thumb_pos) {
      slider.init(page, init_thumb_pos);
    } else {
      slider.init(page, 220 - 4);
    }

    function handleBackButton() {
      // called when back button is pressed
      FlurryAgent.logEvent("MatchPrefs: Back Button Tap");
      var storeToServer = save();
      destroy(page);
      App.back(function() {
        notification.updater.regenerate($(App.getPage()));
        menu.prepare($(App.getPage()));
        imageViewer.swipeGesture.maybeShowBottomBar($(App.getPage()));
        if (storeToServer && $(App.getPage()).attr('data-page') === 'matchGame') {
          matchGame.reload('.app-page');
        }
        if (cards.browser && cards.browser.unbindBack) {
          cards.browser.unbindBack(handleBackButton);
        }
      });
//      return false; // optionally cancel default behavior
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

  var genderSelector = function() {

    var initialize = function(page, gender) {
      $(page).find('.gender-option#' + gender).addClass('active');
      $(page).find('.gender-option').on('tap', function() {
        FlurryAgent.logEvent("MatchPrefs: Modify Gender");
        selectGender(page, $(this));
      }).bind('touchstart', function() {
        $(this).addClass('button-pressed-blue');
      }).bind('touchend', function() {
        $(this).removeClass('button-pressed-blue');
      }).bind('touchmove', function() {
        $(this).removeClass('button-pressed-blue');
        return false;
      });
      $(page).find('.gender-option div').bind('touchstart', function() {
        $(this).addClass('button-pressed');
      }).bind('touchend', function() {
        $(this).removeClass('button-pressed');
      }).bind('touchmove', function() {
        $(this).removeClass('button-pressed');
        return false;
      });
    };

    var selectGender = function(page, option) { // gender === "everyone" || "male" || "female"
      $(page).find('.gender-option').removeClass('active');
      $(option).addClass('active');
      localStorage["match_pref_gender"] = $(option).attr('id');
      new_gender_preference = localStorage["match_pref_gender"];
    };

    return {
      init: initialize
    }
  }();


  var slider = function() {
    //    var slider_body_width = 224;
    //    var slider_thumb_width = 37;
    var slider_min_val = 1.25893;
    var slider_max_val = 2.01437;
    var initialize = function(page, thumb_pos) { // thumb_pos : 0 - 220
      var startX = 0;
      var new_thumb_pos;
      var rounded_val;

      var all_dist_threashold = 900;
      var all_dist_text = "Any distance";
      var thumb_min_pos = 0;
      var thumb_max_pos = 220;
      var min_rounded_val = round_val(page, scale_val(page, slider_min_val));
      var max_rounded_val = round_val(page, scale_val(page, slider_max_val));
      //console.log(startX);
      //var translateX = 20; // initial thumb relative pos // min: 0. max: 220
      $(page).find('#slider-thumb').css('-webkit-transform', 'translateX(' + (thumb_pos + 4) + 'px)');
      var initial_slider_val = localStorage["match_pref_slider_value"] ? parseInt(localStorage["match_pref_slider_value"]) : 10;
      if (initial_slider_val >= all_dist_threashold) {
        initial_slider_val = all_dist_text;
      } else {
        initial_slider_val = initial_slider_val + 'km';
      }
      $(page).find('#slider-value').css('-webkit-transform', 'translateX(' + (thumb_pos + 4) + 'px)').text(initial_slider_val);
      $(page).find('#slider-active-body').css('width', (thumb_pos + 4) + 'px');
      $(page).find('#slider-thumb').one('touchstart', function(e) {
        startX = e.targetTouches[0].clientX;
//            console.log(startX);
      }).bind('touchmove', function(e) {
        new_thumb_pos = thumb_pos + e.targetTouches[0].clientX - startX;
        if (new_thumb_pos >= thumb_min_pos + 4 && new_thumb_pos <= thumb_max_pos) {
          $(page).find('#slider-active-body').css('width', (new_thumb_pos) + 'px');
          $(this).css('-webkit-transform', 'translateX(' + (new_thumb_pos) + 'px)');
          var real_val = (new_thumb_pos) * (slider_max_val - slider_min_val) / (thumb_max_pos - thumb_min_pos) + slider_min_val;
//                    console.log(round_val(page, scale_val(page, real_val)));
          rounded_val = round_val(page, scale_val(page, real_val));
          $(page).find('#slider-value').css('-webkit-transform', 'translateX(' + (new_thumb_pos) + 'px)').text(rounded_val < all_dist_threashold ? rounded_val + 'km' : all_dist_text);
        }
      }).bind('touchend', function() {
        FlurryAgent.logEvent("MatchPrefs: Modify Distance");
        if (new_thumb_pos >= thumb_min_pos + 4 && new_thumb_pos <= thumb_max_pos) {
          localStorage["match_pref_thumb_pos"] = new_thumb_pos;
          localStorage["match_pref_slider_value"] = rounded_val;
        } else if (new_thumb_pos < thumb_min_pos + 4) {
          localStorage["match_pref_thumb_pos"] = thumb_min_pos + 4;
          localStorage["match_pref_slider_value"] = min_rounded_val;
        } else if (new_thumb_pos > thumb_max_pos) {
          localStorage["match_pref_thumb_pos"] = thumb_max_pos - 4;
          localStorage["match_pref_slider_value"] = max_rounded_val;
        }
        new_distance_value = localStorage["match_pref_slider_value"];
      });
    };

    var round_val = function(page, value) {
      if (value <= 200)
        return Math.floor(value / 10) * 10;
      if (value <= 500)
        return Math.floor(value / 50) * 50;
      if (value <= 1000)
        return Math.floor(value / 100) * 100;
      if (value <= 50000)
        return Math.floor(value / 1000) * 1000;
      return Math.floor(value / 25000) * 25000;
    };

    var scale_val = function(page, value) {
      return Math.pow(value, 10);
    };

    return {
      init: initialize
    }
  }();

  var save = function() {
    var propertyCount = 0;

    var pushData = {
      task: 'setProfile',
      user_id: localStorage['user_id'],
      kik_id: localStorage['username'],
      format: 'json',
      preferred_thumb_pos: localStorage["match_pref_thumb_pos"]
    };

    if (old_gender_preference !== new_gender_preference) {
      pushData.interested_in = new_gender_preference;
      propertyCount++;
    }

    if (old_distance_value !== new_distance_value) {
      pushData.preferred_distance_m = parseInt(new_distance_value) * 1000;
      propertyCount++;
    }

    if (propertyCount) {
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
    return propertyCount;
  };

  var destroy = function(page) {
    $(page).find(".side-page#menu").remove();
  };


  return {
    init: initialize
  };
}();