var tm = tm || {};

tm.loggedInUsername = "";

tm.initialize = function() {
	tm.loggedInUsername = $("span#username").text()
};

tm.updateNavbar = function() {
	if (tm.loggedInUsername == "") {
		$("a#navbar-link1").attr({
			"data-toggle":"modal",
			"data-target":"#loginModal"
		});
		$("a#navbar-link1").text("Login");
		
		$("a#navbar-link2").attr({
			"data-toggle":"modal",
			"data-target":"#signupModal"
		});
		$("a#navbar-link2").text("Signup");
	} else {
		$("a#navbar-link1").text(tm.loggedInUsername);
		$("a#navbar-link2").attr({
			"data-toggle":"modal",
			"data-target":"#logoutModal"
		});
		$("a#navbar-link2").text("logout");
	};
};

tm.loginModalEventHandler = function() {
	$("#loginModal").on("shown.bs.modal", function(){
		$('#loginForm #inputUsername').focus();
	});
};

tm.signupModalEventHandler = function() {
	$("#signupModal").on("shown.bs.modal", function(){
		$('#signupForm #inputUsername').focus();
	});
};

tm.requestModalEventHandler = function() {
	$("#requestModal").on("shown.bs.modal", function(){
		$('#requestForm #inputOriginAddress').focus();
	});
};

tm.offerModalEventHandler = function() {
	$("#offerModal").on("shown.bs.modal", function(){
		$('#offerForm #inputOriginAddress').focus();
	});
};




tm.login = function() {
	$("#loginForm #loginBtn").click(function () {
		
		var inputUsername = $("#loginForm #inputUsername").val();
		var inputPassword = $("#loginForm #inputPassword").val();
		dict = {"username": inputUsername, "password": inputPassword};

		$.post( "/login", dict ).done(function( json ) {
			console.log("Response JSON: " + JSON.stringify(json));
			if (json.logged_in == true) {
				tm.loggedInUsername = json.username;
				$("#loginModal").modal('hide');
				tm.updateNavbar();
				//window.location = "/";
			} else {
				$("#loginForm #inputUsername").attr('data-content','Invalid Login!');
				$("#loginForm #inputUsername").popover('show');
				$("#loginForm #inputUsername").val("");
				$("#loginForm #inputPassword").val("");
			};
		}).fail(function(jqxhr, textStatus, error) {
			console.log("POST Request Failed: " + textStatus + ", " + error);
		});
	});
}

tm.signup = function() {
	$("#signupBtn").click(function(){
		
		var inputUsername = $("#signupForm #inputUsername").val();
		var inputPassword = $("#signupForm #inputPassword").val();
		var inputVerifyPassword = $("#signupForm #inputVerifyPassword").val();
		var inputEmail = $("#signupForm #inputEmail").val();

		dict = {"username": inputUsername,
				"password": inputPassword,
				"verify" : inputVerifyPassword,
				"email" : inputEmail};

		$.post( "/signup", dict ).done(function( json ) {
			console.log("Response JSON: " + JSON.stringify(json));
			if (json.signed_up == true) {
				tm.loggedInUsername = json.username;
				$("#signupModal").modal('hide');
				tm.updateNavbar();
				//window.location = "/";
			} else {
				if ($.inArray("username_val", json.errors) != -1){
					$("#signupForm #inputUsername").attr('data-content','Invalid Username!');
					$("#signupForm #inputUsername").popover('show');
					$("#signupForm #inputUsername").val("");	
				};
				if ($.inArray("username_exst", json.errors) != -1){
					$("#signupForm #inputUsername").attr('data-content','Already Exists!');
					$("#signupForm #inputUsername").popover('show');
					$("#signupForm #inputUsername").val("");	
				};
				if ($.inArray("username_exst", json.errors) == -1 && $.inArray("username_val", json.errors) == -1){
					$("#signupForm #inputUsername").popover('hide');
				};
				if ($.inArray("password", json.errors) != -1){
					$("#signupForm #inputPassword").attr('data-content','Invalid Password!');
					$("#signupForm #inputPassword").popover('show');	
				} else {
					$("#signupForm #inputPassword").popover('hide');
				};
				if ($.inArray("verify", json.errors) != -1){
					$("#signupForm #inputVerifyPassword").attr('data-content','Did Not Match!');
					$("#signupForm #inputVerifyPassword").popover('show');	
				} else {
					$("#signupForm #inputVerifyPassword").popover('hide');
				}
				if ($.inArray("email_val", json.errors) != -1){
					$("#signupForm #inputEmail").attr('data-content','Invalid Email!');
					$("#signupForm #inputEmail").popover('show');
					$("#signupForm #inputEmail").val("");	
				};
				if ($.inArray("email_exst", json.errors) != -1){
					$("#signupForm #inputEmail").attr('data-content','Already Exists!');
					$("#signupForm #inputEmail").popover('show');
					$("#signupForm #inputEmail").val("");
				};
				if ($.inArray("email_exst", json.errors) == -1 && $.inArray("email_val", json.errors) == -1){
					$("#signupForm #inputEmail").popover('hide');
				};

				$("#signupForm #inputPassword").val("");
				$("#signupForm #inputVerifyPassword").val("");

			};
		}).fail(function(jqxhr, textStatus, error) {
			console.log("POST Request Failed: " + textStatus + ", " + error);
		});		
	})
};


