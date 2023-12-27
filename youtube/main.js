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

function check_change_subtitle_text(){
	
	try{
	
		var lin_words = document.querySelector('.lln-subs.lln-sentence-wrap').querySelectorAll(".lln-word,.lln-not-word  ");
		var extraction_words = [];
		for(var i = 0; i<lin_words.length; i++){
			
			var word = '';
			if(lin_words[i].childElementCount>=1){
				word = lin_words[i].childNodes[1].textContent;
			}else{
				word = lin_words[i].textContent;
			}
			
			extraction_words.push(word);
		
		}
		var current_subtitle_text = extraction_words.join('');
		
		var trans_sub = translated_subtitles[current_subtitle_text];
		
		if(trans_sub != null){
			var trans_sub_bar_element = document.querySelector('#lln-translations > div.lln-whole-title-translation-wrap > div > span');
			
			if(trans_sub_bar_element.textContent != trans_sub){
				trans_sub_bar_element.style.maxWidth = '';
				trans_sub_bar_element.textContent = trans_sub;
				console.log(trans_sub);
				
				//한글 번역된 자막에 블러를 넣고, 마우스를 위에 올리면 선명하게 보이게
				document.querySelector('#lln-translations > div.lln-whole-title-translation-wrap > div > span').style.filter='blur(4px)';
				document.querySelector('#lln-translations > div.lln-whole-title-translation-wrap > div').onmouseout = function (event) {
					document.querySelector('#lln-translations > div.lln-whole-title-translation-wrap > div > span').style.filter='blur(4px)';
				}
				document.querySelector('#lln-translations > div.lln-whole-title-translation-wrap > div').onmouseover = function (event) {
					document.querySelector('#lln-translations > div.lln-whole-title-translation-wrap > div > span').style.filter='blur(0px)';
				}
				
				
			}

		}else{
			
			if(current_subtitle_text != null && current_subtitle_text.length > 0){
				
				if(current_subtitle_text != latest_subtitle_text){
					
					document.querySelector('#lln-translations > div.lln-whole-title-translation-wrap > div > span').textContent = '';
					
					var data = new Object() ;
					data.msg = current_subtitle_text;
					
					send(data);
					
					console.log(current_subtitle_text);
				}
				
				latest_subtitle_text = current_subtitle_text;
				
			}
			
		}
		
	
	}catch{}
	
	setTimeout(check_change_subtitle_text, 1);
}

check_change_subtitle_text();