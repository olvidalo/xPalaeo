/**
 * @ngdoc overview
 * @name app
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 * Hauptmodul für die xPalaeo-App.
 */

var app = angular
			.module('xpalaeo', ['xml', 'angularBasicAuth', 'ngDialog', 'ngRoute', 'ui.ace'])
			.config(['$httpProvider', '$routeProvider', function($httpProvider, $routeProvider) {
				// Konfiguration für Crossdomain-Requests
				$httpProvider.defaults.useXDomain = true;
				delete $httpProvider.defaults.headers.common['X-Requested-With'];

				// Alle ankommenden XML-Daten in JSON übersetzen
				$httpProvider.interceptors.push('xmlHttpInterceptor');
				$httpProvider.defaults.headers.post["Content-Type"] = "text/plain";

				// XML-Editor konfigurieren
				ace.config.set("basePath", "vendor/js/ace");

				//Routen konfigurieren
				var mainRoute = {
					templateUrl: 'templates/main.html',
					controller: 'MainController'
				};

				var reportingRoute = {
					templateUrl: 'templates/reporting.html',
					controller: "ReportingController"
				};

				var loginRoute = {
					templateUrl: 'templates/login.html'
				};

				$routeProvider
					.when('/', mainRoute)
					.when('/corr/:stmtid', mainRoute)
					.when('/reporting/:user', reportingRoute)
					.when('/reporting', reportingRoute)
					.when('/login/', loginRoute);

			}]).filter('encodeUri', [
				/**
				 * @ngdoc filter
				 * @name app.filter:encodeUri
				 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
				 * @description
				 * 
				 * Strings zur Verwendung als GET-Parameter kodieren
				 */

  				'$window',
				 function ($window) {
 				   return $window.encodeURIComponent;
  			}]).filter('toXml', [

  				/**
  				 * @ngdoc filter
  				 * @name app.filter:toXML
  				 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
  				 * @description
  				 * 
  				 * JSON mittles x2js in einen XML-String konvertieren
  				 * und mit vkbeautify.js formatieren
  				 */

  				'x2js',
				 function (x2js) {
 				   	return function(input) {
 				   		return vkbeautify.xml(x2js.json2xml_str(input));
 				   	};
  			}]).run(function($rootScope, xapi, xpalaeo) {

  				// Initialisierung 

  				$rootScope.group = "students";
  				$rootScope.loggedIn = xapi.state.loggedIn;
  				$rootScope.$watch(
  					function() { return xapi.state.loggedIn; },
  					function(loggedIn) { $rootScope.loggedIn = loggedIn; }
  				);

  				// Activity Definitions für Transkriptionen 
  				$rootScope.activityDefinitions = {};
  				xpalaeo.getExercises().success(function(data) {
  				   angular.forEach(data.activities, function(x) {
  				      $rootScope.activityDefinitions[x.activity.id] = x.activity.definition;
  				   });
  				});

  				// Hilfsfunktionen
  				$rootScope.Utils = {
   				  keys : Object.keys
  				};
  				$rootScope.titleForActivity = function(id) {
  						if($rootScope.activityDefinitions.hasOwnProperty(id)) {
  				         return $rootScope.activityDefinitions[id].name["en-US"];
  				      }
  				      else return id;
  				};	
  			});
		