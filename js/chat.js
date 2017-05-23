
var connectedTo = [];

$(document).ready(function(){
	loginDialog();
});

function loginDialog(){

	$("#userDialog").dialog({
		autoOpen: false,
		width: "500px",
		closeOnEscape: false,
		modal: true,
		title: "Enter a username",
		buttons:[{
			text: "OK",
			click: function(){
				var name = $("#userNameField").val();
				if(name.length){
					$(this).dialog("close");
					userLoggedIn(name);
				}else{
					alert("Username is required");
				}
			}
		}]
	});

	var html = "<input id='userNameField'></input>";

	$("#userDialog").html(html);

	$("#userDialog").dialog("open");
}

function userLoggedIn(name){
	$("#header .loggedInAs").html("Logged in as: "+name);

	startUserVideo();

	//Using name as the id for now
	var peer = new Peer( name, {
		key: config.peerKey
	});

	//on open
	peer.on('open', function(id) {	  

	});

	//chat connect
	peer.on('connection', function(conn){

	});

	//answer a call
	peer.on('call', function(call) {
		answerCall(peer, call, connectedTo.indexOf(call.peer) < 0);
	});

	peer.on('error', function(err){
		console.log(peer, err, err.type);
		switch(err.type){
			case "peer-unavailable":
				alert("The peer was unavailable or does not exist.");
				break;
			case "unavailable-id":
				alert("This username is already in use");
				break;
			default: 
				console.log(err);
				alert("Fatal Error: "+err.type);
				break;
		}
	});

	//Connect to user
	$("#submitDestUser").on("click", function(){
		var dest = $("#destUser").val();
		if(dest.length == 0){
			alert("User needs a name");
		}else{
			//Open chat connection
			var conn = peer.connect(name);
			conn.on('open', function() {

				//Text chat
				/*conn.on('data', function(data) {
			    	console.log('Received', data);
			  	});

			  	// Send messages
			  	conn.send('Hello!');*/

			});
		
			//Call them
			callUser(peer, dest);
		}
	});
}

function startUserVideo(){
	navigator.getUserMedia = navigator.getUserMedia ||
		navigator.webkitGetUserMedia ||
		navigator.mozGetUserMedia;

	//Start own video
	if (navigator.getUserMedia) {
		navigator.getUserMedia({ audio: true, video: { width: 400, height: 400 } },
  			function(stream) {
     			var video = $('#myVideo')[0];
     			video.srcObject = stream;
     			video.onloadedmetadata = function(e) {
       				video.play();
     			};
     			$(".videoLabel[data-video='myVideo']").html("Your Video");
  			},
			function(err) {
				console.log("The following error occurred: " + err.name);
			}
		);
	} else {
	   console.log("getUserMedia not supported");
	}
}


/*Uses peer to call name, returns true if not already connected to them*/
function callUser(peer, name){
	if(connectedTo.indexOf(name) < 0){
		if(navigator.getUserMedia){
			navigator.getUserMedia({ audio: true, video: { width: 400, height: 400 } },
					function(stream) {
						var call = peer.call(name, stream);
						connectedTo.push(name);
					},
				function(err) {
					console.log("The following error occurred: " + err.name);
				}
			);
		}
		return true;
	}else{
		return false;
	}
}

function answerCall(peer, call, received){
	if(!received){
		if(navigator.getUserMedia){
 			navigator.getUserMedia({ audio: true, video: { width: 400, height: 400 } },
	  			function(stream) {
	  				call.answer(stream);
	  			},
				function(err) {
					console.log("The following error occurred: " + err.name);
				}
			);	
		}

		//Gets other stream
		call.on('stream', function(stream) {
			var video = $('#theirVideo')[0];
 			video.srcObject = stream;
 			video.onloadedmetadata = function(e) {
   				video.play();
 			};

 			disconnectButton(call);

 			//give your video back
 			callUser(peer, call.peer);

		});

	}else{
		$("#answerCallDialog").dialog({
			autoOpen: false,
			width: "300px",
			title: "Receiving a call from "+call.peer,
			buttons:[]
		});

		var html = "<button class='acceptCall'>Accept</button><button class='declineCall'>Decline</button>"	

		$("#answerCallDialog").html(html);

		$("#answerCallDialog .acceptCall").on("click", function(){
			if(navigator.getUserMedia){
	 			navigator.getUserMedia({ audio: true, video: { width: 400, height: 400 } },
		  			function(stream) {
		  				call.answer(stream);
		  			},
					function(err) {
						console.log("The following error occurred: " + err.name);
					}
				);	
			}

			//Gets other stream
			call.on('stream', function(stream) {
				var video = $('#theirVideo')[0];
	 			video.srcObject = stream;
	 			video.onloadedmetadata = function(e) {
	   				video.play();
	 			};

	 			disconnectButton(call);

	 			//give your video back
	 			callUser(peer, call.peer);

			});

			$("#answerCallDialog").dialog("close");
		});

		$("#answerCallDialog .declineCall").on("click", function(){
			//Might need to send back a reject message here

			$("#answerCallDialog").dialog("close");
		});

		$("#answerCallDialog").dialog("open");
	}

	call.on('close', function(){
		$("#disconnectButton").hide();
	});


}

function disconnectButton(call){
	$("#disconnectButton").show();
	$("#disconnectButton").off("click");
	$("#disconnectButton").on("click", function(){
		call.close();
		//if firefox, need to handle close event here
	});
}