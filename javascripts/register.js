/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var register = function() {

  var initialize = function(page) {
    $(page).find('.sok-register').on('tap', function() {
      
//      if (cards.utils && cards.utils.platform) {
//        var os = cards.utils.platform.os;
//        if (os.android) {
//          if (os.version < 4) {
//            sok.utils.showGeneralDialog("Error", "Your Android version ("+ os.versionString +") is too low. Please update and try again.");
//            return;
//          }
//        } else if (os.ios) {
//          if (os.version < 5) {
//            sok.utils.showGeneralDialog("Error", "Your iOS version ("+ os.versionString +") is too low. Please update and try again.");
//            return;
//          }
//        } else {
//          sok.utils.showGeneralDialog("Error", "Sorry, but Glance currently only supports iOS and Android devices.");
//          return;
//        }
//      }
      
      if (!cards.kik || !cards.photo) {
        sok.utils.showGeneralDialog("Error", "Your Kik Messenger version is too low. Please update to the latest version and try again.");
        return;
      }
      
      cards.kik.getUser(function(user) {
        if (!user) {
          // user denied access to their information
          // TODO: handle this error
          return;
        }
        FlurryAgent.setUserId(user.username);
        App.load('intro', user, function() {
            App.removeFromStack();
        });
      });
    }).bind('touchstart', function() {
      $(this).addClass('button-pressed-green');
    }).bind('touchend', function() {
      $(this).removeClass('button-pressed-green');
    }).bind('touchmove', function() {
      $(this).removeClass('button-pressed-green');
      return false;
    });
    window.onload = function() {
      setTimeout(function() {
        dismissSplash(page);
      }, 2000);
    };

  };

  var destroy = function(page) {
    $(page).find('.sok-register').off('tap');
  };

  var dismissSplash = function(page) {
    $(page).find('.splash').addClass('dismiss');
    setTimeout(function() {
      $(page).find('.splash').remove();
    }, 210);
  };


  return {
    init: initialize,
    destroy: destroy
  };
}();