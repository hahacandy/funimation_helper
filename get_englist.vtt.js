var x = new XMLHttpRequest();
var english_vtt = '';

function get_sub_url(){

	var performance = window.performance;
	var networks = performance.getEntries();

	var vtt_url = null;

	for(i=0; i<networks.length-1; i++){

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