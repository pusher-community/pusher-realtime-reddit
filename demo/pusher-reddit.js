var pusher = new Pusher("50ed18dd967b455393ed");

// Subscribe to /r/askreddit
var askreddit = pusher.subscribe("askreddit");
var askRedditListings = document.querySelector(".reddit-listings");

askreddit.bind("new-listing", function(listing) {
  var listingDOM = document.createElement("li");
  listingDOM.innerHTML = listing.title;

  askRedditListings.insertBefore(listingDOM, askRedditListings.firstChild);

  console.log(listing);
});