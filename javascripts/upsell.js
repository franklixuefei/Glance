/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var upsell = function() {

  var password_length_max = 0;

  var password_length_min = 0;

  var orig_text = "";

  var ios_app_url = "";

  var initialize = function(page) {

    password_length_max = 20;
    password_length_min = 6;
    orig_text = $(page).find('.password-title').text();
    ios_app_url = "http://bit.ly/get-sok";

    $(page).on('swipeRight', function() {
      $(page).find('input').blur();
      App.back();
    });

    function handleBackButton() {
      // called when back button is pressed
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

    $(page).find('.upsell-password').bind('focus', function() {
//            setTimeout(function() {
//                window.scrollTo(0, document.body.scrollHeight);
//            }, 200);
      setTimeout(function() {
        toggleInput(page, true);
      }, 300);

    });

    $(page).find('.download').on('tap', function() {
      var plain_text_password = $(page).find('input#password').val();
      var plain_text_password_confirmation = $(page).find('input#password-conf').val();

      if (!passwordValidation(page, plain_text_password, plain_text_password_confirmation))
        return false;

      changeState(page, true);
      var pushData = {
        task: 'setPassword',
        format: 'json',
        kik_id: localStorage["username"],
        plain_text_password: plain_text_password
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
            // TODO: go to app page
            changeState(page, false);
            App.back();
            cards.open(ios_app_url);
          } else {
            changeState(page, false);
            showErrorMessage(page, "Something wrong. Please try again.");
          }
        },
        error: function(xhr, type) {
          changeState(page, false);
          showErrorMessage(page, "Server error.");
        }
      });
    }).bind('touchstart', function() {
      $(this).addClass('button-pressed-green');
    }).bind('touchend', function() {
      $(this).removeClass('button-pressed-green');
    }).bind('touchmove', function() {
      $(this).removeClass('button-pressed-green');
      return false;
    });


  };

  var changeState = function(page, loading) {
    if (loading) {
      $(page).find('.password-title').css('color', '#7db917').text("Saving your account information...");
      $(page).find('.upsell-password-container').append($('<img>').attr('class', 'processing').attr('src', 'images/loader.gif'));
      $(page).find('.download').hide();
    } else {
      $(page).find('.password-title').css('color', '').text(orig_text);
      $(page).find('.processing').remove();
      $(page).find('.download').show();
    }
  }

  var showErrorMessage = function(page, text) {

    $(page).find('.password-title').css('color', 'red').text(text);
    setTimeout(function() {
      $(page).find('.password-title').css('color', '').text(orig_text);
    }, 2000);
  };

  var passwordValidation = function(page, password, password_conf) {
    if (password === "") {
      showErrorMessage(page, "Password cannot be empty.");
    } else if (password.length < password_length_min || password.length > password_length_max) {
      showErrorMessage(page, "Length of password must between 6 and 20");
    } else if (password !== password_conf) {
      showErrorMessage(page, "Password confirmation does not match.");
    } else {
      return true;
    }
    return false;
  };

  var toggleInput = function(page, toggle) {
    if (toggle) {
      $(page).find('.upsell-password-container').addClass('active');
      $(page).find('.upsell-description-container').removeClass('deactive').addClass('active');
    } else {
      $(page).find('.upsell-password-container').removeClass('active');
      $(page).find('.upsell-description-container').removeClass('active').addClass('deactive');
    }
  };


  return {
    init: initialize
  }
}();