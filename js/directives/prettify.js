/**
 * @ngdoc directive
 * @directive prettify
 * @name app.directive: prettify
 *
 * @description
 * Syntaxhighlighting von Codeschnipseln durch prettify.js, unterstützt dynamische Bindings 
 *
 * *original von Ben Smith, StackOverflow*
 * *[http://stackoverflow.com/a/27514848]*
 * 
 * @restrict E
 */


app.directive('prettify', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: 'E',
        scope: false,
        link: function (scope, element, attrs) {
            var template = element.html();
            var templateFn = $compile(template);
            var update = function(){
                $timeout(function () {
                    var compiled = templateFn(scope).html();
                    var prettified = prettyPrintOne('<pre>' + compiled + '</pre>');
                    element.html(prettified);
                }, 0);
            }
            scope.$watch(
                function() {
                    var target = element[0].attributes.target.nodeValue;
                    return scope.$parent[element[0].attributes.target.nodeValue];
                }, function () {
                    update();
                }, true);
            update();
        }
    };
}]);