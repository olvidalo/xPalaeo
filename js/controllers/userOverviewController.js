/**
 * @ngdoc controller
 * @name app.controller:userOverviewController
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 * Controller für die Übersichtsseite für einen Benutzer im Studentenmodus.
 */

app.controller('UserOverviewController', ['$scope', '$rootScope', '$http', 'xapi', 'transcriptionQuery', function($scope, $rootScope, $http, xapi, transcriptionQuery) {


  /**
   * @ngdoc property
   * @name app.controller:userOverviewController#startedTranscriptions
   * @propertyOf app.controller:userOverviewController
   *
   * @description
   * Liste aller begonnenen Transkriptionen des aktuellen Benutzers
   *
   */
	  $scope.startedTranscriptions = [];

    /**
     * @ngdoc property
     * @name app.controller:userOverviewController#submittedTranscriptions
     * @propertyOf app.controller:userOverviewController
     *
     * @description
     * Liste aller eingereichten, noch nicht bewerteten Transkriptionen des aktuellen Benutzers
     *
     */
   	$scope.submittedTranscriptions = [];

    /**
     * @ngdoc property
     * @name app.controller:userOverviewController#ownCorrections
     * @propertyOf app.controller:userOverviewController
     *
     * @description
     * Liste der vom aktuellen Benutzer eingereichten Transkriptionen
     *
     */
   	$scope.ownCorrections = [];

    /**
     * @ngdoc property
     * @name app.controller:userOverviewController#corrections
     * @propertyOf app.controller:userOverviewController
     *
     * @description
     * Liste etwaiger Korrekturvorschläge für eingereichte Transkriptionen
     *
     */
   	$scope.corrections = [];

    /**
     * @ngdoc property
     * @name app.controller:userOverviewController#gradedTranskriptions
     * @propertyOf app.controller:userOverviewController
     *
     * @description
     * Liste aller bewerteten Transkriptionen des aktuellen Benutzers
     *
     */
    $scope.gradedTranscriptions = [];



    // Für jede eingereichte Transkription etwaige Korrekturvorschläge abrufen
   	var getCorrections = function(stmtId) {

   	  var searchOwnCorrections = ADL.XAPIWrapper.searchParams();
      searchOwnCorrections['verb'] = ADL.verbs.interacted.id;

      
      var corrections = Enumerable
    			.from(ADL.XAPIWrapper.getStatements(searchOwnCorrections).statements)
    			.where(function(x) {
    				return x.object.objectType == "StatementRef" &&
    					   x.object.id == stmtId
    			})
    			.toArray();  

      $scope.corrections[stmtId] = corrections;
   }


   //  Initialisierung
   var updateStatements = function() {
   	  $scope.startedTranscriptions = [];
   	  $scope.submittedTranscriptions = [];
   	  $scope.ownCorrections = [];
   	  $scope.corrections = [];
      $scope.gradedTranscriptions = [];

      var agent = angular.toJson({mbox: $scope.$parent.currentActor.mbox});

   	  // begonnene Transkriptionen sammeln

      transcriptionQuery.getStartedTranscriptions(
        agent,
          function(result) {
            $scope.$apply(function() {$scope.startedTranscriptions = result}); 
        });


      // eingereichte Transkriptionen sammeln
      transcriptionQuery.getSubmittedTranscriptions(agent, function(result){
         $scope.$apply(function() {$scope.submittedTranscriptions = result});

         // Eingereichte Korrekturvorschläge je Transkription
         angular.forEach(result, function(stmt) {
            transcriptionQuery.getCorrections(null, stmt.id, function(result){
               $scope.$apply(function(){$scope.corrections[stmt.id] = result});
            });
         });
      });

      // Bewertete Transkriptionen
      transcriptionQuery.getGradedTranscriptions(agent, function(result) {
         $scope.$apply(function() {$scope.gradedTranscriptions = result});
      });
 };

    $scope.corrections = {};

   
   $scope.$on("lrs:login", updateStatements);
   $scope.$on("lrs:statement", updateStatements);

   if (xapi.state.loggedIn) {
    updateStatements();
   }
}]);
