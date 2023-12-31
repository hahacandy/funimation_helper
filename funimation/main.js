/////////////////////////////// 드래그 가능하게
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

///////////////////// 자막이 재생바 위로오게

setInterval(function() {
	try{
	   document.querySelector('#vjs_video_3 > div.vjs-text-track-display').style.pointerEvents = 'auto';
	   bar_clientHeight = document.querySelector('#vjs_video_3 > div.vjs-control-bar > div').clientHeight;
	   document.querySelector('#vjs_video_3 > div.vjs-text-track-display > div > div > div').style.top = '-'+bar_clientHeight+'px';
	   document.querySelector('#vjs_video_3 > div.vjs-text-track-display > div > div > div').style.display = '';
	}catch{}
   
   
}, 10);

///////////////////////////////////vtt 자막 파일을 읽어서 변수에 저장하기

var x = new XMLHttpRequest();
var english_vtt = '';

function get_sub_url(){

	var performance = window.performance;
	var networks = performance.getEntries();

	var vtt_url = null;

	for(i=0; i<networks.length; i++){

		var network = networks[i];
		
		if(network.name != null){
			
			var url = network['name'];

			if(url.includes('out.key')){
				vtt_url = url.substr(0,url.indexOf('out.key'))+'_english_CC.vtt';
				break
			}
			
		}
		
	}
	
	if(vtt_url != null && vtt_url != '_english_CC.vtt'){
		console.log(vtt_url);
		return vtt_url;
	}else{
		return null;
	}

}

function get_url_page(){

    if(x.readyState == '4'){
	
		english_vtt = x.responseText;
		
		main3();
		
	}else{
		setTimeout(get_url_page, 100);
	}

}

function main2(){
	var vtt_url = get_sub_url();
	if(vtt_url !=null ){
		x.open("GET", vtt_url);
		x.send();
		get_url_page();
	}else{
		setTimeout(main2, 100);
	}
}


main2();




//////////////////////////////////// 변수에 저장된 자막 파일을 cue 리스트에 배열에 넣기

var vtt_cues = [];

function main3(){
	
	var split_vtt = null;
	split_vtt = english_vtt.split('\n\n');
	for(i=1;i<split_vtt.length;i++){
		
		var split_vt = split_vtt[i].split('\n');
		
		var vtt_cue = new Object();
		var text_cue = '';
		
		for(j=0; j<split_vt.length; j++){
			
			if(j==0){
				split_v = split_vt[j].split(' ');
				
				vtt_cue.start = split_v[0];
				var start_split = vtt_cue.start.split(':');
				vtt_cue.start = parseFloat((start_split[0]*60*60))+parseFloat((start_split[1]*60))+parseFloat(start_split[2]);
				
				vtt_cue.end = split_v[2];
				var end_split = vtt_cue.end.split(':');
				vtt_cue.end = parseFloat((end_split[0]*60*60))+parseFloat((end_split[1]*60))+parseFloat(end_split[2]);
			}else{
				
				text_cue = text_cue + split_vt[j];
				
				if(j != split_vt.length-1){
					text_cue = text_cue + '\n';
				}
				
			}
		}
		
		vtt_cue.text = text_cue;
		
		vtt_cues.push(vtt_cue);
		
	}
	
	main4()
}


////////////////////////// 비디오 키 다운 리스너를 없애고(아직 방법 못찾음)

function main4(){
	
	//var target = document.querySelector('#vjs_video_3');
	//var listenerList = getEventListeners(target);
	//target.removeEventListener('keydown', listenerList.keydown[0].listener);
	
	main5();
}

//////////////////// 키보드 누르면 자막이동

function get_vide_time(mode, vid_current_time){
	
	var move_time = null;
	
	if(mode == 'right'){
		for(i=0; i<vtt_cues.length; i++){
			if(vid_current_time < vtt_cues[i].start){
				move_time = vtt_cues[i].start;
				break;
			}
		}
	}
	else if(mode == 'left'){
		
		for(i=vtt_cues.length-1; i>=0; i--){

			if(vid_current_time > vtt_cues[i].start){
				
				var cue_cursor = i-1;
				if(cue_cursor >= 0){
					move_time = vtt_cues[cue_cursor].start;
				}
				break;
			}
		}
	}
	else if(mode == 'up'){
		
		for(i=0; i<vtt_cues.length; i++){
			
			if(vid_current_time < vtt_cues[i].start){
				
				var cue_cursor = i-1;
				if(cue_cursor >= 0){
					move_time = vtt_cues[cue_cursor].start;
				}
				break;
			}
		}
	}

	//console.log(move_time);
	return move_time;
}

