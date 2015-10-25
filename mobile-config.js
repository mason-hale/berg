App.info({
  name: 'Berg',
  description: 'Helps you find your friends in Annenberg Dining Hall.',
  author: 'Gabe Grand',
  email: 'ggrand@college.harvard.edu',
  website: 'http://www.bergapp.com',
  version: '0.0.1'
});

App.accessRule('*');

App.icons({
  // iOS
  'iphone': 'resources/icons/Icon-60.png',
  'iphone_2x': 'resources/icons/Icon-60@2x.png',
  'iphone_3x': 'resources/icons/Icon-60@3x.png',
  'ipad': 'resources/icons/Icon-76.png',
  'ipad_2x': 'resources/icons/Icon-76@2x.png',
});


App.launchScreens({
  // iOS
  'iphone': 'resources/splash/splash-320x480.png',
  'iphone_2x': 'resources/splash/splash-320x480@2x.png',
  'iphone5': 'resources/splash/splash-320x568@2x.png',
  'iphone6': 'resources/splash/splash-375x667@2x.png',
  'iphone6p_portrait': 'resources/splash/splash-414x736@3x.png',
  
  /**
  'ipad_portrait': 'resources/splash/splash-768x1024.png',
  'ipad_portrait_2x': 'resources/splash/splash-768x1024@2x.png',
  'ipad_landscape': 'resources/splash/splash-1024x768.png',
  'ipad_landscape_2x': 'resources/splash/splash-1024x768@2x.png',
  **/
});


App.setPreference('StatusBarOverlaysWebView', 'false');
App.setPreference('StatusBarBackgroundColor', '#000000');