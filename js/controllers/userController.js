/**
 * @ngdoc controller
 * @name app.controller:userController
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 * @description
 * 
 *
 * Controller für das Accountformular in der Navigationsleiste.
 * 
 */

app.controller('UserController', ['$scope', '$rootScope', '$http', '$location', 'xpalaeo', 'XPALAEO_CONFIG', 'xapi', 'authDefaults', 'authService', 'ngDialog', function($scope, $rootScope, $http, $location, xpalaeo, XPALAEO_CONFIG, xapi, authDefaults, authService, ngDialog) {

   // Konfiguration aus der xpalaeo.conf.js übernehmen
   authDefaults.authenticateUrl = XPALAEO_CONFIG.authenticateUrl;
   authService.addEndpoint(XPALAEO_CONFIG.existBaseUrl);

   var getSettings = function() {

      if (!$scope.isLoggedIn) {
         $location.url('/login');
         return;
      }

      $http
         .get(XPALAEO_CONFIG.appRoot + '/user/preferences')
         .success(function(data) {
            if (!data.hasOwnProperty("preferences")) return;
            $scope.settings = data.preferences
            xapi.login($scope.settings.lrsEndpoint, $scope.settings.lrsUser, $scope.settings.lrsPassword, $scope.settings.email);
            if (data.group == "teachers" && !$location.url().startsWith("/reporting")) $location.url("/reporting");
            else if ($location.url().startsWith("/login")) $location.url("/");
            $rootScope.group = data.group;
         });
   };


   // Anzeige bei Login und Logout aktualisieren
   $rootScope.$on('login', function() {
      $scope.isLoggedIn = true;
      getSettings();
   });

   $rootScope.$on('logout', function() {
      $scope.isLoggedIn = false;
      $location.url('/login');
      xapi.logout();
   });

   $scope.user = authService.username() ? authService.username() : "";
   $scope.password = "";

   if ($scope.user != "") {
      $rootScope.$broadcast("login");
   }


   $scope.settings = {
      email: "",
      lrsEndpoint: "",
      lrsUser: "",
      lrsPassword: ""
   };

   $scope.settingsDialog = null;


   /**
    * @ngdoc method
    * @name app.controller:userController#login
    * @methodOf app.controller:userController
    * @description
    * Mit den angegebenen Login-Daten an der eXist-Serverkomponente und am LRS anmelden.
    *
    */
   $scope.login = function() {
      authService
         .login($scope.user, $scope.password)
   };

   /**
    * @ngdoc method
    * @name app.controller:userController#saveSettings
    * @methodOf app.controller:userController
    * @description
    * Informationen über den LRS-Account des Benutzers an die eXist-Datenbank senden.
    *
    */
   $scope.saveSettings = function() {
      $http.post(XPALAEO_CONFIG.appRoot + '/user/preferences', $scope.settings)
            .success(function() {
               getSettings();
               if ($scope.settingsDialog != null) {
                  $scope.settingsDialog.close()
                  $scope.settingsDialog = null;
               }
            });
   }

   /**
    * @ngdoc method
    * @name app.controller:userController#logout
    * @methodOf app.controller:userController
    * @description
    * Von eXist und LRS abmelden.
    *
    */
   $scope.logout = function() {
      authService.logout();
      $scope.isLoggedIn = false;
      $rootScope.group = "students";
   };
   
   /**
    * @ngdoc method
    * @name app.controller:userController#openSettings
    * @methodOf app.controller:userController
    * @description
    * Den LRS-Einstellungsdialog öffnen.
    *
    */
   $scope.openSettings = function() {
     $scope.settingsDialog = ngDialog.open({template: 'templates/user-settings.html', scope: $scope});
   };


}]);
