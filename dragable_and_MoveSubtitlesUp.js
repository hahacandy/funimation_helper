(function () {
    if (window.subvaAllowRightClick === undefined) {
        // https://greasyfork.org/en/scripts/23772-absolute-enable-right-click-copy/code
        window.subvaAllowRightClick = function (dom) {
            (function GetSelection() {
                var Style = dom.createElement('style');
                Style.type = 'text/css';
                var TextNode = '*{user-select:text!important;-webkit-user-select:text!important;}';
                if (Style.styleSheet) {
                    Style.styleSheet.cssText = TextNode;
                }
                else {
                    Style.appendChild(dom.createTextNode(TextNode));
                }
                dom.getElementsByTagName('head')[0].appendChild(Style);
            })();

        };
        function runAll(w) {
            try {
                window.subvaAllowRightClick(w.document);
            } catch (e) {
            }
            for (var i = 0; i < w.frames.length; i++) {
                runAll(w.frames[i]);
            }
        }
    }	
    runAll(window);
})();

setInterval(function() {
   document.querySelector('#vjs_video_3 > div.vjs-text-track-display').style.pointerEvents = 'auto';
   bar_clientHeight = document.querySelector('#vjs_video_3 > div.vjs-control-bar > div').clientHeight;
   document.querySelector('#vjs_video_3 > div.vjs-text-track-display > div > div > div').style.top = '-'+bar_clientHeight+'px';
   document.querySelector('#vjs_video_3 > div.vjs-text-track-display > div > div > div').style.display = '';
   
   
}, 1);