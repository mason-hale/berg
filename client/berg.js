Meteor.subscribe('feed');
Meteor.subscribe('stars');
Meteor.subscribe('fb_friends');

// Grabs an array of FB friend IDs from local Meteor FB_Friends collection
function getFriendIDs() {
    
    var friendsArray = [];

    if (FB_Friends.findOne({owner: Meteor.userId()}) != null)
    {
        // Get the friends objects from the database collection
        friendsArray = FB_Friends.findOne({owner: Meteor.userId()}).friends;

        // Extract the id from each object in the array
        friendsArray = friendsArray.map(function(obj){return obj.id;});
    }

    return friendsArray;
}

// Grabs an array of starred users from local Meteor Stars collection
function getStarred() {
    
    var starredArray = [];

    if (Stars.findOne({owner: Meteor.userId()}) != null)
    {
        starredArray = Stars.findOne({owner: Meteor.userId()}).starred;
    }

    return starredArray;
}

// Sets the time interval (in hours) for which recent users to display
function setStartTime() {

    var startTime = new Date();
    startTime.setHours(startTime.getHours() - (24 * 7)); // Max age is currently one week

    return startTime;
}

Template.homepage.helpers({
    // Returns all students in database, sorted newest to oldest and filtered by search term (if applicable)
    students: function () {

        // gets the user's current search entry and stores it in searchEntry
        var searchEntry = Session.get("search");
        
        // sets the time interval (in hours) for which recent users to display
        var startTime = setStartTime();
        
        var starredArray = getStarred();
        var friendsArray = getFriendIDs();

        // sorts users based on search entry (if there is no search entry, it defaults to "" and shows all users)
        return Students.find({$and: [{"username": new RegExp(searchEntry, 'i')}, {owner: {$not: {$in: starredArray}}}, {FBID: {$not: {$in: friendsArray}}}, {"timestamp" : { $gte : startTime }}]}, {sort: {timestamp: -1}});
    },
    
    starredStudents: function() {
        
        var searchEntry = Session.get("search");
        var starredArray = getStarred();
        var startTime = setStartTime();

        return Students.find({$and: [{owner: {$in: starredArray}}, {"username": new RegExp(searchEntry, 'i')}, {"timestamp" : { $gte : startTime }}]}, {sort: {timestamp: -1}});

    },

    // Populates list of user Facebook friends
    friends: function() {
        
        var searchEntry = Session.get("search");
        var starredArray = getStarred();
        var friendsArray = getFriendIDs();
        var startTime = setStartTime();

        return Students.find({$and: [{FBID: {$in: friendsArray}},
                                     {owner: {$not: {$in: starredArray}}}, 
                                     {"username": new RegExp(searchEntry, 'i')},
                                     {"timestamp" : { $gte : startTime }}]
                            }, 
                            {
                                sort: {timestamp: -1}
                            });
    },

    // connects the JavaScript to the Meteor variable {{search}} in the HTML 
    search: function (){
        return Session.get("search");
    },
    
    // Determines whether the starred users section should be displayed
    anyStarred: function() {
        
        var starredArray = getStarred();

        return (starredArray.length > 0);
    },

    // Determines whether the Facebook friends section should be displayed
    anyFriends: function() {
        
        var starredArray = getStarred();
        var friendsArray = getFriendIDs();

        return ((Students.findOne({$and: [{FBID: {$in: friendsArray}},
                                     {owner: {$not: {$in: starredArray}}}]
                            })) 
                != null);
    },
  
});

Template.student.helpers({

    checked: function() {
        
        starredArray = [];
        
        if (Stars.findOne({owner: Meteor.userId()}) != null)
        {
            var starredArray = Stars.findOne({owner: Meteor.userId()}).starred;
        }

        if (_.contains(starredArray, this.owner))
            return "checked";
        else
            return "";
    },
});

// Sets color of table box in UI
Handlebars.registerHelper("color", function(tableLetter) {

    // Determine color of table UI element
    if (tableLetter == 'A') {
        return "Yellow";
    }

    else if (tableLetter == 'B') {
        return "Blue";
    }

    else if (tableLetter == 'C') {
        return "Green";
    }
    else {
        return "Clear";
    }
});

// Formats text of user status update for UI display
Handlebars.registerHelper("textHelper", function(text) {
    // if user inputted text
    if (text != '') {
        return " — " + text;
    }
    else 
    {
        return '';
    }
});

