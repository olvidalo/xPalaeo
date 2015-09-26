/**
 * @ngdoc controller
 * @name app.controller:transcriptionListController
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 *
 * Controller für die Liste der Transkriptionen anderer Benutzer, die korrigiert werden können.
 * 
 */


app.controller('TranscriptionListController', ['$scope', '$rootScope', '$http', '$location', 'xapi', 'transcriptionQuery', function($scope, $rootScope, $http, $location, xapi, transcriptionQuery) {
   
   /**
    * @ngdoc property
    * @name app.controller:transcriptionListController#transcriptions
    * @propertyOf app.controller:transcriptionListController
    *
    * @description
    * Von anderen Benutzern eingereichte Transkriptionen zum geöffneten Text
    *
    */
   $scope.transcriptions = [];
   $scope.isLoggedIn = xapi.state.loggedIn;

   /**
    * @ngdoc property
    * @name app.controller:transcriptionListController#currentActivityHasBeenSubmitted
    * @propertyOf app.controller:transcriptionListController
    *
    * @description
    * Wahr, wenn die aktuell geöffnete Transkription von Benutzer zur Bewertung
    * eingereicht worden ist.
    *
    */
   $scope.currentActivityHasBeenSubmitted = false;


   var getUserTranscriptions = function(activity) {

      // Zeige Transkriptionen anderer Benutzer nur, wenn die eigene Transkription
      // bereits eingereicht wurde
      xapi.getState("transcriptionstate", function(data) {
         if (data.state == "finished") {
            $scope.currentActivityHasBeenSubmitted = true;
            transcriptionQuery.getSubmittedTranscriptions(null, function(result) {

               var transcriptions = result.filter(function(stmt) {
                  return   stmt.verb.id == ADL.verbs.attempted.id
                        && stmt.actor.mbox != xapi.state.currentActor.mbox;
               });

               $scope.$apply(function(){$scope.transcriptions = transcriptions})

            }, $scope.$parent.currentActivity);
         }
      });

   }; 

   // Reagiere auf Login/Logout  
   $scope.$watch(function() {return xapi.state.loggedIn;}, function(loggedIn) {
      $scope.isLoggedIn = loggedIn;
      if (loggedIn && !angular.isUndefined($scope.$parent.currentActivity)) {
         getUserTranscriptions($scope.$parent.currentActivity);
      }
   });

   $scope.currentActor = xapi.state.currentActor;
   $scope.$watch(function(){return xapi.state.currentActor;}, function(currentActor) {
         $scope.currentActor = currentActor;
   }, true);


   // Reagiere auf Auswahl eines Textes
   $scope.$watch(function() {
         return $scope.$parent.currentActivity;
   }, function(currentActivity) {

      if (angular.isUndefined(currentActivity)) return;
      if (!$scope.isLoggedIn) return;

      getUserTranscriptions(currentActivity);

   }, true);


}]);
