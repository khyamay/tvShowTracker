angular.module('MyApp')
	.controller('DetailCtrl', ['$scope', '$rootScope', '$routeParams', 'Show', 'Subsription', function($scope, $rootScope, $routeParams, Show, Subscription){
		Show.get({_id: $routeParams.id}, function(show){
			$scope.show = show;
		});

		$scope.isSubscribed = function(){
			return $scope.show.subscribers.indexOf($rootScope.currentUser._id) !== -1;
		};

		$scope.Subscribe = function(){
			Subscription.subscribe(show, $rootScope.currentUser).success(function(){
				$scope.show.subsribers.push($rootScope.currentUser._id);
			});
		};

		$scope.unsubscribe = function(){
			Subscription.unsubscribe(show, $rootScope.currentUser).success(function(){
				var index = $scope.show.subscribers.indexOf($rootScope.currentUser._id);
				$scope.show.subscribers.splice(index, 1);
			});
		};

		$scope.nextEpisode = show.episodes.filter(function(episdoe){
			return new Date(episode.firstAired) > new Date ();
		})[0];

	}]);