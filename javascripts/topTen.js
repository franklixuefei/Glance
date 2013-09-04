/* 
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */


var topTen = function() {
    var initialize = function(page) {
        $(page).find('img#download-sok').on('tap', function() {
            cards.open('https://itunes.apple.com/ca/app/jingu-friends-find-chat-or/id533165865?mt=8');
        });
        $(page).find('img#send-kik').on('tap', function() {
            cards.kik.send({
                title: 'Glance',
                text: 'Hey! Checkout Glance!',
                pic: "http://xuefei-frank.com/sok/images/app@2x.png", // optional
                big: true, // optional
                noForward: false, // optional
            });
        });
    };
    
    var destroy = function(page) {
        $(page).find('img#download-sok').off('tap');
        $(page).find('img#send-kik').off('tap');
    }
    
    return {
        init: initialize,
        destroy: destroy
    };
}();