// Highlights recently checked-in users in UI
Handlebars.registerHelper("timeCheck", function(timestamp) {
    // Calculate time elapsed since user check in (in ms)
    var timeDif = (new Date() - timestamp);

    // Check if user checked in within given time window (in ms)
    if (timeDif <= 1*24*60*60000) {
        return "recent";
    }
    else {
        return "old";
    }
});

// Counts number of students in database who have checked in during the last X hours
Handlebars.registerHelper("studentCount", function() {

    // sets the time interval
    var startTime = new Date();
    startTime.setHours(startTime.getHours() - 1);

    // queries mongodb for timestamps that are more recent than startTime
    var studentCount = Students.find({ "timestamp" : { $gte : startTime } }).count();
    
    // determine appropriate display message
    if (studentCount > 1)
    {
        return "There are " + studentCount + " people in Annenberg right now!"
    }
    else if (studentCount == 1)
    {
        return "There is 1 person in Annenberg right now!"
    }
    else
    {
        // sets the time interval (in hours) for which recent users to display
        var recentTime = new Date();
        recentTime.setHours(recentTime.getHours() - 168);
        
        // return number of students in database who have checked in during the last week
        var recentCount = Students.find({ "timestamp" : { $gte : recentTime } }).count();
        return recentCount + " people have checked into Annenberg recently."
    }
});

Template.homepage.events({

    // This function is called when the user check in form is submitted
    "click #check-in-button": function (event) {

        // Get text from input field, store in session variable
        var text = $("input[name='text']").val();
        Session.set("text", text);

        // Enforce character limit
        if (text.length > 75) {
            swal("Your status is too long (max 75 characters)");
            return false;
        }

        // Get table letter from radio buttons, store in session variable
        var tableLetter = $("input[name='tableLetter']:checked").val()
        Session.set("tableLetter", tableLetter);

        // Get table number from number input, store in session variable
        var tableNum = $("input[name='tableNum']").val();;
        Session.set("tableNum", tableNum);

        // Validate input
        if (tableNum == '' && tableLetter != undefined) {
            swal("Please enter the number of your table.")
            return false;
        }

        if (tableNum != '') {
            if (tableNum < 1 || tableNum > 17) {
                swal("Please pick a table number between 1 and 17.");
                return false;
            }
            if (tableLetter == undefined) {
                swal("Please select the letter of your table.");
                return false;
            }
        }
        
        // Options to pass into navigator
        var options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };
        
        // Validate user location
        navigator.geolocation.getCurrentPosition(success, error, options);
        
        // Popup loading message
        swal({
            title: "Checking your location...", 
            text: "Hang on a sec!",
            confirmButtonText: "Dismiss",
            closeOnConfirm: false,
            imageUrl: "spin.gif",
        });
        
        // successfuly got location
        function success(position) {
            
            // check proximity to berg
            if (position.coords.latitude > 42.375438 && position.coords.latitude < 42.376450 && 
                position.coords.longitude > -71.116500 && position.coords.longitude < -71.114248)
            {
                // unpack form data from session
                var text = Session.get("text");
                var tableLetter = Session.get("tableLetter");
                var tableNum = Session.get("tableNum");
                
                // Check in student
                Meteor.call("checkIn", text, tableLetter, tableNum);
                
                // Check for A1
                if (tableLetter == 'A' && tableNum == 1)
                {
                    swal("Checked in!", "Have an A1 day! ;)", "success");
                }
                
                else
                {
                    // Reward user
                    swal("Checked in!", "Bon appetit!", "success");
                }
            }

            else 
            {
                // Assortment of sassy rejections
                var sassArray = [
                    "Sorry, but you can't sit with us...",
                    "Head over there and try again!",
                    "Don't worry, you can always comp next semester!",
                    "You're missing out...",
                    "No swai for you!",
                    "No tourists allowed!",
                    "Sorry, no Yalies allowed!",
                    "Nice try, MIT.",
                ]
                
                // Pick random text from array
                var sass = sassArray[Math.floor(Math.random() * sassArray.length)];
                
                // If user is dev, return coords, else return message
                function textOption() {
                    if (Meteor.user().profile.name == "Gabe Grand")
                    {
                        return "Position: " + position.coords.latitude + ", " + position.coords.longitude;
                    }
                    else
                    {
                        return sass;
                    }
                };
                
                var myText = textOption();
                
                // user is not in the berg
                swal({
                    title: "Looks like you're not in the Berg",   
                    text: myText,
                    type: "error",
                }); 
                    
                return;
            }
        }
        
        // error getting location
        function error (error) {
            
            // log error code          
            console.log("Error getting location:");
            
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    console.log("User denied the request for Geolocation.");
                    break;
                case error.POSITION_UNAVAILABLE:
                    console.log("Location information is unavailable.");
                    break;
                case error.TIMEOUT:
                    console.log("The request to get user location timed out.");
                    break;
                case error.UNKNOWN_ERROR:
                    console.log("An unknown error occurred.");
                    break;
            }
            
            swal({
                title: "Couldn't verify your location",   
                text: "Please make sure your location services are enabled and try again.",   
                type: "warning",
            });
            
            return;
        }
        
        // deselect table letter
        $("input[name='tableLetter']:checked").prop('checked', false);
        
        // clear table number
        $("input[name='tableNum']").val('');

        // Prevent default PHP form submit (GET request)
        return false;
    },
    
    // drops the search bar down from the navbar
    "click #search-bar-button": function() {
        
        // display the search bar
        if ($("#searchDiv").css("margin-top") < "0px")
        {
            $("#searchDiv").css("visibility", "visible");
            $("#searchDiv").css("margin-top", "43px");
        }
        
        // terminate search
        else 
        {
            // hide search bar
            $("#searchDiv").css("margin-top", "-15px");
            $("#searchDiv").css("visibility", "hidden");
            
            // clear search parameter
            Session.set("search", "");
            
            // clear search text
            $("#searchText").val('');

            // Hide clear search button
            $("#clear-search").hide();
        }
    },

    // called when the user submits a search
    "submit .search": function(event) {

        var searchEntry = $(event.target).children()[0].value;
        
        // Validate input
        if (searchEntry == '') {
            return false;
        }
        
        // checks whether the search will return zero results
        if (searchEntry != "" && Students.find({ "username" : new RegExp(searchEntry, 'i') }).count() == 0)
        {
            swal({   
                title: "No matches",   
                text: "Couldn't find anyone by that name in the Berg.", 
            }, 
                 
            function() {   
                // sets the {{search}} equal to "" to clear the search (such that all users are displayed)
                Session.set("search", "");

                // Hide clear search button
                $("#clear-search").hide();

                // clear search text
                $("#searchText").val('');

                return false;
            });
        }

        // sets the {{search}} equal to the user's text entry
        Session.set("search", searchEntry);

        // Show clear search button
        $("#clear-search").show();

        // Prevent default PHP form submit (GET request)
        return false;
    },

    // called when the user clicks the "x" button (clear search)
    "click #clear-search": function(event) {

        // sets the {{search}} equal to "" to clear the search (such that all users are displayed)
        Session.set("search", "");

        // Hide clear search button
        $("#clear-search").hide();
        
        // clear search text
        $("#searchText").val('');
    },
});

