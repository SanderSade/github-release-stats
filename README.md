# github-release-stats


[Here](http://dukelupus.com/github-release-stats/) is the page in action. 

You can get GitHub release stats for all projects of a user/account, such as  download counts, release dates and authors. Note that if the user has more than 59 repositories, you will hit the [GitHub API request limit](https://developer.github.com/v3/#rate-limiting), which is 60  unauthenticated requests per hour (one request is used for getting list of the projects).

This project is forked from [Somsubhra/github-release-stats](https://github.com/Somsubhra/github-release-stats)

#### Changes from the original
* Get stats for all projects of a user/account, not just one project
* Load third-party JS & CSS from CDN
* Removed advertisement and Google Analytics code
* Rewrote URL handling not to reload the page
* Better handling of HTTP 403 (GitHub API request rate limit hit) - will now show when the throttling expires
* Various small fixes and changes



