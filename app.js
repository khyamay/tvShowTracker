angular.module('MyApp', ['ngCookies', 'ngResource', 'ngMessages', 'ngRoute', 'mgcrea.ngStrap'])
.config(function($locationProvider){
	$locationProvider.html5Mode(true);
	$routeProvider
	.when('/', {
		templateUrl: 'views/home.html',
		controller: 'MainCtrl'
	})
	.when('/shows/:id', {
		templateUrl: 'views/details.html',
		controller: 'DetailCtrl'
	})
	.when('/login', {
		templateUrl: 'views/login.html',
		controller: 'SingupCtrl'
	})
	.when('/add', {
		templateUrl: 'views/add.html',
		controller: 'AddCtrl'
	})
	.otherwise({
		redirectTo: '/'
	});
});