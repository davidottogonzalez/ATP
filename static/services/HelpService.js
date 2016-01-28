angular.module('ServicesModule').factory('HelpService', ['ngDialog',
    function(ngDialog){

    var openHelpDialog = function(file, scope){
        ngDialog.open({
            template:'static/partials/dialogs/help/' + file + '.html',
            scope: scope
        });
    };

    return {
        openHelpDialog: openHelpDialog
    };
}]);