/**
 * @ngdoc service
 * @service xapi
 * @name app.xapi
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 *
 * @description
 * Hilfsfunktionen zur allgemeinen Kommunikation mit dem LRS über xAPI 
 * 
 */


app.factory('xapi', ['$http', '$rootScope', 'authService', function($http, $rootScope, authService) { 


   /**
    * @ngdoc property
    * @name app.xapi#state
    * @propertyOf app.xapi
    * @readonly
    *
    * @description
    * Zustandsobjekt des xAPI-Services. 
    *
    * - *currentActor* (Object): xAPI-Actor des aktuell eingeloggten Benutzers
    * - *currentActivity* (string): Die ID der aktuell angezeigten Transkription
    * - *loggedIn* (bool): Login-Status im LRS
    */
   var state = {currentActor: null,
                 currentActivity: null,
                 loggedIn: false };

  /* Zurücksetzen der xAPI-Konfiguration (intern) */
  var resetXAPIConfig = function() {
  		delete ADL.XAPIWrapper.lrs.user;
  		delete ADL.XAPIWrapper.lrs.password;
  		delete ADL.XAPIWrapper.lrs.endpoint;
  		this.currentActor = null;
  };


  /**
   * @ngdoc 
   * @name app.xapi#logout
   * @methodOf app.xapi
   *
   * @description
   * Vom LRS abmelden.
   * 
   */

  var logout = function() {
  	  	resetXAPIConfig();
  		$rootScope.$broadcast('lrs:logout')
      this.state.loggedIn = false;
  };

  /**
   * @ngdoc 
   * @name app.xapi#login
   * @methodOf app.xapi
   *
   * @description
   * Ins LRS einloggen.
   * 
   * @param {string} lrs Der xAPI-Endpoint des LRS.
   * @param {string} user LRS-Benutzername.
   * @param {string} password LRS-Passwort.
   * @param {string} mbox LRS-mbox-String (eMail) zur Identifikation des
   * Benutzers in Statements.
   */
  var login = function(lrs, user, password, mbox){
      var conf = {
       "endpoint": lrs,
       "user": user,
       "password": password
      };

      // XAPIWrapper mit LRS-Daten konfigurieren
      ADL.XAPIWrapper.changeConfig(conf);
      this.state.currentActor = new ADL.XAPIStatement.Agent("mailto:"+mbox, authService.username());

      // Statements abrufen, um zu sehen, ob das Login erfolgreich war
      ADL.XAPIWrapper.getStatements(null, null, function(req) {

        $rootScope.$broadcast('lrs:login', conf);
        state.loggedIn = true;
      })
    };

    // Bei Login-Fehler
    ADL.XAPIWrapper.xhrOnError = function(req) {
    	if (req.status == 401) logout();
    };


  return {
  	state: state,
  	login: login,
  	logout: logout,

    /**
     * @ngdoc 
     * @name app.xapi#postStatement
     * @methodOf app.xapi
     *
     * @description
     * Ein Statement ans LRS senden.
     * 
     * @param {Object} verb xAPI-Verb.
     * @param {Object} [result] xAPI-Result-Objekt (optional).
     * @param {Object} [actor] xAPI-Actor (optional. Standardmäßig der
     * gerade im LRS eingeloggte Benutzer).
     * @param {Object} [object] xAPI-Object (optional. Standardmäßig die
     * gerade geöffnete Transkription).
     */
  	postStatement: function(verb, result, actor, object) {
  		activity = angular.isDefined(object)? object : new ADL.XAPIStatement.Activity(this.state.currentActivity);
  		agent = angular.isDefined(actor)? actor : this.state.currentActor
  		stmt = new ADL.XAPIStatement(agent, verb, activity);
      if (angular.isDefined(result)) {
        stmt.result = result;
      }
  		ADL.XAPIWrapper.sendStatement(stmt, function() {
  			$rootScope.$broadcast("lrs:statement");
  		});
    },

    /**
     * @ngdoc 
     * @name app.xapi#postStatementAboutStatement
     * @methodOf app.xapi
     *
     * @description
     * Ein Statement über ein Statement ans LRS senden (für Benutzerkorrekturen).
     * xAPI-Actor ist immer der gerade im LRS eingeloggte Benutzer.
     * 
     * @param {Object} verb xAPI-Verb.
     * @param {Object} aboutStatement Das Statement, auf das sich das zu sendene
     * Statement bezieht
     * @param {Object} [result] xAPI-Result-Objekt (optional).
     */
    postStatementAboutStatement: function(verb, aboutStatement, result) {
      var actor = this.state.currentActor;
      var object = new ADL.XAPIStatement.StatementRef(aboutStatement.id);
      var statement = new ADL.XAPIStatement(actor, verb, object);
      if (angular.isDefined(result)) {
        statement.result = result;
      }
      ADL.XAPIWrapper.sendStatement(statement, function() {
        $rootScope.$broadcast("lrs:statement");
      });
    },

    /**
     * @ngdoc 
     * @name app.xapi#postState
     * @methodOf app.xapi
     *
     * @description
     * Speichert ein State-Objekt für die aktuell geöffnete Transkription sowie
     * den aktuell angemeldeten Benutzer im LRS.
     * 
     * @param {string} statename Der State-Name.
     * @param {Object} state Ein beliebiges State-Objekt.
     */
    postState: function(statename, state) {
    	ADL.XAPIWrapper.sendState(new ADL.XAPIStatement.Activity(this.state.currentActivity), this.state.currentActor, statename, null, state);
    },

    /**
     * @ngdoc 
     * @name app.xapi#getState
     * @methodOf app.xapi
     *
     * @description
     * Ruft ein zuvor für die aktuell geöffnete Transkription sowie
     * den aktuell angemeldeten Benutzer gespeichertes State-Objekt 
     * aus dem LRS ab.
     * 
     * @param {string} statename Der State-Name.
     * @param {stateCallback} Eine Callback-Funktion, die das Stateobjekt entgegennimmt
     */
    getState: function(statename, callback) {
    	ADL.XAPIWrapper.getState(new ADL.XAPIStatement.Activity(this.state.currentActivity), this.state.currentActor, statename, null, null, function(data) { 
    		try {
    			callback(angular.fromJson(data.response));
    		} catch(e) {}
    		
    	});
    },

    /**
     * @ngdoc 
     * @name app.xapi#deleteState
     * @methodOf app.xapi
     *
     * @description
     * Löscht ein zuvor für die aktuell geöffnete Transkription sowie
     * den aktuell angemeldeten Benutzer gespeichertes State-Objekt.
     * 
     * @param {string} statename Der State-Name.
     */
    deleteState: function(statename, callback) {
    	ADL.XAPIWrapper.deleteState(new ADL.XAPIStatement.Activity(this.state.currentActivity), this.state.currentActor, statename, null, null, null, function() {});
    }
  }
}]);