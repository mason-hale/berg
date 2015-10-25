Meteor.startup(function () {
	Accounts.ui.config({
  		requestPermissions: {
    		facebook: ['user_friends'],
		},
	});
});