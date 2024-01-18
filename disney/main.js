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
	
		var current_subtitle_text = getElementByXpath('//*[@id="app_body_content"]/div[7]/div/div[1]/div/div/div[1]/span/span[1]').textContent;
		
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