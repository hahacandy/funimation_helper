var translated_subtitles = {};

////////////////////////////////영어 자막 번역하기 위함 (소켓)

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

function getElementByXpath(path) {
  return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function check_change_subtitle_text(){
	
	try{
	
		var current_subtitle_text = getElementByXpath('/html/body/div[1]/div/div/div[7]/div/div[1]/div').textContent;
		
		var trans_sub = translated_subtitles[current_subtitle_text];
		
		if(trans_sub != null){
			var trans_sub_bar_element = getElementByXpath('//*[@id="app_body_content"]/div[7]/div/div[2]/div/div/div[1]/span/span[1]');
			
			if(trans_sub_bar_element.textContent != trans_sub){
				
				trans_sub_bar_element.setAttribute('data-text', '');
				trans_sub_bar_element.setAttribute('data-value', '');
				trans_sub_bar_element.textContent = trans_sub;
				console.log(trans_sub);

			}

		}else{

			if(current_subtitle_text != null && current_subtitle_text.length > 0){

				if(current_subtitle_text != latest_subtitle_text){
					
					
					trans_sub_bar_element = getElementByXpath('//*[@id="app_body_content"]/div[7]/div/div[2]/div/div/div[1]/span/span[1]');
					trans_sub_bar_element.setAttribute('data-text', '');
					trans_sub_bar_element.setAttribute('data-value', '');
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



///////////vtt_url 가져오기
var vtt_url = null;

function get_vtt_url(){

	var performance = window.performance;
	var networks = performance.getEntries();

	for(i=0; i<networks.length; i++){

		var network = networks[i];
		
		if(network.name != null){
			
			var url = network['name'];

			if(url.includes('subtitles_') && url.includes('seg_') && url.slice(-4) == '.vtt'){
				vtt_url = network['name'];
				console.log(url);
				break;
			}
		}
	}
	
	if(vtt_url == null){
		setTimeout(get_vtt_url, 100);
	}else{
		get_subtitle();
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

function add_listener_move_subtitles_time(){
	//const target = document.querySelector('#hudson-wrapper');
	
	document.addEventListener("keydown", (e) => {
		
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
				move_time = get_vide_time('left', vid_current_time);
			}
		}else if (e.code == "Numpad6") {
			if(vtt_cues.length == 0){
				var nextTime = vid.currentTime + 3;
				if (nextTime+3 < vid.duration) {
					vid.currentTime = nextTime;
				}
			}else{
				move_time = get_vide_time('right', vid_current_time);
			}
		}else if (e.code == "Numpad8") {
			move_time = get_vide_time('up', vid_current_time);
		}else if (e.code == "Numpad0") {
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
		
	});

}


//////// 원래 자막 지우기

function remove_ori_subtitle(){
	
	var ori_subtitle = getElementByXpath('/html/body/div[1]/div/div/div[2]/div/div/div[1]/div/div[1]');
	
	if(ori_subtitle == null){
		setTimeout(remove_ori_subtitle, 1000);
		
	}
	else{
		ori_subtitle.remove();
	}
	
}

setTimeout(remove_ori_subtitle, 1000);