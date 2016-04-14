var app = angular.module('mp4', ['ngRoute', 'mp4Controllers', 'mp4Services']);

app.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
    when('/firstview', {
    templateUrl: 'partials/firstview.html',
    controller: 'FirstController'
  }).
  when('/secondview', {
    templateUrl: 'partials/secondview.html',
    controller: 'SecondController'
  }).
  when('/settings', {
    templateUrl: 'partials/settings.html',
    controller: 'SettingsController'
  }).
  when('/llamalist', {
    templateUrl: 'partials/llamalist.html',
    controller: 'LlamaListController'
  }).
  when('/userlist', {
    templateUrl: 'partials/userlist.html',
    controller: 'UserListController'
  }).
  when('/userlist/:userid*', {
            templateUrl : './partials/userdetails.html',
            controller  : 'UserDetailsController',
  }).
  when('/tasks/:taskid*', {
            templateUrl : './partials/taskdetails.html',
            controller  : 'TaskDetailsController',
  }).
  when('/edittask/:taskid*', {
            templateUrl : './partials/edittask.html',
            controller  : 'EditTaskController',
  }).
  when('/adduser', {
            templateUrl : './partials/adduser.html',
            controller  : 'AddUserController',
  }).
  when('/addtask', {
            templateUrl : './partials/addtask.html',
            controller  : 'AddTaskController',
  }).
  when('/tasklist', {
            templateUrl : './partials/tasklist.html',
            controller  : 'TaskListController',
  }).
  otherwise({
    redirectTo: '/settings'
  });
}]);