function main5(){
	const target = document.querySelector('#vjs_video_3');
	
	target.addEventListener("keydown", (e) => {
	
		var vid = document.getElementsByTagName('video')[0];
		
		var vid_current_time = vid.currentTime;
		
		var move_time = null;
		
		if (e.code == "KeyA") {
			if(vtt_cues.length == 0){
				var preTime = vid.currentTime - 3;
				if (preTime > 0) {
					vid.currentTime = preTime;
				}
			}else{
				move_time = get_vide_time('left', vid_current_time);
			}
		} else if (e.code == "KeyD") {
			if(vtt_cues.length == 0){
				var nextTime = vid.currentTime + 3;
				if (nextTime+3 < vid.duration) {
					vid.currentTime = nextTime;
				}
			}else{
				move_time = get_vide_time('right', vid_current_time);
			}
		} else if (e.code == "KeyW") {
			move_time = get_vide_time('up', vid_current_time);
		}
		
		if(move_time != null){
			vid.currentTime = move_time;
			vid.play();
		}
			

		//console.log(move_time);
		//console.log(e);
		
	});

	main6();
		
}

//////////////////////// 영상 마우스로 클릭하면 멈춤 재생
//document.querySelector('#vjs_video_3 > div.vjs-text-track-display').style.pointerEvents = 'auto';
//을 사용한 탓에 ui가 이상해졌기 때문


function main6(){
	
	var vid = document.getElementsByTagName('video')[0];
	var text_all_display = document.querySelector('#vjs_video_3 > div.vjs-text-track-display');
	
	text_all_display.addEventListener("mouseup", (event) => {
		
		if(event.srcElement.style.position != 'relative'){ // 실제로 자막 나오는 구간은 클릭해도 작동안하게
			if(vid.paused){
				vid.play();
			}else{
				vid.pause();
			}
		}

	});

	main7();

}

/////////////////한 자막이 끝나면 끝나는 시점에서 정지

var cue_cursor = -1;

function pause_vid_when_end(){
	
	var vid = document.getElementsByTagName('video')[0];
	
	if(vid.paused == false){
		for(i=0; i<vtt_cues.length; i++){
			
			if(vid.currentTime > vtt_cues[i].start && vid.currentTime <= vtt_cues[i].end){
				
				cue_cursor = i;
				
				var vid_current_time = vid.currentTime.toFixed(3);
				var cue_current_time = vtt_cues[i].end.toFixed(3);
				
				//console.log(vid_current_time + ' ' + cue_current_time);
				if(vid_current_time >= cue_current_time-0.02){
					
					vid.pause();
				}
				break;
			}
			
		}
	}

	setTimeout(pause_vid_when_end, 1);
}

function main7(){
	var vid = document.getElementsByTagName('video')[0];
	
	setTimeout(pause_vid_when_end, 1);

	main8();
}

////////////////////////////////영어 자막 번역하기 위함 (소켓)

var webSocket = new WebSocket('ws://192.168.0.49:9990');

var translated_subtitles = {};

webSocket.onerror = function(event) {
	onError(event)
};

webSocket.onopen = function(event) {
	onOpen(event)
};

webSocket.onmessage = function(event) {
	onMessage(event)
};

function onMessage(event) {
	if(!event.data.toString().includes('Could not read from Socket') && event.data.toString() != 'None'){
		try{
			var receive_json = JSON.parse(event.data);
			
			translated_subtitles[receive_json.cursor] = receive_json.trans_msg;
		}catch(err){
			console.log(err);
		}

		
		//console.log(event.data);
	}
}

function onOpen(event) {
	console.log('Connection established');
}

function onError(event) {
	console.log(event.data);
}

function send(data) {
	
	webSocket.send(JSON.stringify(data));

}

////////////////////////////////영어 자막 번역하기 위함 (cue가 바뀌면 자막이 바꼇다고 보고 영어 자막을 보냄)

var latest_cue_cursor = -1;

function check_change_cue(){
	
	if(cue_cursor != -1){
		
		if(cue_cursor != latest_cue_cursor){
			
			if((cue_cursor in translated_subtitles) == false){
				
				try{
					
					var data = new Object() ;
					data.msg = vtt_cues[cue_cursor].text;
					data.cursor = cue_cursor;
					
					send(data);
					
					latest_cue_cursor = cue_cursor;
					
				}catch(err){
					console.log(err);
				}
				
			}

		}

	}
	
	setTimeout(check_change_cue, 100);
}

function check_change_trans_sub(){
	
	if(cue_cursor != -1){
	
		var sub_bar = document.querySelector('#vjs_video_3 > div.vjs-text-track-display > div > div > div');
		
		if(sub_bar != null){
			var trans_sub = translated_subtitles[cue_cursor];
			
			if(trans_sub!=null){
				var engsub_and_transub = vtt_cues[cue_cursor].text + '\n' + trans_sub;
				if(sub_bar.textContent != engsub_and_transub){
					sub_bar.textContent = engsub_and_transub;
				}
			}

		}
		
	}
	
	setTimeout(check_change_trans_sub, 100);
}


function main8(){
	setTimeout(check_change_cue, 100);
	setTimeout(check_change_trans_sub, 100);
}