tm.logout = function() {
	$("#logoutBtn").click(function () {
		$.post("/logout").done(function( json ) {
			console.log("Response JSON: " + JSON.stringify(json));
			if (json.logged_out == true) {
				tm.loggedInUsername = "";
				$("#logoutModal").modal('hide');
				tm.updateNavbar();
			};
		}).fail(function(jqxhr, textStatus, error) {
			console.log("POST Request Failed: " + textStatus + ", " + error);
		});
	});
};




tm.offer = function() {
	$("#offerSubmitBtn").click(function(){
		var inputOriginAddress = $("#offerForm #inputOriginAddress").val();
		var inputDestinationAddress = $("#offerForm #inputDestinationAddress").val();
		var inputStartTime = $("#offerForm #inputStartTime").val();
		var inputEndTime = $("#offerForm #inputEndTime").val();
		var inputPrice = $("#offerForm #inputPrice").val();

		dict = {"start_time": inputStartTime,
				"end_time": inputEndTime,
				"origin": inputOriginAddress,
				"destination": inputDestinationAddress,
				"price": inputPrice};

		$.post("/offer", dict ).done(function( json ) {
			console.log("Response JSON: " + JSON.stringify(json));
			if (json.travel_error == false) {
				$("#offerModal").modal('hide');

				tm.travelOffer = {};

				tm.travelOffer.startTime = json.start_time;
				tm.travelOffer.endTime = json.end_time;
				tm.travelOffer.price = json.price;
				tm.travelOffer.origin = json.origin;
				tm.travelOffer.origLat = json.orig_lat;
				tm.travelOffer.origLon = json.orig_lon;
				tm.travelOffer.destination = json.destination;
				tm.travelOffer.destLat = json.dest_lat;
				tm.travelOffer.destLon = json.dest_lon;
				tm.travelOffer.mapUrl = json.map_url;

				$("#offerConfirmModal #originAddress").text(tm.travelOffer.origin);
				$("#offerConfirmModal #destinationAddress").text(tm.travelOffer.destination);
				$("#offerConfirmModal #startTime").text(tm.travelOffer.startTime);
				$("#offerConfirmModal #endTime").text(tm.travelOffer.endTime);
				$("#offerConfirmModal #price").text(tm.travelOffer.price);
				$("#offerConfirmModal iframe").attr('src',tm.travelOffer.mapUrl);

				$("#offerConfirmModal").modal('show');
			} else {
				if ($.inArray("start_time_val", json.errors) != -1){
					$("#offerForm #inputStartTime").attr('data-content','Invalid Time!');
					$("#offerForm #inputStartTime").popover('show');
					$("#offerForm #inputStartTime").val("");	
				} else {
					$("#offerForm #inputStartTime").popover('hide');
				}
				if ($.inArray("end_time_val", json.errors) != -1){
					$("#offerForm #inputEndTime").attr('data-content','Invalid Time!');
					$("#offerForm #inputEndTime").popover('show');
					$("#offerForm #inputEndTime").val("");
				} else if ($.inArray("time_order", json.errors) != -1) {
					$("#offerForm #inputEndTime").attr('data-content','Chronologically Invalid!');
					$("#offerForm #inputEndTime").popover('show');
					$("#offerForm #inputEndTime").val("");
				} else {
					$("#offerForm #inputEndTime").popover('hide');
				};

				if ($.inArray("price_val", json.errors) != -1){
					$("#offerForm #inputPrice").attr('data-content','Invalid Price!');
					$("#offerForm #inputPrice").popover('show');
					$("#offerForm #inputPrice").val("");	
				} else {
					$("#offerForm #inputPrice").popover('hide');
				};
				if ($.inArray("orig_adrs_val", json.errors) != -1){
					$("#offerForm #inputOriginAddress").attr('data-content','Invalid Address!');
					$("#offerForm #inputOriginAddress").popover('show');
					$("#offerForm #inputOriginAddress").val("");
				} else {
					$("#offerForm #inputOriginAddress").popover('hide');
				};
				if ($.inArray("dest_adrs_val", json.errors) != -1){
					$("#offerForm #inputDestinationAddress").attr('data-content','Invalid Address!');
					$("#offerForm #inputDestinationAddress").popover('show');
					$("#offerForm #inputDestinationAddress").val("");	
				} else {
					$("#offerForm #inputDestinationAddress").popover('hide');
				};
			};
		}).fail(function(jqxhr, textStatus, error) {
			console.log("POST Request Failed: " + textStatus + ", " + error);
		});		
	})
};



