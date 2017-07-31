"use strict";

function activateForm () {
	$("form").submit(function () {
		if ($("#password").val()!==$("#confirm").val()) {
			$(".error").text("Passwords must match");
		}
		else {
			const username = $("#username").val();
			const password = $("#password").val();
			$.ajax ({
				url: "/users",
				method: "POST",
				data: {"username": username, "password": password},
				dataType: "text",
				success: () => window.location.href('/'),
				error: err => {
					if (err.status >= 500) $(".error").text(err.statusText);
					else $(".error").text(err.responseText);
				}
			})
		}
		return false;
	});
};

$(() => activateForm());