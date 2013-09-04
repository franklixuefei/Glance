/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var settings = function() {
  var matches_on = true;
  var hearts_on = true;
  var initialize = function(page) {
    FlurryAgent.logEvent("Settings: Entry");

    matches_on = true;
    hearts_on = true;
    if (localStorage["matches_on"] === "false") {
      toggleSwitch(page, $(page).find('#matches .sok-toggle'));
    }

    if (localStorage["hearts_on"] === "false") {
      toggleSwitch(page, $(page).find('#hearts .sok-toggle'));
    }

    $(page).find('.sok-toggle').on('tap', function() {
      toggleSwitch(page, $(this));
    }).on('swipe', function() {
      toggleSwitch(page, $(this));
    });

    function handleBackButton() {
      // called when back button is pressed
      FlurryAgent.logEvent("Settings: Back Button Tap");
      save();
      destroy(page);
      App.back(function() {
        notification.updater.regenerate($(App.getPage()));
        menu.prepare($(App.getPage()));
        imageViewer.swipeGesture.maybeShowBottomBar($(App.getPage()));
        if (cards.browser && cards.browser.unbindBack) {
          cards.browser.unbindBack(handleBackButton);
        }
      });
//      return false; // optionally cancel default behavior
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
    
    if (cards.browser && cards.browser.back) {
      cards.browser.back(handleBackButton);
    }
  };

  var toggleSwitch = function(page, sokSwitch) {
    if ($(sokSwitch).parent().attr('id') === 'matches') {
      if (!matches_on) {
        FlurryAgent.logEvent("Settings: Match Notif On");
        $(sokSwitch).find('.animated').addClass('active');
        $(sokSwitch).find('.toggle-frame').css('background-color', '');
      } else {
        FlurryAgent.logEvent("Settings: Match Notif Off");
        $(sokSwitch).find('.animated').removeClass('active');
        $(sokSwitch).find('.toggle-frame').css('background-color', '#7f847c');
      }
      matches_on = !matches_on;
      localStorage["matches_on"] = matches_on;
    } else if ($(sokSwitch).parent().attr('id') === 'hearts') {
      if (!hearts_on) {
        FlurryAgent.logEvent("Settings: Admirers Notif On");
        $(sokSwitch).find('.animated').addClass('active');
        $(sokSwitch).find('.toggle-frame').css('background-color', '');
      } else {
        FlurryAgent.logEvent("Settings: Admirers Notif Off");
        $(sokSwitch).find('.animated').removeClass('active');
        $(sokSwitch).find('.toggle-frame').css('background-color', '#7f847c');
      }
      hearts_on = !hearts_on;
      localStorage["hearts_on"] = hearts_on;
    }

    if (!matches_on && !hearts_on) {
      FlurryAgent.logEvent("Settings: Accepted Notif Off");
    } else {
      FlurryAgent.logEvent("Settings: Accepted Notif On");
    }

  };

  var save = function() {
    var disabled_notification_types = new Array();
    if (localStorage["hearts_on"] !== "true") {
      disabled_notification_types.push('admire');
    }

    if (localStorage["matches_on"] !== "true") {
      disabled_notification_types.push('match');
    }
    var pushData = {
      task: 'setProfile',
      user_id: localStorage['user_id'],
      kik_id: localStorage['username'],
      format: 'json',
      disabled_notification_types: JSON.stringify(disabled_notification_types),
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

        } else {
          // TODO: handle server error
        }
      },
      error: function(xhr, type) {
//                $(page).text(type + xhr.responseText);
      }
    });
  };

  var destroy = function(page) {
    $(page).find(".side-page#menu").remove();

  };

  return {
    init: initialize
  }
}();