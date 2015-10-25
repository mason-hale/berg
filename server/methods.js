Meteor.publish('feed', function(){
    return Students.find();
});

Meteor.publish('stars', function(){
    return Stars.find({owner: this.userId});
});

Meteor.publish('fb_friends', function(){
    return FB_Friends.find({owner: this.userId});
});

Meteor.methods({
    
    // Check in new student
    checkIn: function(text, tableLetter, tableNum) {
        
        // Make sure the user is logged in first
        if (! Meteor.userId()) {
            throw new Meteor.Error("not-authorized");
        }
        
        // Check if student already exists in database
        if (Students.findOne({owner: Meteor.userId()}) != null)
        {
            // Update student's data
            Students.update(
                {owner: Meteor.userId()}
            ,
                {$set: {
                    text: text, 
                    timestamp: new Date(), 
                    tableLetter: tableLetter, 
                    tableNum: tableNum, 
                    FBID: Meteor.user().services.facebook.id
                }}
            );

            // Increment checkin counter 
            // (NOTE: This could be factored into above code, but unsure about syntax)
            Students.update(
                {owner: Meteor.userId()}
            ,
                {$inc: {checkins: 1}}
            ,
                {upsert: true}
            );
            
        }
        
        // Insert new student into database (for facebook login)
        else if (Meteor.user().services.facebook != null)
        {          
            Students.insert({
                text: text,
                timestamp: new Date(), // current time
                owner: Meteor.userId(), // _id of logged in user
                username: Meteor.user().profile.name, // facebook username of logged in user
                FBID: Meteor.user().services.facebook.id,
                pic: "http://graph.facebook.com/" + Meteor.user().services.facebook.id + "/picture?height=100&width=100",
                tableLetter: tableLetter,
                tableNum: tableNum,
                checkins: 1, // number of times user has checked in
            });
        }
        
        // Else facebook login error
        else
        {
            throw new Meteor.Error("logged-out", "Login failed");
        }                    
    },

    // modifies star arrays to make sure starred users are displayed correctly
    star: function(starredUserID) {

        if (!Meteor.userId()){
            throw new Meteor.Error("not-authorized");
        }

        // else if statement that checks if the user is already starred (in which case, they are unstarred)


        if (Stars.findOne({owner: Meteor.userId()}) != null)
        {
            var starredArray = Stars.findOne({owner: Meteor.userId()}).starred;

            if (_.contains(starredArray, starredUserID))
            {
                Stars.update(
                    {owner: Meteor.userId()}
                ,
                    {$pull: {starred: starredUserID}}
                );
            }
            else
            {
                Stars.update(
                    {owner: Meteor.userId()}
                ,
                    {$push: {starred: starredUserID}}
                );
            }   
        }

        else 
        {         
            Stars.insert({
                owner: Meteor.userId(), // _id of logged in user
                starred: [starredUserID], // array of starred users
            });
        }
    },

    // Test for FB API call
    queryFriends: function() {
        
        var user = Meteor.users.findOne(this.userId);
        var accessToken = user.services.facebook.accessToken;

        if (!user || !accessToken)
          throw new Meteor.Error(500, "Not a valid Facebook user logged in");

        // Make the HTTP request to FB API
        var friends_response = HTTP.get("https://graph.facebook.com/me/friends?limit=5000", {
          params: {access_token: accessToken}}).data;

        // Check if user already exists in friends collection
        if (FB_Friends.findOne({owner: Meteor.userId()}) != null)
        {
            // Update student's data
            FB_Friends.update(
                {owner: Meteor.userId()}
            ,
                {$set: {friends: friends_response.data}}
            );
        }
        // Add new user entry to friends collection
        else
        {
            FB_Friends.insert({
                owner: Meteor.userId(), // _id of logged in user
                FBID: user.services.facebook.id, // Facebook ID of logged in user
                friends: friends_response.data, // Array of user's FB friends
            });
        }

        return;
    },
});