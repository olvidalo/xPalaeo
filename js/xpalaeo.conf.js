// Konfiguration für das eXist-basierte Serverbackend

app.constant('XPALAEO_CONFIG', function() {

	var existBaseUrl = 'http://localhost:8080';
	var appRoot = '/exist/apps/palaeoDozent';

	return {
		authenticateUrl: existBaseUrl + appRoot + '/user/login',
		existBaseUrl: existBaseUrl,
		appRoot: existBaseUrl + appRoot
	}
}());