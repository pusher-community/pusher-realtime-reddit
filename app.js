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
var lastId;

var getAccessToken = function(callback) {
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
    json: true
  };

  request(options, function(error, response, body) {
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

    callback();
  });
};

var checkAccess = function(callback) {
  var url = "https://oauth.reddit.com/api/v1/me.json";

  var options = {
    url: url,
    auth: {
      bearer: accessToken
    },
    json: true
  };

  request(options, function(error, response, body) {
    if (response.statusCode == 200) {
      callback(true);
    } else {
      callback(false);
    }
  });
};

var getNewListings = function(before, callback) {
  var url = "https://oauth.reddit.com/new.json?limit=100";

  if (before) {
    url += "&before=" + before;
  }

  var options = {
    url: url,
    headers: {
      "Authorization": "bearer " + accessToken,
    },
    gzip: true
  };

  request(options, function(error, response, body) {
    body = JSON.parse(body);
    console.log(response.headers);
    
    // Re-authenticate
    if (response.statusCode == 401) {
      console.log("HTTP 401 on /new.json");
      authenticateAndScrape();
      return;
    }

    var count = (body.data && body.data.children) ? body.data.children.length : 0;
    console.log(count + " new listings");

    if (body.data && body.data.children.length > 0) {
      processListings(body.data.children);
      lastId = body.data.children[0].data.name;
    }

    callback();
  });
};

var scrapeListings = function(before) {
  getNewListings(before, function() {
    setTimeout(function() {
      scrapeListings(lastId);
    }, 2000);
  });
};

var processListings = function(listings) {
  _.each(listings, function(listing, index) {
    // pusher.trigger(listing.data.subreddit.toLowerCase(), "new-listing", listing.data);
  });
};

var authenticateAndScrape = function() {
  console.log("Authenticating");
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