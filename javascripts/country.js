var country = function() {

    var init = function(page) {
        this.countryArray = getList(page);
        registerListenerForSearchEvent(page);
    };

    var registerListenerForSearchEvent = function(page) {

        $(page).find('input#search_input').on('input', function() {
            var pat = $(this).val();
            setTimeout(function() {
                $(page).find('.app-list').children().each(function() {
                    if ($(this).text().substr(0, pat.length).toLowerCase() === pat.toLowerCase() ||
                            $(this).data('cca2').substr(0, pat.length).toLowerCase() == pat.toLowerCase() ||
                            $(this).data('cca3').substr(0, pat.length).toLowerCase() === pat.toLowerCase()) {
                        if ($(this).css('display') === 'none')
                            $(this).show();
                    } else {

                        if ($(this).css('display') !== 'none')
                            $(this).hide();
                    }
                });
            }, 0);


        });
    };

    var getList = function(page) {
        $.getJSON('countries.json', function(data) {
            generateList(page, data);
        });
    };

    var generateList = function(page, list) {
        for (var i = 0; i < list.length; ++i) {
            var entry = generateEntry(list[i], page);
            $(page).find('.app-list').append(entry);
        }
    };
    
    var generateEntry = function(item, page) {
        var entry = $('<li class="app-button hidden"  data-clickable-class="active" style="-webkit-tap-highlight-color: rgba(255, 255, 255, 0);">' + item.name + '</li>');
        $(entry).data('cca2', item.cca2);
        $(entry).data('cca3', item.cca3);
        $(entry).on('touchstart', function() {
            $(this).addClass('active');
        }).on('touchend', function() {
            $(this).removeClass('active');
        }).on('touchmove', function() {
            $(this).removeClass('active');
        }).on('tap', function() {
            $(page).find('input#search_input').blur();

            // TODO: get parameters related to this country and pass them into imageviewer.
            $(page).find('.side-page#menu').remove();
            var params = {};
            App.load('matchGame', params, function() {
                menu.prepare($(App.getPage()));
            });
        });
        return entry;
    };

    return {
        init: init
    };
}();