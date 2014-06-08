angular.module('MyApp')
	.controller('SignupCtrl', ['$scope', 'Auth', function($scope, Auth){
		$scope.signup = function(){
			Auth.signup({
				email: $scope.email,
				passworld: $scope.password
			});
		};
	}]);