var pusher = new Pusher("50ed18dd967b455393ed");

var substringMatcher = function(strs) {
  return function findMatches(q, cb) {
    var matches, substrRegex;
 
    // an array that will be populated with substring matches
    matches = [];
 
    // regex used to determine if a string contains the substring `q`
    substrRegex = new RegExp(q, 'i');
 
    // iterate through the pool of strings and for any string that
    // contains the substring `q`, add it to the `matches` array
    $.each(strs, function(i, str) {
      if (substrRegex.test(str)) {
        // the typeahead jQuery plugin expects suggestions to a
        // JavaScript object, refer to typeahead docs for more info
        matches.push({ value: str });
      }
    });
 
    cb(matches);
  };
};
 
var subreddits = ["funny","AdviceAnimals","pics","aww","todayilearned","videos","WTF","gaming","leagueoflegends","gifs","AskReddit","worldnews","TrollXChromosomes","pcmasterrace","4chan","movies","trees","mildlyinteresting","DotA2","reactiongifs","news","politics","pokemon","soccer","atheism","cringepics","technology","gentlemanboners","MakeupAddiction","Minecraft","science","TumblrInAction","woahdude","Showerthoughts","nba","Unexpected","anime","Jokes","cats","Celebs","hearthstone","smashbros","IAmA","gameofthrones","explainlikeimfive","polandball","teenagers","tifu","SquaredCircle","facepalm","conspiracy","circlejerk","GlobalOffensive","Music","bestof","Games","tattoos","food","nfl","EarthPorn","TrollYChromosome","skyrim","fatpeoplehate","comics","magicTCG","Marvel","talesfromtechsupport","creepy","LifeProTips","OldSchoolCool","hiphopheads","HistoryPorn","wow","TalesFromRetail","Bitcoin","TheLastAirbender","worldpolitics","Android","roosterteeth","TwoXChromosomes","tf2","fffffffuuuuuuuuuuuu","standupshots","GetMotivated","progresspics","DIY","dayz","mildlyinfuriating","StarWars","Fallout","nottheonion","tumblr","FoodPorn","nosleep","youtubehaiku","firstworldanarchists","interestingasfuck","mindcrack","baseball","motorcycles"];
 
$('.typeahead').typeahead({
  hint: true,
  highlight: true,
  minLength: 1
}, {
  name: 'subreddits',
  displayKey: 'value',
  source: substringMatcher(subreddits)
})

$('.typeahead').bind("typeahead:selected", function(event, suggestion, name) {
  var listings = $(event.target).parent().next(".listings");
  changeReddit(suggestion.value, listings);
});

var changeReddit = function(subreddit, listings) {
  var channel = pusher.subscribe(subreddit.toLowerCase());

  // Change data attribute
  listings.get(0).dataset.subreddit = subreddit.toLowerCase();

  channel.bind("new-listing", function(listing) {
    if (listing.over_18) {
      console.log("Listing is NSFW");
      return; 
    }

    var listingDOM = document.createElement("li");
    listingDOM.innerHTML = listing.title;

    listings.get(0).insertBefore(listingDOM, listings.firstChild);

    console.log(listing);
  });
};

// // Subscribe to /r/askreddit
// var askreddit = pusher.subscribe("askreddit");
// var askRedditListings = document.querySelector(".askreddit-listings");

// askreddit.bind("new-listing", function(listing) {
//   if (listing.over_18) {
//     console.log("Listing is NSFW");
//     return; 
//   }

//   var listingDOM = document.createElement("li");
//   listingDOM.innerHTML = listing.title;

//   askRedditListings.insertBefore(listingDOM, askRedditListings.firstChild);

//   console.log(listing);
// });

// // Subscribe to /r/pics
// var pics = pusher.subscribe("pics");
// var picsListings = document.querySelector(".pics-listings");

// pics.bind("new-listing", function(listing) {
//   if (!listing.url) {
//     console.log("No url for image: " + listing.permalink);
//     return;
//   }

//   if (listing.url.search(/\.jpg|\.jpeg|\.png|\.gif$/g) < 0) {
//     console.log("URL is not a valid image: " + listing.url);
//     return;
//   }

//   if (listing.over_18) {
//     console.log("Listing is NSFW");
//     return; 
//   }

//   var listingDOM = document.createElement("img");
//   listingDOM.src = listing.url;

//   picsListings.insertBefore(listingDOM, picsListings.firstChild);

//   console.log(listing);
// });

// // Subscribe to /r/gifs
// var gifs = pusher.subscribe("gifs");
// var gifsListings = document.querySelector(".gifs-listings");

// gifs.bind("new-listing", function(listing) {
//   if (!listing.url) {
//     console.log("No url for image: " + listing.permalink);
//     return;
//   }

//   if (listing.url.search(/\.jpg|\.jpeg|\.png|\.gif$/g) < 0) {
//     console.log("URL is not a valid image: " + listing.url);
//     return;
//   }

//   if (listing.over_18) {
//     console.log("Listing is NSFW");
//     return; 
//   }

//   var listingDOM = document.createElement("img");
//   listingDOM.src = listing.url;

//   gifsListings.insertBefore(listingDOM, gifsListings.firstChild);

//   console.log(listing);
// });

// // Subscribe to /r/earthporn
// var earthporn = pusher.subscribe("earthporn");
// var earthpornListings = document.querySelector(".earthporn-listings");

// earthporn.bind("new-listing", function(listing) {
//   if (!listing.url) {
//     console.log("No url for image: " + listing.permalink);
//     return;
//   }

//   if (listing.url.search(/\.jpg|\.jpeg|\.png|\.gif$/g) < 0) {
//     console.log("URL is not a valid image: " + listing.url);
//     return;
//   }

//   if (listing.over_18) {
//     console.log("Listing is NSFW");
//     return; 
//   }

//   var listingDOM = document.createElement("img");
//   listingDOM.src = listing.url;

//   earthpornListings.insertBefore(listingDOM, earthpornListings.firstChild);

//   console.log(listing);
// });