/**
 * @ngdoc controller
 * @name app.controller:MainController
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 *
 * Controller für die Liste der Texte im Menü links im Bearbeitungsmodus.
 *
 * Der Name ist historisch zu verstehen...
 * 
 */

app.controller('MainController', ['$scope', '$rootScope', '$location', '$routeParams', 'xapi', 'xpalaeo', function($scope, $rootScope, $location, $routeParams, xapi, xpalaeo) {
   
   $scope.exercises = {activities: []};
   $scope.activityDefinitions = {};

   
   xpalaeo.getExercises().success(function(data) {
   	$scope.exercises.activities = data.activities;
   });


   $scope.currentActor = xapi.state.currentActor;
   $scope.currentActivity = xapi.state.currentActivity;
   $scope.$watch(function(){return xapi.state.currentActor;}, function(currentActor) {
   		$scope.currentActor = currentActor;
   }, true);
   $scope.$watch(function(){return xapi.state.currentActivity;}, function(currentActivity) {
   		$scope.currentActivity = currentActivity;
   }, true);

   $scope.activitySet = false;
   if (angular.isDefined($location.search().activity)) {
   	xapi.state.currentActivity = $location.search().activity;
   	$scope.activitySet = true;
   } else {
      xapi.state.currentActivity = null;
      $scope.activitySet = false;
   }
   

}]);
