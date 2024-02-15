
var translated_subtitles = {};
var latest_subtitle_text = '';

function trans_when_change_subtitle(){
	
	try{
		
		var current_eng_subtitle_text_child = document.getElementsByClassName('glot-subtitles__sub__con')[0].childNodes;
		
		var current_subtitle_text = '';
		current_eng_subtitle_text_child.forEach((item) => {
			
			var eng_word = item.getAttribute('data-text');
			
			if(eng_word != null){
				current_subtitle_text = current_subtitle_text + ' ' + eng_word;
			}

		});
		
		current_subtitle_text = current_subtitle_text.trim();
		
		var trans_sub = translated_subtitles[current_subtitle_text];
		
		var trans_bar_child = document.getElementsByClassName('enl-whole-title-translation')[1].childNodes;
		if(trans_bar_child.length==3)
		{
			trans_bar_child[2].remove();
			trans_bar_child[0].remove();
		}
		
		var trans_sub_bar_element = document.querySelector('#ejoy > div:nth-child(4) > span');
		
		trans_sub_bar_element.class = 'add-auto-pause';
		
		trans_sub_bar_element.style.lineHeight = '1.5';
		trans_sub_bar_element.style.flexDirection = 'column';
		trans_sub_bar_element.style.fontSize = '22px';
		trans_sub_bar_element.style.color = 'rgb(106, 228, 255)';
		trans_sub_bar_element.style.background = 'rgba(17, 17, 17, 0.7)';
		trans_sub_bar_element.style.filter = '';
		
		if(trans_sub != null){

			
			if(trans_sub_bar_element.textContent != trans_sub){
				
				trans_sub_bar_element.textContent = trans_sub;
				trans_sub_bar_element.style.display = '';

			}

		}else{

			if(current_subtitle_text != null && current_subtitle_text.length > 0){

				if(current_subtitle_text != latest_subtitle_text){
					
					

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
	setTimeout(trans_when_change_subtitle, 10);
	
}

trans_when_change_subtitle();


///////////////////////////////

var server_ip = '192.168.0.49'

var webSocket = null;

var is_use_socket = false;

function set_wsk(){
	
	webSocket = new WebSocket('ws://' + server_ip + ':9990');
	
	webSocket.onclose = function(event) {
		onClose(event)
	};

	webSocket.onopen = function(event) {
		onOpen(event)
	};

	webSocket.onmessage = function(event) {
		onMessage(event)
	};
	
}

function onMessage(event) {
	if(!event.data.toString().includes('Could not read from Socket') && event.data.toString() != 'None'){
		try{
			var receive_json = JSON.parse(event.data);
			
			translated_subtitles[receive_json.msg] = receive_json.trans_msg;
			
			console.log(translated_subtitles[receive_json.msg]);
		}catch(err){
			console.log(err);
		}
	}
    is_use_socket = false;
}

function onOpen(event) {
	console.log('자막서버 연결 완료');
}

function onClose(event) {
	console.log('자막서버 접속 중');
	setTimeout(set_wsk, 1000)
}

function send(data) {
	
	if(!is_use_socket){
		is_use_socket = true;

		webSocket.send(JSON.stringify(data));
	}
}

set_wsk();