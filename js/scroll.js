$(document).ready(function(){
	$(".scroll-to-attack-request").click(function () {
		console.log("scrolling to attack request");
		$('html,body,div#main-wrapper').animate({scrollTop: 33}, 'slow');
		});
	$('.scroll-to-attack-payload').click(function () {
			console.log("scrolling to attack payload");
			$('html,body,div#main-wrapper').animate({scrollTop: 467}, 'slow');
		});
	$(".scroll-to-attack-response").click(function () {
			console.log("scrolling to attack response");
			$('html,body,div#main-wrapper').animate({scrollTop: 590}, 'slow');
		});
	$(".scroll-to-attack-content").click(function(){
			console.log("scrolling to attack content");
			$('html,body,div#main-wrapper').animate({scrollTop: $(document).height()}, 'slow');
		});
});

