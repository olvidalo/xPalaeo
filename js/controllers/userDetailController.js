/**
 * @ngdoc controller
 * @name app.controller:userDetailController
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 *
 * Controller die Benutzerdetailansicht im Dozentenmodus. Erlaubt das Ansehen
 * der Aktivität des Benutzers sowie das Bewerten von Transkriptionen.
 * 
 */


app.controller('UserDetailController', ['$scope', '$rootScope', '$location', '$routeParams', '$http', 'xapi', 'xpalaeo', 'transcriptionQuery', function($scope, $rootScope, $location, $routeParams, $http, xapi, xpalaeo, transcriptionQuery) {
   
   /**
    * @ngdoc property
    * @name app.controller:userDetailController#startedTranscriptions
    * @propertyOf app.controller:userDetailController
    *
    * @description
    * Liste aller begonnenen Transkriptionen im LRS
    *
    */
   $scope.startedTranscriptions = null;

   /**
    * @ngdoc property
    * @name app.controller:userDetailController#submittedTranscriptions
    * @propertyOf app.controller:userDetailController
    *
    * @description
    * Liste aller eingereichten, noch nicht bewerteten Transkriptionen im LRS
    *
    */
   $scope.submittedTranscriptions = null;

   /**
    * @ngdoc property
    * @name app.controller:userDetailController#gradedTranskriptions
    * @propertyOf app.controller:userDetailController
    *
    * @description
    * Liste aller bewerteten Transkriptionen im LRS
    *
    */
   $scope.gradedTranscriptions = null;

   /**
    * @ngdoc property
    * @name app.controller:userDetailController#submittedCorrections
    * @propertyOf app.controller:userDetailController
    *
    * @description
    * Liste aller eingereichten Korrekturvorschläge im LRS
    *
    */
   $scope.submittedCorrections = null;

   /**
    * @ngdoc property
    * @name app.controller:userDetailController#corrections
    * @propertyOf app.controller:userDetailController
    *
    * @description
    * Liste aller begonnenen Transkriptionen im LRS
    *
    */
   $scope.corrections = {};

   /**
    * @ngdoc property
    * @name app.controller:userDetailController#TEIs
    * @propertyOf app.controller:userDetailController
    *
    * @description
    * Die TEI-Dokumente der Handschriften zur Anzeige der Referenztranskriptionen bei der
    * Bewertung.
    *
    */
   $scope.TEIs = {};

   if (angular.isUndefined($routeParams.user)) return;

   /**
    * @ngdoc property
    * @name app.controller:reportingController#user
    * @propertyOf app.controller:reportingController
    *
    * @description
    * Der aktuell angezeigte Benutzer.
    *
    */
   $scope.user = null;


   // Initialisierung
   var getUserDetails = function() {

      // Benutzerinfo abrufen
      ADL.XAPIWrapper.getAgents({mbox: $routeParams.user}, function(xhr) {
         $scope.$apply(function() {
            $scope.user = angular.fromJson(xhr.response);
         });
      });

      // Transkriptionen Abrufen
      var agent = angular.toJson({mbox: $routeParams.user});

      // begonnen
      transcriptionQuery.getStartedTranscriptions(
        agent,
          function(result) {
            $scope.$apply(function() {$scope.startedTranscriptions = result}); 
        });

      // eingereicht
      transcriptionQuery.getSubmittedTranscriptions(agent, function(result){
         $scope.$apply(function() {$scope.submittedTranscriptions = result});

         // Eingereichte Korrekturvorschläge je Transkription
         angular.forEach(result, function(stmt) {
            transcriptionQuery.getCorrections(null, stmt.id, function(result){
               $scope.$apply(function(){$scope.corrections[stmt.id] = result});
            });
         });

         // TEIs für Transkriptionen abrufen
         angular.forEach(result, function(stmt) {
            $http
               .get(stmt.object.id)
               .success(function(tei){
                  $scope.TEIs[stmt.object.id] = tei;
               })
         });
      });

      // bewertete Transkriptionen

   };

   /**
    * @ngdoc method
    * @name app.controller:userDetailController#approveTranscription
    * @methodOf app.controller:userDetailController
    * @description
    * Eine eingereichte Transkription als bestanden bewerten.
    *
    */
   $scope.approveTranscription = function(stmt) {
      xapi.postStatement(ADL.verbs.passed, stmt.result, stmt.actor, stmt.object);
   }

   /**
    * @ngdoc method
    * @name app.controller:userDetailController#disapproveTranscription
    * @methodOf app.controller:userDetailController
    * @description
    * Eine eingereichte Transkriptiption als nicht bestanden bewerten.
    *
    */
   $scope.disapproveTranscription = function(stmt) {
      xapi.postStatement(ADL.verbs.failed, stmt.result, stmt.actor, stmt.object);
   }

   // Auf Login/Logout reagieren
   $scope.$on("lrs:login", function() {
      getUserDetails();
   });
   $scope.$on("lrs:statement", function() {
      getUserDetails();
   });

   // Auf die Auswahl eines Benutzers reagieren
   $scope.$watch(
      function(){return $routeParams.user},
      function(user) {
         if (!xapi.state.loggedIn) return;
         getUserDetails();
   });




}]);
