/**
 * @ngdoc service
 * @service xpalaeo
 * @name app.xpalaeo
 * @author Marcel Schaeben <m.schaeben@uni-koeln.de>
 *
 * @description
 * Hilfsfunktionen zur Kommunikation mit der eXist-basierten xPalaeo-Serverkomponente 
 *
 */


app.factory('xpalaeo', ['$http', 'XPALAEO_CONFIG', function($http, XPALAEO_CONFIG) { 
  return {

  	/**
  	 * @ngdoc 
  	 * @name app.xpalaeo#getExercises
  	 * @methodOf app.xpalaeo
  	 *
  	 * @description
  	 * Ruft alle als TEI hinterlegten Texte aus der eXist-Datenbank ab
  	 *
  	 */
  	getExercises: function() {
  		return $http.get(XPALAEO_CONFIG.appRoot + '/exercises')
		  .success(function(data) {
		  	console.log(data.activities);
		  	return data.activities;
		  });
  	}
  };
}]);