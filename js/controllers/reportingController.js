/**
 * @ngdoc controller
 * @name app.controller:reportingController
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 *
 * Controller für die Dozentenübersicht.
 *
 * 
 */

app.controller('ReportingController', ['$scope', '$rootScope', '$location', '$routeParams', '$http', 'xapi', 'xpalaeo', 'XPALAEO_CONFIG', 'transcriptionQuery', function($scope, $rootScope, $location, $routeParams, $http, xapi, xpalaeo, XPALAEO_CONFIG, transcriptionQuery) {
   
   /**
    * @ngdoc property
    * @name app.controller:reportingController#users
    * @propertyOf app.controller:reportingController
    *
    * @description
    * Liste der in eXist registrierten Benutzer
    *
    */
   $scope.users = {};

   /**
    * @ngdoc property
    * @name app.controller:reportingController#startedTranscriptions
    * @propertyOf app.controller:reportingController
    *
    * @description
    * Liste aller begonnenen Transkriptionen im LRS
    *
    */
   $scope.startedTranscriptions = [];

   /**
    * @ngdoc property
    * @name app.controller:reportingController#submittedTranscriptions
    * @propertyOf app.controller:reportingController
    *
    * @description
    * Liste aller eingereichten Transkriptionen im LRS
    *
    */
   $scope.submittedTranscriptions = [];

   /**
    * @ngdoc property
    * @name app.controller:reportingController#submittedCorrections
    * @propertyOf app.controller:reportingController
    *
    * @description
    * Liste aller eingereichten Korrekturvorschläge im LRS
    *
    */
   $scope.submittedCorrections = [];


   /**
    * @ngdoc property
    * @name app.controller:reportingController#gradedTranscriptions
    * @propertyOf app.controller:reportingController
    *
    * @description
    * Liste aller bewerteten Transkriptionen im LRS
    *
    */
   $scope.gradedTranscriptions = [];

   /**
    * @ngdoc property
    * @name app.controller:reportingController#statementRefs
    * @propertyOf app.controller:reportingController
    *
    * @description
    * Details der in Korrektur-Statements referenzierten Statements.
    *
    */
   $scope.statementRefs = {};

   $scope.showOverview = angular.isUndefined($routeParams.user);

   var getOverview = function() {
      // Begonnene Transkriptionen abrufen
      transcriptionQuery.getStartedTranscriptions(null, function(result){
         $scope.$apply(function() {$scope.startedTranscriptions = result});
      });


      // Eingereichte Transkriptionen abrufen
      transcriptionQuery.getSubmittedTranscriptions(null, function(result){
         $scope.$apply(function() {$scope.submittedTranscriptions = result});
      });

      // Bewertete Transkriptionen abrufen
      transcriptionQuery.getGradedTranscriptions(null, function(result) {
         $scope.$apply(function() {$scope.gradedTranscriptions = result});
      });

      // Korrekturvorschläge abrufen
      transcriptionQuery.getCorrections(null, null, function(result){
         $scope.$apply(function() {
            $scope.submittedCorrections = result;

            // Statementreferenzen auflösen
            angular.forEach($scope.submittedCorrections, function(stmt) {
               transcriptionQuery.getCorrectionObject(stmt.object.id, function(result) {
                  $scope.$apply(function() {
                     $scope.statementRefs[stmt.object.id] = result;
                  });
               });
            });

         });
      });
   };

   if (xapi.state.loggedIn && $scope.showOverview) {
      getOverview();
   } 

   // Rufe alle registrierten Benutzer ab und zeige sie im Benutzermenü
   $http
      .get(XPALAEO_CONFIG.appRoot + '/users')
      .success(function(data) {
         angular.forEach(data.users, function(user){
            $scope.users[user.name] = user.mbox;
         });
      });


   $scope.$on("lrs:login", function() {
      getOverview();
   });

}]);
