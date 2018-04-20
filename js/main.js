var apiRoot = "https://api.github.com/";
var statsResult;

// Return a HTTP query variable
function getQueryVariable(variable) {
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		if (pair[0] === variable) {
			return pair[1];
		}
	}
	return "";
}

// Format numbers
function formatNumber(value) {
	return value.toString().replace(/(\d)(?=(\d{3})+$)/g, "$1,");
}

// Validate the user input
function validateInput() {
	if ($("#username").val().length > 0) {
		$("#get-stats-button").prop("disabled", false);
	} else {
		$("#get-stats-button").prop("disabled", true);
	}
}

// Move to #repository when hit enter and if it's empty or trigger the button
$("#username").keyup(function(event) {
	if (event.keyCode === 13) {
		$("#get-stats-button").click();
	}
});

// Callback function for getting user repositories
function getRepoStats() {
	var user = $("#username").val();

	statsResult.html("");
	statsResult.show("");

	var url = apiRoot + "users/" + user + "/repos";
	$.getJSON(url, function(data) {

		var repoNames = [];

		$.each(data, function(index, item) {
			repoNames.push(item.name);
		});


		$.each(repoNames, function(index, repository) {
			var url = apiRoot + "repos/" + user + "/" + repository + "/releases";
			$.getJSON(url, function(item) { showStats(item, user, repository); })
				.fail(function(item) { showStats(item, user, repository); });

		});
	}).fail(function(item) {
		if (item.status === 403) {
			handleRateLimiting(item, "Request rate limit hit");
		}
	});
}

function handleRateLimiting(item, title) {
	var date = new Date(new Number(item.getResponseHeader("X-RateLimit-Reset")) * 1000);
	var reset = new Date(date - new Date()).getMinutes();

	statsResult.append("<div class='col-md-6 col-md-offset-3 alert alert-danger output'><h3>" +
		title +
		"</h3>You have exceeded GitHub's rate limiting.<br />API rate limit reset will be in " +
		reset +
		" minutes</div>");
}


// Display the stats
function showStats(data, user, repository) {
	var err = false;
	var errMessage = "";

	if (data.status === 404) {
		err = true;
		errMessage = "The project does not exist!";
	}

	if (data.status === 403) {
		handleRateLimiting(data, repository);
		return;
	}

	var warning = false;

	if (data.length === 0) {
		err = true;
		warning = true;
		errMessage = "There are no releases for this project";
	}

	var html = "";

	if (err) {
		html += "<div class='col-md-6 col-md-offset-3 alert " +
			(warning ? "alert-warning" : "alert-danger") +
			" output'><h3><a href='https://github.com/" +
			user +
			"/" +
			repository +
			"'>" +
			repository +
			"</a></h3>" +
			errMessage +
			"</div>";
	} else {
		var isLatestRelease = true;
		var totalDownloadCount = 0;
		$.each(data, function(index, item) {
			var releaseTag = item.tag_name;
			var releaseBadge = "";
			var releaseClassNames = "release";
			var releaseUrl = item.html_url;
			var isPreRelease = item.prerelease;
			var releaseAssets = item.assets;
			var releaseDownloadCount = 0;
			var releaseAuthor = item.author;
			var publishDate = item.published_at.split("T")[0];

			if (isPreRelease) {
				releaseBadge = "&nbsp;&nbsp;<span class='badge'>Pre-release</span>";
				releaseClassNames += " pre-release";
			} else if (isLatestRelease) {
				releaseBadge = "&nbsp;&nbsp;<span class='badge'>Latest release</span>";
				releaseClassNames += " latest-release";
				isLatestRelease = false;
			}

			var downloadInfoHtml = "";
			if (releaseAssets.length) {
				downloadInfoHtml += "<h4><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
					"Download Info</h4>";

				downloadInfoHtml += "<ul>";

				$.each(releaseAssets, function(index, asset) {
					var assetSize = (asset.size / 1048576.0).toFixed(2);
					var lastUpdate = asset.updated_at.split("T")[0];

					downloadInfoHtml += "<li><code>" +
						asset.name +
						"</code> (" +
						assetSize +
						"&nbsp;MiB) - " +
						"downloaded " +
						formatNumber(asset.download_count) +
						"&nbsp;times. " +
						"Last&nbsp;updated&nbsp;on&nbsp;" +
						lastUpdate +
						"</li>";

					totalDownloadCount += asset.download_count;
					releaseDownloadCount += asset.download_count;
				});
			}

			html += "<div class='row " + releaseClassNames + "'>";

			html += "<h3><span class='glyphicon glyphicon-tag'></span>&nbsp;&nbsp;" +
				"<a href='" +
				releaseUrl +
				"' target='_blank'>" +
				releaseTag +
				"</a>" +
				releaseBadge +
				"</h3>" +
				"<hr class='release-hr'>";

			html += "<h4><span class='glyphicon glyphicon-info-sign'></span>&nbsp;&nbsp;" +
				"Release Info</h4>";

			html += "<ul>";

			if (releaseAuthor) {
				html += "<li><span class='glyphicon glyphicon-user'></span>&nbsp;&nbsp;" +
					"Author: <a href='" +
					releaseAuthor.html_url +
					"'>@" +
					releaseAuthor.login +
					"</a></li>";
			}

			html += "<li><span class='glyphicon glyphicon-calendar'></span>&nbsp;&nbsp;" +
				"Published: " +
				publishDate +
				"</li>";

			if (releaseDownloadCount) {
				html += "<li><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;" +
					"Downloads: " +
					formatNumber(releaseDownloadCount) +
					"</li>";
			}

			html += "</ul>";

			html += downloadInfoHtml;

			html += "</div>";
		});


		var totalHtml = "";
		if (totalDownloadCount) {
			totalHtml += "<div class='row total-downloads'>";
			totalHtml += "<h1><span class='glyphicon glyphicon-download'></span>&nbsp;&nbsp;Total Downloads</h1>";
			totalHtml += "<span>" + formatNumber(totalDownloadCount) + "</span>";
			totalHtml += "</div>";
		}

		html = "<div class='col-md-6 col-md-offset-3 output'><h3><a href='https://github.com/" +
			user +
			"/" +
			repository +
			"'>" +
			repository +
			"</a></h3>" +
			totalHtml +
			html +
			"</div>";

	}

	statsResult.append(html);
}


// The main function
$(function() {
	validateInput();
	$("#username").keyup(validateInput);
	statsResult = $("#stats-result");
	$("#get-stats-button").click(function() {

		var url = "?username=" +
			$("#username").val();
		window.history.replaceState(null, "GitHub Release Stats - " + $("#username").val(), url);
		getRepoStats();
	});

	var username = getQueryVariable("username");

	if (username !== "") {
		$("#username").val(username);
		validateInput();
		getRepoStats();

		$("#username").focus();

	};
});