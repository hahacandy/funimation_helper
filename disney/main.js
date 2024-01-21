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



/////////////////////////////////  기본 함수들

var setCookie = function(name, value, exp) {
	var date = new Date();
	date.setTime(date.getTime() + exp*24*60*60);
	document.cookie = name + '=' + value + ';expires=' + date.toUTCString() + ';path=/';
};
var getCookie = function(name) {
	var value = document.cookie.match('(^|;) ?' + name + '=([^;]*)(;|$)');
	return value? value[2] : null;
};
function getElementByXpath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}



///////////vtt_url 가져오기
var vtt_url = null;

var link_used = [];

function get_vtt_url(){
	
	var performance = window.performance;
	var networks = performance.getEntries();

	for(i=networks.length-1; 0<=i; i--){

		var network = networks[i];
		
		if(network.name != null){
			
			var url = network['name'];

			if(url.includes('subtitles_') && url.includes('seg_') && url.slice(-4) == '.vtt'){
				
				var temp = url.split(0);
				
				if(temp.length > 7){
					
					var is_used = false;
					
					var current_token = temp[6];
					
					for(var i=0; i<link_used.length; i++){
						if(current_token == link_used[i]){
							is_used = true;
							break;
						}
					}
					
					if(is_used == false){
						link_used.push(current_token);
						vtt_url = url;
						//console.log(url);
						break;
					}

				}
				
			}
		}
	}
	
	if(vtt_url != null){
		get_subtitle();

	}else{
		setTimeout(get_vtt_url, 100);
	}

}
get_vtt_url();

////////vtt_url 에서 실제 자막 가져오기, 시작은 get_vtt_url() 에서 시작됨
var all_vtt = '';
var x = null;
var idx_ = 0;
var is_getting = false;


function get_subtitle(){
	
	var idx = idx_;
	
	if(is_getting == false){
		
		is_getting = true;
		
		var epi_str = '';
		
		idx2 = idx.toString();
		
		if(idx < 10){
			epi_str = '00' + idx2;
		}else if(idx < 100){
			epi_str = '0' + idx2;
		}else{
			epi_str = idx2;
		}

		var vtt_url2 = vtt_url.slice(0,vtt_url.length-7) + epi_str + '.vtt';
		
		console.log(vtt_url2);
		
		x = new XMLHttpRequest();
		x.open("GET", vtt_url2);
		x.send();
	}
	
	if(x.readyState == '4'){
		if(x.status == '200'){
			english_vtt = x.responseText;
			
			all_vtt = all_vtt + english_vtt

			idx_ ++
		}else if(x.status == '404'){
			idx_ = 999; // 자막 끝까지 가져왔으므로 정지
		}
		
		is_getting = false;
	}
		
	if(idx <= 100){
		setTimeout(get_subtitle, 100);
	}else{
		convert_vtt_to_cue();
	}

}

//////////////////가져온 vtt 가공하기
var vtt_cues = [];

