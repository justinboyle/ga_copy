var _gaq = _gaq || [];
_gaq.push(['_setAccount', 'UA-15588855-4']);
_gaq.push(['_setSessionCookieTimeout', 0]);
_gaq.push(['_trackPageview']);
(function() {
 var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
 ga.src = 'https://ssl.google-analytics.com/ga.js';
 var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
 })();
(function() {
 var po = document.createElement('script'); po.type = 'text/javascript'; po.async = true;
 po.src = 'https://apis.google.com/js/plusone.js';
 var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(po, s);
 })();

DEBUG = true;
VERSION = '1';

function log() {
    if (DEBUG) console.log(arguments);
}


function warn(text) {
    $('#warn').text(text).show();
    setTimeout(function() {
        $('#warn').text('').hide();
    }, 4000);
}

function _handle_response(response) {
    try {
        if (response.error) {
            if (response.error_message) {
                warn(response.error_message);
            }else {
                warn('Error while performing this action.');
            }
            throw reponse.error_message || 'Unknown Error when performing action';
        }
        if (response.action === 'check') {
            $('#copy_but').prop('disabled', !response.data);
            return true;
        }
        if (response.action === 'copy') {
            var id = response.type + '_' + response.data.name;
            id = id.replace(/\s+/g, '-');
            localStorage[id] = JSON.stringify(response);

            _gaq.push(['_trackEvent', 'Copy', response.type, response.variation]);

            init_popup();
            
            // Pulse
            $('#'+id).parent().hide().fadeIn(300);
            
            return true;
        }
        throw "Unknown response type";
    }catch (e) {
        gaException(e);
        return false;
    }
}

function send_action(action, data) {
    var req = {
        'action': action,
        'obj': data
    };
    chrome.tabs.getSelected(null, function(tab) {
        chrome.tabs.sendRequest(tab.id, req, _handle_response);
    });
}

$(document).ready(function() {
    try {
        init_popup();
        send_action('check');
        $('#copy_but').click(function() {
            send_action('copy');
        });
        var data;
        $('.paste').live('click', function() {
            data = localStorage[$(this).attr('id')];
            if (data) {
                data = JSON.parse(data);
                _gaq.push(['_trackEvent', 'Paste', data.type, data.variation]);
                send_action('paste', data);
            }else {
                log('Rule not found');
                return false;
            }
        });

        /*
        $('#clear_all').click(function(){
            var msg = 'Are you sure you want to remove all copied goals and filters?'
            if(confirm(msg)){
                localStorage.clear();
                $('#goal_list,#filter_list').empty();
            }

        });
        */

        $('.clear').live('click', function() {
            var el = $(this).parent().find('.paste');
            localStorage.removeItem(el.attr('id'));
            _gaq.push(['_trackEvent', 'Clear', el.attr('id').split('_')[0]]);
            init_popup();
        });
    }catch (e) {
        gaException(e);
    }
});

function init_popup() {
    $('ul').empty();
    $('p').show();
    var id, t, n;
    for (id in localStorage) {
        n = JSON.parse(localStorage[id]).data.name;
        if (id.indexOf('goal_') === 0 ||
            id.indexOf('filter_') === 0
        ) {
            t = id.split('_');
            if ($('#' + id).length == 0) {
                var el = $('<span/>', {
                    'id': id,
                    'class': 'paste',
                    'title': n
                });
                el.text(n);
                //el.addClass(t[1]); //spaces dont play nice
                var li = $('<li/>');
                el.appendTo(li);
                $('<span/>', {
                    'class': 'clear',
                    'title': 'Clear'
                }).appendTo(li);
                li.appendTo('#' + t[0] + '_list');
                $('#' + t[0] + 's p').hide();
            }
        }
    }
}

function gaException(e) {
    _gaq.push(['_trackEvent',
        'Exception ' + (e.name || 'Error'),
        e.message
    ]);
}
