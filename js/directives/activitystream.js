/**
 * @ngdoc directive
 * @directive activitystream
 * @name app.directive: activitystream
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 *
 * @description
 * Stellt ein wiederverwendbares Widget zur Anzeige von Activity Streams aus einem LRS
 * zur Verfügung 
 *
 * @param {string} [user]   Nur Statements des angegebenen Benutzers (xAPI-mbox-String) ausgeben (optional).     
 * 
 * @restrict E
 */

app.directive('activitystream', ['$rootScope', '$http', '$timeout', 'xapi', 'transcriptionQuery', function ($rootScope, $http, $timeout, xapi, transcriptionQuery) {
    return {
        restrict: 'E',
        templateUrl: 'templates/activitystream.html',
        scope: {

        },
        link: function(scope, element, attrs) {

             scope.statements = [];
             scope.user = ""; 
             scope.statementRefs = {};

             var updateStatements = function() {
                 $timeout(function () {
                     var search = ADL.XAPIWrapper.searchParams();
                     if (scope.user.length > 0 ) search['agent'] = angular.toJson({mbox: scope.user});
                     ADL.XAPIWrapper.getStatements(search, null, function(data) {
                        statements = angular.fromJson(data.response).statements;

                        // Statementreferenzen auflösen
                        angular.forEach(statements, function(stmt) {
                            if (stmt.object.objectType == "StatementRef") {
                                transcriptionQuery.getCorrectionObject(stmt.object.id, function(result) {
                                    scope.$apply(function() {
                                        scope.statementRefs[stmt.object.id] = result;
                                    });
                                });
                            }
                        });

                        scope.$apply(function(){scope.statements = statements;});
                  });
                 }, 0); 
            };

            var initialize = function() {
                if (xapi.state.loggedIn) updateStatements();
                scope.$on("lrs:login", updateStatements);
                scope.$on("lrs:statement", updateStatements);
            };

            if (angular.isDefined(attrs.user)) {
                attrs.$observe('user', function(val) {
                    scope.user = val;
                    initialize();
                });
            } else {
                initialize();
            }
           
        }
    };
}]);