function convert_vtt_to_cue(){
	
	var temp_split_vtt = all_vtt.split('\n\n');
	
	for(var i=0; i<temp_split_vtt.length; i++){
		if(temp_split_vtt[i].includes(' --> ') == true){
			
			var split_vt = temp_split_vtt[i].split('\n');
			
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
	}
	
	add_listener_move_subtitles_time();
}

//////////////////// 키보드 누르면 자막이동

function get_vide_time(mode, vid_current_time, vid_paused){
	
	var subtitle_1_el = document.querySelector('#subtitle-1');
	var current_sub_html = null;
	
	if(subtitle_1_el != null){
		current_sub_html = subtitle_1_el.innerHTML;
	}
	
	if(vid_paused==true)
		vid_current_time = vid_current_time-0.3;
	
	var move_time = null;
	
	var current_cue_cursor = null;
	
	for(i=0; i<vtt_cues.length; i++){
		
		if(vtt_cues[i].text == current_sub_html){
			current_cue_cursor = i;
		}
		
	}
	
	if(mode == 'right'){
		
		if(current_cue_cursor != null){
			var move_cursor = current_cue_cursor+1;
			if(move_cursor < vtt_cues.length){
				move_time = vtt_cues[move_cursor].start;
			}
		}else{
			for(i=0; i<vtt_cues.length; i++){
				if(vid_current_time < vtt_cues[i].start){
					move_time = vtt_cues[i].start;
					break;
				}
			}
		}


	}
	else if(mode == 'left'){
		
		if(current_cue_cursor != null){
			var move_cursor = current_cue_cursor-1;
			if(move_cursor >= 0){
				move_time = vtt_cues[move_cursor].start;
			}
		}else{
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
	}
	else if(mode == 'up'){
		
		if(current_cue_cursor != null){
			var move_cursor = current_cue_cursor;
			move_time = vtt_cues[move_cursor].start;
		}else{
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
	}

	//console.log(move_time);
	return move_time;
}

const video_event_listener = (e) => {
		
		var vid = document.getElementsByTagName('video')[0];
		
		var vid_current_time = vid.currentTime;
		
		var move_time = null;
		
		if (e.code == "Numpad4") {
			if(vtt_cues.length == 0){
				var preTime = vid.currentTime - 3;
				if (preTime > 0) {
					vid.currentTime = preTime;
				}
			}else{
				move_time = get_vide_time('left', vid_current_time, vid.paused);
			}
		}else if (e.code == "Numpad6") {
			if(vtt_cues.length == 0){
				var nextTime = vid.currentTime + 3;
				if (nextTime+3 < vid.duration) {
					vid.currentTime = nextTime;
				}
			}else{
				move_time = get_vide_time('right', vid_current_time, vid.paused);
			}
		}else if (e.code == "Numpad8") {
			cue_will_stop = true;
			move_time = get_vide_time('up', vid_current_time, vid.paused);
		}else if (e.code == "Numpad0" || e.code == "Numpad5") {
			
			//console.log(vid.paused);
			
			if(vid.paused){
				vid.play();
			}else{
				vid.pause();
			}

		}
		
		if(move_time != null){
			vid.currentTime = move_time;
			vid.play();
		}
			

		//console.log(move_time);
		//console.log(e);
		
	}


function add_listener_move_subtitles_time(){

	try{
		document.removeEventListener("keydown", video_event_listener);
	}catch{}
	document.addEventListener("keydown", video_event_listener);
	
}


//////// 원래 자막 지우기

function remove_ori_subtitle(){
	
	var ori_subtitle = getElementByXpath('/html/body/div[1]/div/div/div[2]/div/div/div[1]/div/div[1]');
	
	if(ori_subtitle != null){
		ori_subtitle.remove();
	}

}

setInterval(remove_ori_subtitle, 1000);

//////////// 자막 부분 생성


function create_subtitle(){
	
	var my_subtitles = document.querySelector('#subtitles');
	
	if(my_subtitles == null){
		
		var temp_ele = document.createElement('div');
		temp_ele.id = 'subtitles';
		var temp_ele2 = document.createElement('div');
		temp_ele2.id = 'subtitle-1';
		var temp_ele3 = document.createElement('div');
		temp_ele3.id = 'subtitle-2';
		
		temp_ele.appendChild(temp_ele2);
		temp_ele.appendChild(temp_ele3);
		
		document.querySelector('#app_body_content').appendChild(temp_ele);
		

		// 번역된 자막에 마우스 누르고 위아래 움직 일 수 잇게 하기
		
		my_subtitles = document.querySelector('#subtitles');
		my_subtitles.style.display = 'none';
		
		target_el = document.querySelector('#subtitle-2');
		

		my_subtitles.style.top = getCookie('subtitle_top'); // 이전 자막 위치 값 불러오기
		
		
		
		let lastX = 0;
		let lastY = 0; 
		let startX = 0; 
		let startY = 0; 
		
		target_el.addEventListener('mousedown', function(e){
		  //e.preventDefault(); 
		  startX = e.clientX; 
		  startY = e.clientY; 
			
		  target_el.classList.add('active');
		  
		  document.addEventListener('mouseup', onRemoveEvent); 
		  
		  document.addEventListener('mousemove', onMove); 
		});
		
		function onRemoveEvent() { 
		  target_el.classList.remove('active');
		  document.removeEventListener('mouseup', onRemoveEvent); 
		  document.removeEventListener('mousemove', onMove); 
		} 
		
		function onMove(e) { 
		  //e.preventDefault(); 

		  lastY = startY - e.clientY; 
		
		  startY = e.clientY; 
		  
		  var subtitle_top = (my_subtitles.offsetTop - lastY);
		  
		  if(subtitle_top >= 0 && subtitle_top < document.body.offsetHeight-150){
			  	
			  my_subtitles.style.top = (my_subtitles.offsetTop - lastY) + 'px';
			  
			  setCookie('subtitle_top', my_subtitles.style.top, 999);
		  	
		  }
		  
		}
		
		console.log('자막 부분 생성 완료');
		
	}
}




setInterval(create_subtitle, 1000);
/////////// 생성된 자막 부분에 영어 자막 시간에 맞게 

var cue_will_stop = false; // 한 문장이 끝나면 자동으로 멈추게 하기 위함

function change_subtitle_cue(){
	
	var video = document.querySelector("video");
	var is_not_null = false;
	
	var subtitle_1 = null;
	var subtitle_2 = '';
	var is_change = false;
	
	vtt_cues.forEach(function(vtt_cue) {
		
		video_current_time = video.currentTime;
		
		if(vtt_cue.start <= video_current_time && video_current_time < vtt_cue.end){
			
			if(document.querySelector('#subtitle-1').innerHTML != vtt_cue.text){
				
				subtitle_1 = vtt_cue.text;
				is_change = true;
				
			}

			is_not_null = true;
			
		}
		
	});
	
	if(is_not_null == false){
		
		subtitle_1 = '';
		is_change = true;
		
	}
	
	if(is_change == true){
		
		if(document.querySelector('#subtitle-1').innerHTML.length > 0){
			
			if(cue_will_stop == true){
				video.pause();
				cue_will_stop = false;
			}
		}
		
		if(video.paused == false){
			document.querySelector('#subtitle-1').innerHTML = subtitle_1 ;
			document.querySelector('#subtitle-2').innerHTML = subtitle_2 ;
			
			
			// 자막 객체 숨기거나 보이게, 백그라운드 색상이 안남기 위해서 1
			if(subtitle_1 == ''){
				document.querySelector('#subtitle-1').style.display = 'none';
			}else{
				document.querySelector('#subtitle-1').style.display = '';
			}
			
			if(subtitle_2 == ''){
				document.querySelector('#subtitle-2').style.display = 'none';
			}
			
			cue_will_stop = true;
		}

	}
	// 자막 객체 숨기거나 보이게, 백그라운드 색상이 안남기 위해서 2
	if(document.querySelector('#subtitle-1').innerHTML == '' && document.querySelector('#subtitle-2').innerHTML == ''){
		document.querySelector('#subtitles').style.display = 'none';
	}else{
		document.querySelector('#subtitles').style.display = '';
	}

	
}


//////// 비디오 객체에 timeupdate 리스너를 달고 여기다가 자막 바뀌는 함수를 쓰기위함
var next = false; // 다음 에피소드로 이동하면 초기화해줘야 할게 잇어서
function add_video_listener(){
	
	var video = document.querySelector("video");
	var subtitles_el = document.querySelector('#subtitles');
	
	
	if(video != null){
		if(video.className.includes('my_subtitles') == false){
			
			video.addEventListener("timeupdate", (event) => {
				change_subtitle_cue();
			});
			
			video.className = video.className + ' my_subtitles';
			console.log('비디오 객체 timeupdate 리스너 달기 완료');
			
		
			//다음 에피소드로 넘어가서 새로 가져와야할 때
			if(next== true){
				vtt_url = null;
				all_vtt = '';
				x = null;
				idx_ = 0;
				is_getting = false;
				vtt_cues = [];
				
				get_vtt_url();
			}
			next = true;
			
			//영상 보는 곳이 아닌 곳에서 돌아왓을 경우 다시 나타나게 함
			if(subtitles_el != null && subtitles_el.innerText.length > 0 && subtitles_el.style.display == 'none'){
				document.querySelector('#subtitles').style.display = '';
			}
			
		}
	}else{
		//영상 보는 곳이 아닐경우 자막이 띄어져잇으면 숨김
		if(subtitles_el != null){
			document.querySelector('#subtitles').style.display = 'none';
		}
	}
}

setInterval(add_video_listener, 1000);



////////////////////////////////영어 자막 번역하기 위함 (소켓)

var translated_subtitles = {};

var webSocket = new WebSocket('ws://192.168.0.49:9990');

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
			
			translated_subtitles[receive_json.msg] = receive_json.trans_msg;
			
			console.log(translated_subtitles[receive_json.msg]);
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

var latest_subtitle_text = '';

function check_change_subtitle_text(){
	
	try{
	
		var current_subtitle_text = document.querySelector('#subtitle-1').textContent;
		
		var trans_sub = translated_subtitles[current_subtitle_text];
		
		if(trans_sub != null){
			var trans_sub_bar_element = document.querySelector('#subtitle-2');
			
			if(trans_sub_bar_element.textContent != trans_sub){
				
				//trans_sub_bar_element.setAttribute('data-text', '');
				//trans_sub_bar_element.setAttribute('data-value', '');
				trans_sub_bar_element.textContent = trans_sub;
				trans_sub_bar_element.style.display = '';
				//console.log(trans_sub);
				
					

			}

		}else{

			if(current_subtitle_text != null && current_subtitle_text.length > 0){

				if(current_subtitle_text != latest_subtitle_text){
					
					
					trans_sub_bar_element = document.querySelector('#subtitle-2');
					//trans_sub_bar_element.setAttribute('data-text', '');
					//trans_sub_bar_element.setAttribute('data-value', '');
					trans_sub_bar_element.textContent = '';
					

					
					var data = new Object() ;
					data.msg = current_subtitle_text;
					
					send(data);
					
					console.log(current_subtitle_text);
				}

				latest_subtitle_text = current_subtitle_text;
				
			}
			
		}
		
	
	}catch{}
	
	setTimeout(check_change_subtitle_text, 10);
}

check_change_subtitle_text();