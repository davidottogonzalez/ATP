'use strict';

angular.module('myApp.user_editor', ['ngRoute', 'ngDialog'])

.config(['$routeProvider', 'ngDialogProvider', function($routeProvider, ngDialogProvider) {
  $routeProvider.when('/admin/user_editor', {
    templateUrl: 'static/admin/user_editor/user_editor.html',
    controller: 'UserEditorCtrl'
  });

  ngDialogProvider.setDefaults({
    className: 'ngdialog-theme-plain',
    showClose: true,
    closeByDocument: true,
    closeByEscape: true
  });
}])

.controller('UserEditorCtrl', ['$scope', '$http', 'ngDialog',
 function($scope, $http, ngDialog) {

    $scope.users = [];
    $scope.initiated = false;
    $scope.editingUser = {
        id: 0,
        username: '',
        password: ''
    }
    $scope.formButton = ''

    $scope.init = function() {
        $scope.reloadUsers();
    };

    $scope.reloadUsers = function() {
      $scope.users = [];

      $http.get('/admin/getUsers').then(function(res){
          $scope.users = res.data;
          $scope.initiated = true;
      });
    };

    $scope.showNewUserForm = function() {
        $scope.formButton = 'Add User'
        $scope.editingUser = {
            id: 0,
            username: '',
            password: ''
        };
        ngDialog.open({
            template:'static/partials/dialogs/user_form.html',
            scope: $scope
        });
    };

    $scope.loadUser = function(user){
        $scope.formButton = 'Update'
        ngDialog.open({
            template:'static/partials/dialogs/user_form.html',
            scope: $scope
        });
        $scope.editingUser = angular.copy(user);
    };

    $scope.saveUser = function() {
        if($scope.editingUser.id != 0)
        {
            $scope.formButton = 'Updating';
            $http.post('/admin/updateUser/',{updateUser: $scope.editingUser}).then(function(res){
                $scope.reloadUsers();
                $scope.formButton = 'Updated!';
            });
        }else
        {
            $scope.formButton = 'Adding User';
            $http.post('/admin/addUser/',{addUser: $scope.editingUser}).then(function(res){
                $scope.reloadUsers();
                $scope.formButton = 'Add User';
            });
        }
    };

    $scope.removeUser = function(user) {
        ngDialog.openConfirm({
            template:'static/partials/dialogs/confirm.html'
        }).then(function (confirm) {
            $scope.editingUser = {
                id: 0,
                username: '',
                password: ''
            };
            $http.post('/admin/removeUser/',{removeUser: user}).then(function(res){
                $scope.reloadUsers();
            });
        });
      };

    $scope.init();
}]);