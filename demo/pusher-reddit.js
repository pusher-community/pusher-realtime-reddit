var pusher = new Pusher("50ed18dd967b455393ed");

// Subscribe to /r/askreddit
var askreddit = pusher.subscribe("askreddit");
var askRedditListings = document.querySelector(".askreddit-listings");

askreddit.bind("new-listing", function(listing) {
  if (listing.over_18) {
    console.log("Listing is NSFW");
    return; 
  }

  var listingDOM = document.createElement("li");
  listingDOM.innerHTML = listing.title;

  askRedditListings.insertBefore(listingDOM, askRedditListings.firstChild);

  console.log(listing);
});

// Subscribe to /r/pics
var pics = pusher.subscribe("pics");
var picsListings = document.querySelector(".pics-listings");

pics.bind("new-listing", function(listing) {
  if (!listing.url) {
    console.log("No url for image: " + listing.permalink);
    return;
  }

  if (listing.url.search(/\.jpg|\.jpeg|\.png|\.gif$/g) < 0) {
    console.log("URL is not a valid image: " + listing.url);
    return;
  }

  if (listing.over_18) {
    console.log("Listing is NSFW");
    return; 
  }

  var listingDOM = document.createElement("img");
  listingDOM.src = listing.url;

  picsListings.insertBefore(listingDOM, picsListings.firstChild);

  console.log(listing);
});

// Subscribe to /r/gifs
var gifs = pusher.subscribe("gifs");
var gifsListings = document.querySelector(".gifs-listings");

gifs.bind("new-listing", function(listing) {
  if (!listing.url) {
    console.log("No url for image: " + listing.permalink);
    return;
  }

  if (listing.url.search(/\.jpg|\.jpeg|\.png|\.gif$/g) < 0) {
    console.log("URL is not a valid image: " + listing.url);
    return;
  }

  if (listing.over_18) {
    console.log("Listing is NSFW");
    return; 
  }

  var listingDOM = document.createElement("img");
  listingDOM.src = listing.url;

  gifsListings.insertBefore(listingDOM, gifsListings.firstChild);

  console.log(listing);
});

// Subscribe to /r/earthporn
var earthporn = pusher.subscribe("earthporn");
var earthpornListings = document.querySelector(".earthporn-listings");

earthporn.bind("new-listing", function(listing) {
  if (!listing.url) {
    console.log("No url for image: " + listing.permalink);
    return;
  }

  if (listing.url.search(/\.jpg|\.jpeg|\.png|\.gif$/g) < 0) {
    console.log("URL is not a valid image: " + listing.url);
    return;
  }

  if (listing.over_18) {
    console.log("Listing is NSFW");
    return; 
  }

  var listingDOM = document.createElement("img");
  listingDOM.src = listing.url;

  earthpornListings.insertBefore(listingDOM, earthpornListings.firstChild);

  console.log(listing);
});