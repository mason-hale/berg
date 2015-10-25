Router.configure({
    layoutTemplate: 'layout'
});

Router.onBeforeAction( function() {
    if (!Meteor.user())
    {
        this.render('login');
    }
    else
    {
        this.next();
    }
});

Router.route('/', function() {
    this.render('homepage');
});