/**
 * @ngdoc controller
 * @name app.controller:transcriptionController
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 *
 * Controller für die Dozentenübersicht.
 * 
 */


app.controller('TranscriptionController', ['$scope', '$rootScope', '$http', '$routeParams', '$location', 'xapi', function($scope, $rootScope, $http, $routeParams, $location, xapi) {
   
   /**
    * @ngdoc property
    * @name app.controller:transcriptionController#transcription
    * @propertyOf app.controller:transcriptionController
    *
    * @description
    * Modellvariable für die Transkription des angezeigten Textes
    *
    */
   $scope.transcription = "";

   /**
    * @ngdoc property
    * @name app.controller:transcriptionController#correctedTranscription
    * @propertyOf app.controller:transcriptionController
    *
    * @description
    * Modellvariable für die Korrektur der aktuellen Transkription
    *
    */
   $scope.correctedTranscription = "";

   /**
    * @ngdoc property
    * @name app.controller:transcriptionController#origUser
    * @propertyOf app.controller:transcriptionController
    *
    * @description
    * Im Korrekturmodus: Name des Benutzers, der die Originaltranskription eingereicht hat
    *
    */
   $scope.origUser = "";

   /**
    * @ngdoc property
    * @name app.controller:transcriptionController#currentActivityHasBeenSubmitted
    * @propertyOf app.controller:transcriptionController
    *
    * @description
    * Wahr, wenn die aktuell angezeigte Transkription vom angemeldeten Benutzer
    * bereits eingereicht wurde
    *
    */
   $scope.currentActivityHasBeenSubmitted = false;

   // Lade das TEI-Dokument der Transkription
   $scope.getTEI = function(id) {
	   $http
	   		.get(id)
	   		.success(function(data){
	   			$scope.tei = data['TEI'];
	   		});
   };

   // Initialisierung

   $scope.isLoggedIn = xapi.state.loggedIn;
   $scope.correctionOrigStmt = null;

   // Reagiere auf An-/Abmeldung
   $scope.$watch(function() {
      return xapi.state.loggedIn;   
   }, function(loggedIn) {
      $scope.isLoggedIn = loggedIn;

      if(loggedIn && !angular.isUndefined($scope.$parent.currentActivity)) {
         initializeTranscriptionView();
      }
   }, true);

   $scope.active = false;

   var initializeTranscriptionView = function() {
  
      if (!$scope.isLoggedIn) return;

      $scope.active = true;

      $scope.correctionMode = (angular.isDefined($routeParams.stmtid));
      if ($scope.correctionMode) {
         // initialisiere Korrektionsmodus
         search = ADL.XAPIWrapper.searchParams();
         search['statementId'] = $routeParams.stmtid;
         // rufe Originaltranskription ab
         statement = ADL.XAPIWrapper.getStatements(search);
         $scope.correctionOrigStmt = statement;
         xapi.state.currentActivity = statement.object.id;
         $scope.transcription = statement.result.response;
         $scope.correctedTranscription = statement.result.response;
         $scope.origUser = statement.actor.name;
      }

         $scope.transcriptionStarted = false;
         $scope.getTEI($scope.$parent.currentActivity);

         try {

            // Rufe eine evtl. zwischengespeicherte Transkription ab,
            // um die Bearbeitung fortzusetzen
            xapi.getState("transcription", function(data) {
                 $scope.transcription = data.transcription;
                 $scope.$apply();
            });

            // Wurde Transkription bereits begonnen oder
            // eingereicht?
            xapi.getState("transcriptionstate", function(data) {

               if (data.state == "finished") {
                  $scope.currentActivityHasBeenSubmitted = true;
               }

               if (!$scope.correctionMode) {    
                     if (data.state == "started") {
                           $scope.transcriptionStarted = true;
                           $scope.$apply();
                     }
               }
            });
            

          
         } catch (e) {}

      };


   // zeige immer die aktuell ausgewählte Transkription an
   $scope.$watch(function() {
   		return $scope.$parent.currentActivity;
   }, function(currentActivity) {
   		if (angular.isUndefined(currentActivity)) {
            $scope.active = false;
            return;
         };

      initializeTranscriptionView();

   }, true);

   /****** METHODEN *******/

   /**
    * @ngdoc property
    * @name app.controller:transcriptionController#transcriptionStarted
    * @propertyOf app.controller:transcriptionController
    *
    * @description
    * Wahr, wenn sich die aktuell geöffnete Transkription in Bearbeitung befindet
    *
    */
   $scope.transcriptionStarted = false;


   /**
    * @ngdoc method
    * @name app.controller:transcriptionController#startTranscription
    * @methodOf app.controller:transcriptionController
    * @description
    * Beginne die Transkription des geöffneten Textes und sende ein Statement darüber ins LRS.
    *
    */
   $scope.startTranscription = function() {
   		$scope.transcriptionStarted = true;
         xapi.postState("transcriptionstate", {state: "started"});
   		xapi.postStatement(ADL.verbs.launched);
   		
   };

   /**
    * @ngdoc method
    * @name app.controller:transcriptionController#saveTranscription
    * @methodOf app.controller:transcriptionController
    * @description
    * Speichere die aktuelle Transkription des geöffneten Textes, um die
    * Bearbeitung später fortsetzen zu können
    *
    */
   $scope.saveTranscription = function() {
      xapi.postStatement(ADL.verbs.interacted);
   	xapi.postState("transcription",  {transcription: $scope.transcription})
      $location.url("");
   };

   /**
    * @ngdoc method
    * @name app.controller:transcriptionController#submitTranscription
    * @methodOf app.controller:transcriptionController
    * @description
    * Reiche die aktuelle Transkription des geöffneten Textes zur Bewertung ein.
    *
    */
   $scope.submitTranscription = function() {
      xapi.deleteState("transcription")
      xapi.postState("transcriptionstate", {state: "finished"});
      xapi.postStatement(ADL.verbs.attempted, {response: $scope.transcription});
      $scope.transcriptionStarted = false;
   };
  
  /**
   * @ngdoc method
   * @name app.controller:transcriptionController#cancelTranscription
   * @methodOf app.controller:transcriptionController
   * @description
   * Breche die aktuelle Transkription ab und lösche ggf. die im LRS zwischengespeicherte
   * Transkription.
   *
   */
   $scope.cancelTranscription = function() {
   		$scope.transcriptionStarted = false;
         xapi.postStatement(ADL.verbs.exited);
   		xapi.deleteState("transcription");
   		xapi.deleteState("transcriptionstate");
   };

   /**
    * @ngdoc property
    * @name app.controller:transcriptionController#correctionStarted
    * @propertyOf app.controller:transcriptionController
    *
    * @description
    * Wahr, wenn die Korrektur einer von einem anderen Benutzer eingereichten
    * Transkription begonnen wurde.
    *
    */
   $scope.correctionStarted = false;

   /**
    * @ngdoc method
    * @name app.controller:transcriptionController#cancelTranscription
    * @methodOf app.controller:transcriptionController
    * @description
    * Beginne die Korrektur einer von einem anderen Benutzer eingereichten
    * Transkription.
    *
    */
   $scope.startCorrection = function() {
      $scope.correctionStarted = true;
   };

   /**
    * @ngdoc method
    * @name app.controller:transcriptionController#cancelTranscription
    * @methodOf app.controller:transcriptionController
    * @description
    * Reiche die Korrektur einer von einem anderen Benutzer eingereichten
    * Transkription ein.
    *
    */
   $scope.submitCorrection = function() {
      $scope.correctionStarted = false;
      xapi.postStatementAboutStatement(ADL.verbs.interacted, $scope.correctionOrigStmt, {response: $scope.correctedTranscription});
   };
}]);