tm.editOffer = function() {
	$("#offerConfirmModal #editOfferBtn").click(function(){
		$("#offerConfirmModal").modal('hide');
		$("#offerModal").modal('show');
	});
};

tm.confirmOffer = function(){
	$("#offerConfirmModal #offerConfirmBtn").click(function(){
		console.log('clicked!');
		var origin = $("#offerConfirmModal #originAddress").text();
		var destination = $("#offerConfirmModal #destinationAddress").text();
		var startTime = $("#offerConfirmModal #startTime").text();
		var endTime = $("#offerConfirmModal #endTime").text();
		var price = $("#offerConfirmModal #price").text();

		if (origin == tm.travelOffer.origin &&
			destination == tm.travelOffer.destination &&
			startTime == tm.travelOffer.startTime &&
			endTime == tm.travelOffer.endTime &&
			price == tm.travelOffer.price) {

				dict = {"start_time": tm.travelOffer.startTime,
						"end_time": tm.travelOffer.endTime,
						"origin": tm.travelOffer.origin,
						"orig_lat": tm.travelOffer.origLat,
						"orig_lon": tm.travelOffer.origLon,
						"destination": tm.travelOffer.destination,
						"dest_lat": tm.travelOffer.destLat,
						"dest_lon": tm.travelOffer.destLon,
						"price": tm.travelOffer.price};	
				console.log('posting on the way');
				$.post("/offer/confirm", dict ).done(function( json ) {
					console.log("Response JSON: " + JSON.stringify(json));
					if (json.offer_post_succeed == true) {
						console.log('done');
						$("#offerConfirmModal").modal('hide');
					} else {
						if ($.inArray("not_logged_in", json.errors) != -1) {
							$("#offerConfirmModal").modal('hide');
							$("#loginModal").modal('show');				
						} else {
							$("#offerConfirmModal").modal('hide');
							$("#offerModal").modal('show');
						}

					};
				}).fail(function(jqxhr, textStatus, error) {
					console.log("POST Request Failed: " + textStatus + ", " + error);
				});

		} else {
			$("#offerConfirmModal").modal('hide');
			$("#offerModal").modal('show');
		};

	});
};



