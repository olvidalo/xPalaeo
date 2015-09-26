/**
 * @ngdoc service
 * @service transcriptionQuery
 * @name app.transcriptionQuery
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 *
 * @description
 * Stellt Funktionen zum Abruf von xAPI-Statements über Transkriptionen aus 
 * einem LRS zur Verfügung. 
 * 
 */

/**
 * Callback-Typ für Statement-Request
 *
 * @callback statementReqCallback
 * @param {Object[]} stmts - Zurückgegebene Statements
 */

app.factory('transcriptionQuery', ['$http', '$rootScope', function($http, $rootScope) { 

  /*
   * Generiert dynamische Suchparameter für den Abruf von Statements über xAPI
   * anhand der übergebenen Parameter
   */
  var makeSearch = function(agent, verb, activity) {
      var search = ADL.XAPIWrapper.searchParams();
      search['verb'] = verb;
      if (agent) search['agent'] = agent;
      if (activity) search['activity'] = activity;
      return search;
  };

  return {
    /**
     * @ngdoc 
     * @name app.transcriptionQuery#getStartedTranscriptions
     * @methodOf app.transcriptionQuery
     *
     * @description
     * Ruft alle Transkriptionen ab, die begonnen, aber noch nicht eingereicht
     * worden sind.
     * 
     * @param {Object} [agent] Nur Transkriptionen des angegebenen Benutzers
     * abrufen (optional).
     *
     * @param {requestCallback} callback Callbackfunktion, die die zurückgegebenen
     * Statements verarbeitet.
     */
  	getStartedTranscriptions: function(agent, callback) {
      ADL.XAPIWrapper.getStatements(makeSearch(null, ADL.verbs.launched.id), null, function(responseLaunched) {
         ADL.XAPIWrapper.getStatements(makeSearch(null, ADL.verbs.exited.id), null, function(responseExited) {
            ADL.XAPIWrapper.getStatements(makeSearch(null, ADL.verbs.attempted.id), null, function(responseAttempted) {
               var stmts = Enumerable
                           .from(angular.fromJson(responseLaunched.response).statements)
                           .concat(angular.fromJson(responseExited.response).statements)
                           .concat(angular.fromJson(responseAttempted.response).statements)
                           .groupBy(
                              function(x){return x.object.id;}, // Schlüssel
                              function(x){return x;}, // Zurückgegebenes Objekt
                                 function(id, group) {
                                    return group
                                             .orderByDescending(function(x){return x.timestamp;})
                                             .first();
                                    })
                           .where(function(x){return x.verb.id == ADL.verbs.launched.id;})
                           .toArray();
               
               callback(stmts);
            });
         });
      });
    },

    /**
     * @ngdoc 
     * @name app.transcriptionQuery#getSubmittedTranscriptions
     * @methodOf app.transcriptionQuery
     *
     * @description
     * Ruft alle Transkriptionen ab, die eingereicht, aber noch nicht 
     * bewertet worden sind.
     * 
     * @param {Object} [agent] Nur Transkriptionen des angegebenen Benutzers
     * abrufen (optional).
     *
     * @param {requestCallback} callback Callbackfunktion, die die zurückgegebenen
     * Statements verarbeitet.
     *
     * @param {string} [activity] Nur Transcriptionen für den angegebenen 
     * Text abrufen (Activity ID bzw. TEI-URL, optional).
     */
    getSubmittedTranscriptions: function(agent, callback, activity) {
      ADL.XAPIWrapper.getStatements(makeSearch(agent, ADL.verbs.attempted.id, activity), null, function(responseAttempted) {
        ADL.XAPIWrapper.getStatements(makeSearch(agent, ADL.verbs.passed.id, activity), null, function(responsePassed) {
          ADL.XAPIWrapper.getStatements(makeSearch(agent, ADL.verbs.failed.id, activity), null, function(responseFailed) {
            var stmts = Enumerable
               .from(angular.fromJson(responseAttempted.response).statements)
               .concat(angular.fromJson(responsePassed.response).statements)
               .concat(angular.fromJson(responseFailed.response).statements)
               .groupBy(
                  function(x){return x.object.id+x.actor.mbox; }, // Schlüssel
                  function(x){return x;}, // Zurückgegebenes Objekt
                     function(id, group) {
                        console.log(group.orderByDescending(function(x){return x.timestamp;}).toArray());
                        return group
                                 .orderByDescending(function(x){return x.timestamp;})
                                 .first();
                        })
               .where(function(x) {
                  return x.verb.id == ADL.verbs.attempted.id;
               })
               .toArray();

            callback(stmts);
          });
        });
      });
    },

    /**
     * @ngdoc 
     * @name app.transcriptionQuery#getCorrections
     * @methodOf app.transcriptionQuery
     *
     * @description
     * Ruft alle von Benutzern eingereichten Korrekturen ab
     * 
     * @param {Object} [agent] Nur Korrekturen des angegebenen Benutzers
     * abrufen (optional).
     *
     * @param {string} [stmtId] Nur Korrekturen für den angegebenen Text
     * zurückgeben (Activity ID bzw. URL des Texts)
     *
     * @param {requestCallback} callback Callbackfunktion, die die zurückgegebenen
     * Statements verarbeitet.
     */
    getCorrections: function(agent, stmtId, callback) {
      ADL.XAPIWrapper.getStatements(makeSearch(agent, ADL.verbs.interacted.id), null, function(responseInteracted) {
         var corrections = Enumerable
               .from(angular.fromJson(responseInteracted.response).statements)
               .where(function(x) {
                  if (stmtId == null) {
                    return x.object.objectType == "StatementRef";
                  } else {
                    return  x.object.objectType == "StatementRef" &&
                            x.object.id == stmtId;
                  }
               })
               .toArray(); 
         
         callback(corrections);
      });
    },

    /**
     * @ngdoc 
     * @name app.transcriptionQuery#getGradedTranscriptions
     * @methodOf app.transcriptionQuery
     *
     * @description
     * Ruft alle Transkriptionen ab, die Bewertet worden sind
     * (als "failed" oder "passed").
     *
     * @param {Object} [agent] Nur Transkriptionen des angegebenen Benutzers
     * abrufen (optional).
     *
     * @param {requestCallback} callback Callbackfunktion, die die zurückgegebenen
     * Statements verarbeitet.
     */
    getGradedTranscriptions: function(agent, callback) {
      ADL.XAPIWrapper.getStatements(makeSearch(agent, ADL.verbs.passed.id), null, function(responsePassed) {
         ADL.XAPIWrapper.getStatements(makeSearch(agent, ADL.verbs.failed.id), null, function(responseFailed) {
            var stmts = Enumerable
               .from(angular.fromJson(responsePassed.response).statements)
               .concat(angular.fromJson(responseFailed.response).statements)
               .toArray();

            callback(stmts);
         });
      });
    },

    /**
     * @ngdoc 
     * @name app.transcriptionQuery#getCorrectionObject
     * @methodOf app.transcriptionQuery
     *
     * @description
     * Ruft das Originalstatement für die Transkription ab, auf die sich die
     * angegebene Korrektur bezieht
     * 
     * @param {string} [stmtId] Statement-ID des Objektes aus dem Korrektur-
     * Statement.
     *
     * @param {requestCallback} callback Callbackfunktion, die die zurückgegebenen
     * Statements verarbeitet.
     */
    getCorrectionObject: function(stmtId, callback) {
      var search = ADL.XAPIWrapper.searchParams();
      search['statementId'] = stmtId;
      ADL.XAPIWrapper.getStatements(search, null, function(req) {
          callback(angular.fromJson(req.response));
      });
    }
  }
}]);