Template.student.events({

    // When user clicks on box that displays table numbers, show seating chart
    "click .tableBox": function(event) {

        // Prevent the below event handler from starring the student
        event.stopPropagation();

        // Get screen size
        var dims = window.screen.width/1.8 + "x" + window.screen.height/1.8;

        // Display seating chart with appropriate image dimensions
        swal({   
            title: "Annenberg seating chart",
            imageUrl: "seating.png",
            imageSize: dims,
        },
        function() {
            // Reset swal styles
            $(".sweet-alert").removeAttr('style');
            $(".sweet-alert h2").removeAttr('style');
            $(".sweet-alert fieldset").removeAttr('style');
        });

        // Save some screen space
        $(".sweet-alert").css("padding-top", "0px");
        $(".sweet-alert h2").css("margin", "0px");
        $(".sweet-alert fieldset").css("display", "none");
    },

    // when the user clicks on any part of the student bar, star the student
    "click #studentBar": function() {
        
        var starredUserID = this.owner;
        
        Meteor.call("star", starredUserID);
    },
});

// Runs once the homepage is rendered
Template.homepage.rendered = function() {
    
    // Check if user is on mobile 
    if($(window).width() <= 480) {

        // hide background cycler
        $('.cb-slideshow').hide();
        
        // Load static background image
        $('body').css("background-image", "none");
    }
    
    // Make server-side call to FB API to get friends list
    Meteor.call("queryFriends", function(error, response){
        if (error)
            console.log(error);
    });

    // sets the {{search}} equal to "" to clear the search (such that all users are displayed)
    Session.set("search", "");
};

// re-display background cycler for login page
Template.login.rendered = function() {
    $('.cb-slideshow').show();
};