tm.request = function() {
	$("#requestSubmitBtn").click(function(){
		var inputOriginAddress = $("#requestForm #inputOriginAddress").val();
		var inputDestinationAddress = $("#requestForm #inputDestinationAddress").val();
		var inputStartTime = $("#requestForm #inputStartTime").val();
		var inputEndTime = $("#requestForm #inputEndTime").val();
		var inputPrice = $("#requestForm #inputPrice").val();

		dict = {"start_time": inputStartTime,
				"end_time": inputEndTime,
				"origin": inputOriginAddress,
				"destination": inputDestinationAddress,
				"price": inputPrice};

		$.post("/request", dict ).done(function( json ) {
			console.log("Response JSON: " + JSON.stringify(json));
			if (json.travel_error == false) {
				$("#requestModal").modal('hide');

				tm.travelRequest = {}

				tm.travelRequest.startTime = json.start_time;
				tm.travelRequest.endTime = json.end_time;
				tm.travelRequest.price = json.price;
				tm.travelRequest.origin = json.origin;
				tm.travelRequest.origLat = json.orig_lat;
				tm.travelRequest.origLon = json.orig_lon;
				tm.travelRequest.destination = json.destination;
				tm.travelRequest.destLat = json.dest_lat;
				tm.travelRequest.destLon = json.dest_lon;
				tm.travelRequest.mapUrl = json.map_url;

				$("#requestConfirmModal #originAddress").text(tm.travelRequest.origin);
				$("#requestConfirmModal #destinationAddress").text(tm.travelRequest.destination);
				$("#requestConfirmModal #startTime").text(tm.travelRequest.startTime);
				$("#requestConfirmModal #endTime").text(tm.travelRequest.endTime);
				$("#requestConfirmModal #price").text(tm.travelRequest.price);
				$("#requestConfirmModal iframe").attr('src',tm.travelRequest.mapUrl);

				$("#requestConfirmModal").modal('show');
			} else {
				if ($.inArray("start_time_val", json.errors) != -1){
					$("#requestForm #inputStartTime").attr('data-content','Invalid Time!');
					$("#requestForm #inputStartTime").popover('show');
					$("#requestForm #inputStartTime").val("");	
				} else {
					$("#requestForm #inputStartTime").popover('hide');
				}
				if ($.inArray("end_time_val", json.errors) != -1){
					$("#requestForm #inputEndTime").attr('data-content','Invalid Time!');
					$("#requestForm #inputEndTime").popover('show');
					$("#requestForm #inputEndTime").val("");
				} else if ($.inArray("time_order", json.errors) != -1) {
					$("#requestForm #inputEndTime").attr('data-content','Chronologically Invalid!');
					$("#requestForm #inputEndTime").popover('show');
					$("#requestForm #inputEndTime").val("");
				} else {
					$("#requestForm #inputEndTime").popover('hide');
				}
				if ($.inArray("price_val", json.errors) != -1){
					$("#requestForm #inputPrice").attr('data-content','Invalid Price!');
					$("#requestForm #inputPrice").popover('show');
					$("#requestForm #inputPrice").val("");	
				} else {
					$("#requestForm #inputPrice").popover('hide');
				};
				if ($.inArray("orig_adrs_val", json.errors) != -1){
					$("#requestForm #inputOriginAddress").attr('data-content','Invalid Address!');
					$("#requestForm #inputOriginAddress").popover('show');
					$("#requestForm #inputOriginAddress").val("");
				} else {
					$("#requestForm #inputOriginAddress").popover('hide');
				};
				if ($.inArray("dest_adrs_val", json.errors) != -1){
					$("#requestForm #inputDestinationAddress").attr('data-content','Invalid Address!');
					$("#requestForm #inputDestinationAddress").popover('show');
					$("#requestForm #inputDestinationAddress").val("");	
				} else {
					$("#requestForm #inputDestinationAddress").popover('hide');
				};
			};
		}).fail(function(jqxhr, textStatus, error) {
			console.log("POST Request Failed: " + textStatus + ", " + error);
		});		
	})
};


tm.editRequest = function() {
	$("#requestConfirmModal #editRequestBtn").click(function(){
		$("#requestConfirmModal").modal('hide');
		$("#requestModal").modal('show');
	});
};

