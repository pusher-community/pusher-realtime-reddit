var _ = require("underscore");
var request = require("request");

var config;
try {
  config = require("./config");
} catch(e) {
  console.log("Failed to find local config, falling back to environment variables");
  config = {
    reddit_app_id: process.env.REDDIT_APP_ID,
    reddit_app_secret: process.env.REDDIT_APP_SECRET,
    reddit_authorization_code: process.env.REDDIT_AUTHORIZATION_CODE,
    reddit_refresh_token: process.env.REDDIT_REFRESH_TOKEN,
    pusher_app_id: process.env.PUSHER_APP_ID,
    pusher_key: process.env.PUSHER_APP_KEY,
    pusher_secret: process.env.PUSHER_APP_SECRET
  }
}

// --------------------------------------------------------------------
// SET UP PUSHER
// --------------------------------------------------------------------
var Pusher = require("pusher");
var pusher = new Pusher({
  appId: config.pusher_app_id,
  key: config.pusher_key,
  secret: config.pusher_secret
});


// --------------------------------------------------------------------
// REDDIT
// --------------------------------------------------------------------
var accessToken = "";
var accessTokenTime;
var previousListings = {};
var lastId;

var getAccessToken = function(callback) {
  console.log("getAccessToken()");

  var url = "https://ssl.reddit.com/api/v1/access_token";

  var options = {
    url: url,
    method: "POST",
    form: {
      grant_type: "refresh_token",
      refresh_token: config.reddit_refresh_token
    },
    auth: {
      user: config.reddit_app_id,
      pass: config.reddit_app_secret
    },
    json: true,
    timeout: 10000
  };

  console.log("Requesting access token");
  request(options, function(error, response, body) {
    console.log("Access token request callback");

    if (response.statusCode == 401) {
      console.log("Client credentials sent as HTTP Basic Authorization were invalid");
      return;
    }

    if (body.error && body.error == "unsupported_grant_type") {
      console.log("grant_type parameter was invalid");
      return;
    } else if (body.error) {
      console.log(body.error);
      return;
    }

    accessToken = body.access_token;
    accessTokenTime = Date.now();

    callback();
  });
};

var checkAccess = function(callback) {
  console.log("checkAccess()");

  var url = "https://oauth.reddit.com/api/v1/me.json";

  var options = {
    url: url,
    auth: {
      bearer: accessToken
    },
    headers: {
      "User-Agent": "realtime-reddit/0.0.1 by Pusher"
    },
    json: true,
    timeout: 10000
  };

  console.log("Requesting me.json");
  request(options, function(error, response, body) {
    console.log("me.json request callback");

    if (response.statusCode == 200) {
      callback(true);
    } else {
      callback(false);
    }
  });
};

var getNewListings = function(callback) {
  console.log("getNewListings()");

  var url = "https://oauth.reddit.com/new.json?limit=50";

  var options = {
    url: url,
    headers: {
      "Authorization": "bearer " + accessToken,
      "User-Agent": "realtime-reddit/0.0.1 by Pusher"
    },
    gzip: true,
    timeout: 10000
  };

  console.log("Requesting new listings");
  request(options, function(error, response, body) {
    console.log("New listings request callback");

    if (error) {
      console.log("New listings request error");
      console.log(error);
      console.log(response);
      callback();
      return;
    }
    
    // Re-authenticate
    if (response.statusCode == 401) {
      console.log("HTTP 401 on /new.json");
      authenticateAndScrape();
      return;
    }

    console.log("Rate remaining: " + response.headers["x-ratelimit-remaining"]);
    console.log("Rate reset (seconds): " + response.headers["x-ratelimit-reset"]);
    console.log("Status code: " + response.statusCode);

    body = JSON.parse(body);

    if (body.data && body.data.children.length > 0) {
      processListings(body.data.children);
      lastId = body.data.children[0].data.name;
    }

    callback();
  });
};

var scrapeListings = function() {
  console.log("------------------------------------------");
  console.log(new Date().toString());
  console.log("scrapeListings()");
  try {
    // Check access token time
    // 2700000 = 45 minutes
    if (Date.now() - accessTokenTime > 2700000) {
      console.log("Refreshing token after 45 minutes");
      authenticateAndScrape();
      return; 
    }

    getNewListings(function() {
      console.log("Starting scrape timer");
      setTimeout(function() {
        scrapeListings();
      }, 2000);
    });
  } catch(e) {
    console.log("Error");
    console.log(e);

    setTimeout(function() {
      scrapeListings();
    }, 2000);
  };
};

var processListings = function(listings) {
  console.log("processListings()");

  var count = 0;

  _.each(listings, function(listing, index) {
    // Look for existing listing
    if (!previousListings[listing.data.subreddit] || previousListings[listing.data.subreddit].indexOf(listing.data.name) < 0) {
      console.log("Adding listing to previous listings for /r/" + listing.data.subreddit);
      
      if (!previousListings[listing.data.subreddit]) {
        previousListings[listing.data.subreddit] = [];
      }

      previousListings[listing.data.subreddit].unshift(listing.data.name);

      // Cap previous listings
      if (previousListings[listing.data.subreddit].length > 50) {
        console.log("Cropping previous listings for /r/" + listing.data.subreddit);
        previousListings[listing.data.subreddit].splice(49);
      }

      console.log("Triggering message on Pusher");
      pusher.trigger(listing.data.subreddit.toLowerCase(), "new-listing", listing.data);
      count++;
    }
  });

  console.log(count + " new listings");
};

var authenticateAndScrape = function() {
  console.log("authenticateAndScrape()");
  checkAccess(function(success) {
    if (!accessToken || !success) {    
      console.log("Access denied");
      getAccessToken(function() {
        console.log("Access granted");
        scrapeListings();
      });
    } else {
      console.log("Access granted");
      scrapeListings();
    }
  });
};

authenticateAndScrape();

// Capture uncaught errors
process.on("uncaughtException", function(err) {
  console.log(err);

  console.log("Attempting to restart scraper");
  scrapeListings();
});