tm.confirmRequest = function(){
	$("#requestConfirmModal #requestConfirmBtn").click(function(){
		console.log('clicked!');
		var origin = $("#requestConfirmModal #originAddress").text();
		var destination = $("#requestConfirmModal #destinationAddress").text();
		var startTime = $("#requestConfirmModal #startTime").text();
		var endTime = $("#requestConfirmModal #endTime").text();
		var price = $("#requestConfirmModal #price").text();

		if (origin == tm.travelRequest.origin &&
			destination == tm.travelRequest.destination &&
			startTime == tm.travelRequest.startTime &&
			endTime == tm.travelRequest.endTime &&
			price == tm.travelRequest.price) {

				dict = {"start_time": tm.travelRequest.startTime,
						"end_time": tm.travelRequest.endTime,
						"origin": tm.travelRequest.origin,
						"orig_lat": tm.travelRequest.origLat,
						"orig_lon": tm.travelRequest.origLon,
						"destination": tm.travelRequest.destination,
						"dest_lat": tm.travelRequest.destLat,
						"dest_lon": tm.travelRequest.destLon,
						"price": tm.travelRequest.price};	
				console.log('posting on the way');
				$.post("/request/confirm", dict ).done(function( json ) {
					console.log("Response JSON: " + JSON.stringify(json));
					if (json.request_post_succeed == true) {
						console.log('done');
						$("#requestConfirmModal").modal('hide');
					} else {
						if ($.inArray("not_logged_in", json.errors) != -1) {
							$("#requestConfirmModal").modal('hide');
							$("#loginModal").modal('show');				
						} else {
							$("#requestConfirmModal").modal('hide');
							$("#requestModal").modal('show');
						};

					}
				}).fail(function(jqxhr, textStatus, error) {
					console.log("POST Request Failed: " + textStatus + ", " + error);
				});

		} else {
			$("#requestConfirmModal").modal('hide');
			$("#requestModal").modal('show');
		};

	});
};




tm.initializePopovers = function() {
	$('[data-toggle="popover"]').popover();
};


tm.hidePopovers = function() {
	$('#loginModal').on('hide.bs.modal', function (e) {
		$("[data-toggle='popover']").popover('hide');
	});
	$('#signupModal').on('hide.bs.modal', function (e) {
		$("[data-toggle='popover']").popover('hide');
	});
	$('#requestModal').on('hide.bs.modal', function (e) {
		$("[data-toggle='popover']").popover('hide');
	});
	$('#offerModal').on('hide.bs.modal', function (e) {
		$("[data-toggle='popover']").popover('hide');
	});

};

tm.requestBtnClickListener = function() {
	$("a#requestBtn, Button#requestBtn").click(function(){
		if (tm.loggedInUsername == ""){
			console.log('come on modal');
			$("#loginModal").modal('show');
		} else {
			$("#requestModal").modal('show');
		};
	});
};

tm.offerBtnClickListener = function() {
	$("a#offerBtn, button#offerBtn").click(function(){
		if (tm.loggedInUsername == ""){
			console.log('come on modal');
			$("#loginModal").modal('show');
		} else {
			$("#offerModal").modal('show');
		};
	});
};

tm.activateDateTimePicker = function(){
	$('.datetime').datetimepicker({
		stepping: 15,
		sideBySide: false,
		toolbarPlacement: 'top',
		allowInputToggle: true
	});
	$('.datetime').datetimepicker();
};

$(document).ready( function() {
	tm.initialize();
	tm.updateNavbar();
	tm.loginModalEventHandler();
	tm.signupModalEventHandler();
	tm.requestModalEventHandler();
	tm.offerModalEventHandler();

	tm.initializePopovers();
	
	tm.login();
	tm.signup();
	tm.logout();
	
	tm.offer();
	tm.editOffer();
	tm.confirmOffer();
	
	tm.request();
	tm.editRequest();
	tm.confirmRequest();
	
	tm.hidePopovers();
	tm.requestBtnClickListener();
	tm.offerBtnClickListener();
	tm.activateDateTimePicker();
});
