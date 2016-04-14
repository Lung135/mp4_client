var mp4Controllers = angular.module('mp4Controllers', []);

mp4Controllers.controller('FirstController', ['$scope', 'CommonData'  , function($scope, CommonData) {
  $scope.data = "";
   $scope.displayText = ""

  $scope.setData = function(){
    CommonData.setData($scope.data);
    $scope.displayText = "Data set"

  };

}]);

mp4Controllers.controller('SecondController', ['$scope', 'CommonData' , function($scope, CommonData) {
  $scope.data = "";

  $scope.getData = function(){
    $scope.data = CommonData.getData();

  };

}]);


mp4Controllers.controller('LlamaListController', ['$scope', '$http', 'Llamas', '$window' , function($scope, $http,  Llamas, $window) {

  Llamas.get().success(function(data){
    $scope.llamas = data;
    console.log(data);
  });


}]);


mp4Controllers.controller('SettingsController', ['$scope' , '$window' , function($scope, $window) {
  $scope.url = $window.sessionStorage.baseurl;

  $scope.setUrl = function(){
    $window.sessionStorage.baseurl = $scope.url;
    $scope.displayText = "URL set";

  };

}]);

mp4Controllers.controller('UserListController', ['$scope', '$http', 'Users', '$window' , function($scope, $http,  Users, $window) {

  var baseurl = $window.sessionStorage.baseurl;

  $scope.getUsers = function() {
    Users.get().success(function(data){
      $scope.users = data;
      console.log(data);
    });
  }
  $scope.getUsers();

  $scope.deleteUser = function(userid, pending) {
    $http.delete(baseurl+'/api/users/'+userid).success(function(res) {
      console.log(res);
      $scope.getUsers();
      var findByAssignedUrl = baseurl + '/api/tasks?where={\"assignedUser\": \"'+userid+'\", \"completed\": false}';
      console.log(findByAssignedUrl);
      $http.get(findByAssignedUrl).success(function(tasksToUpdate) {
        console.log("here are the tasks to update");
        console.log(tasksToUpdate);
        var tasksToUpdateArr = tasksToUpdate.data;
        console.log(tasksToUpdateArr[0]);
        var i = 0;
        for(i = 0; i < tasksToUpdateArr.length; i++) {
          var j = i;
          var updateURL = baseurl + '/api/tasks/'+tasksToUpdateArr[j]._id;
          console.log("the update url is: " + updateURL);

          $http.put(updateURL, {
            name: tasksToUpdateArr[j].name,
            description: tasksToUpdateArr[j].description,
            deadline: tasksToUpdateArr[j].deadline,
            assignedUser: '',
            assignedUserName: 'unassigned',
            completed: false,
            dateCreated: tasksToUpdateArr[j].dateCreated
          }).success(function(updatedTask) {
            console.log("hello update made!!!");
            console.log(updatedTask);
          });

        }
      })
      //PUT request to unassign all tasks from the deleted user
      console.log(pending);
    })
  }

}]);

mp4Controllers.controller('UserDetailsController', ['$scope', '$http', 'Users', '$window', '$routeParams', function($scope, $http,  Users, $window, $routeParams) {

  //gets user and then gets pending tasks
  var completedShowing = false;
  var user;
  var baseurl = $window.sessionStorage.baseurl;
  var userid = $routeParams.userid;
  var thisisoutside = "wow it printed!";
  console.log("looking for: "+userid);
  $scope.hello = "looking for: "+userid;
  $scope.queryurl = baseurl + '/api/users/'+userid;
  $http.get($scope.queryurl).success(function(data) {
    $scope.user = data;
    user = data.data;
    console.log("the current user is");
    console.log(user);
    //get pending tasks
    $scope.pendingTasks = data.data.pendingTasks;
    $scope.pendingTasks = JSON.stringify($scope.pendingTasks);
    console.log($scope.pendingTasks);
    if($scope.pendingTasks != '[]') {
      var taskurl = baseurl + '/api/tasks/?where={\"_id\": {\"$in\": ' + $scope.pendingTasks + '}}';
      $http.get(taskurl).success(function(taskdata) {
        console.log("found something!");
        console.log(taskdata);
        $scope.tasks = taskdata;
      })
    }

  });

  $scope.completeTask = function(taskid) {
    //get task
    var taskurlput = baseurl+"/api/tasks/"+taskid;
    $http.get(taskurlput).success(function(data) {
      var task = data.data;
      console.log("task to complete: ")
      console.log(task);
      $http.put(taskurlput, {
        name: task.name,
        description: task.description,
        deadline: task.deadline,
        completed: true,
        assignedUser: task.assignedUser,
        assignedUserName: task.assignedUserName,
        dateCreated: task.dateCreated
      }).success(function(completedTask) {
        //update user pending tasks array
        //PUT user with removed pending task
        console.log("pending tasks before:");
        console.log(user.pendingTasks);

        var pendingArr = user.pendingTasks;
        var index = pendingArr.indexOf(taskid);
        if (index !== -1) {
            pendingArr.splice(index, 1);
        }
        console.log("and after:");
        console.log(pendingArr);
        $http.put($scope.queryurl, {
          name: user.name,
          email: user.email,
          pendingTasks: pendingArr
        }).success(function(updatedUser) {
          console.log("yay updated user");
          console.log(updatedUser);
          $scope.pendingTasks = JSON.stringify(updatedUser.data.pendingTasks);
          if($scope.pendingTasks != '[]') {
            var taskurl = baseurl + '/api/tasks/?where={\"_id\": {\"$in\": ' + $scope.pendingTasks + '}}';
            $http.get(taskurl).success(function(taskdata) {
              $scope.tasks = taskdata;
              //update completed
              if(completedShowing) {
                $scope.showCompletedTasks();
              }
            })
          }
          else {
            $scope.tasks = null;
          }
          //TODO: change $scope.pendingTasks
        })
      })
    });
  };

  $scope.showCompletedTasks = function() {
      //get all tasks
      completedShowing = true;
      $scope.truthFilter = {}
      //filter by {completed: true} and {assignedUser: user._id}... do in angular???
      $http.get(baseurl+'/api/tasks').success(function(alltasks) {
        console.log(alltasks);
        console.log("that is all tasks");
        $scope.alltasks = alltasks.data;
        console.log($scope.alltasks);
      })
  };

}]);

mp4Controllers.controller('TaskDetailsController', ['$scope', '$http', 'Users', '$window' , '$routeParams', function($scope, $http,  Users, $window, $routeParams) {
  var baseurl = $window.sessionStorage.baseurl;

  var taskid = $routeParams.taskid;
  var taskurl = baseurl + '/api/tasks/' + taskid;
  var t;
  $scope.getTask = function() {
      $http.get(taskurl).success(function(task) {
      $scope.task = task.data;
      t = task.data;
    });
  }
  $scope.getTask();

  $scope.changeStatus = function() {
    $http.put(taskurl, {
      name: t.name,
      description: t.description,
      deadline: t.deadline,
      assignedUser: t.assignedUser,
      assignedUserName: t.assignedUserName,
      completed: !(t.completed),
      dateCreated: t.dateCreated
    }).success(function(updatedTask) {
      $scope.updatedTask = updatedTask;
      $scope.getTask();
      console.log(updatedTask);
      if($scope.updatedTask.data.assignedUserName != 'unassigned') {
        console.log("the task had a user");
        $http.get(baseurl+'/api/users/'+$scope.updatedTask.data.assignedUser).success(function(user) {
          var u = user.data;
          var pending = u.pendingTasks;
          if($scope.updatedTask.data.completed) {
            //if its now completed, take it out of pending
            console.log("and the task was marked completed");
            var index = pending.indexOf($scope.updatedTask.data._id);
            if (index !== -1) {
                pending.splice(index, 1);
            }
            $http.put(baseurl+'/api/users/'+u._id, {
              name: u.name,
              email: u.email,
              pendingTasks: pending
            }).success(function(res) {
              console.log("took a task out of " + u.name);
            });
          }
          else {
            //if its now uncompleted, put it back in pending
            console.log("and the task was marked incomplete");
            console.log("so lets add this to pending"+$scope.updatedTask.data._id);
            console.log(pending);
            pending.push($scope.updatedTask.data._id);
            console.log(pending);
            $http.put(baseurl+'/api/users/'+u._id, {
              name: u.name,
              email: u.email,
              pendingTasks: pending
            }).success(function(res) {
              console.log("added a task to" + u.name);
            })
          }
        });
      }
      else {
        //its not a part of a user, so no chhanges needed
      }
    });
  }

}]);


mp4Controllers.controller('EditTaskController', ['$scope', '$http', 'Users', '$window' , '$routeParams', function($scope, $http,  Users, $window, $routeParams) {
  $scope.name;
  $scope.description;
  $scope.assignedUserObj = null;
  $scope.assignedUserName;
  $scope.deadline;
  $scope.task;
  var origUserId;

  var tasksurl = $window.sessionStorage.baseurl + '/api/tasks';
  var usersurl = $window.sessionStorage.baseurl + '/api/users';

  var taskid = $routeParams.taskid;
  var task;

  $scope.users;
  $http.get(usersurl).success(function(res) {
    console.log(res);
    $scope.users = res.data;
  });

  $http.get(tasksurl+'/'+taskid).success(function(res) {
    console.log(res);
    $scope.task = res.data;
    task = res.data;
    $scope.name = task.name;
    $scope.description = task.description;
    $scope.assignedUserName = task.assignedUserName;
    $scope.deadlinedate = task.deadline;
    origUserId = task.assignedUser;
  });

  $scope.editTask = function() {
    console.log('chosen user');
    console.log($scope.assignedUserObj);
    $scope.assignedUserObj = JSON.parse($scope.assignedUserObj);
    if($scope.assignedUserObj == null) {
      $scope.assignedUserObj = {_id: '', name: 'unassigned'};
    }

    $http.put(tasksurl+'/'+taskid, {
      name: $scope.name,
      description: $scope.description,
      deadline: $scope.deadline,
      completed: task.completed,
      assignedUser: $scope.assignedUserObj._id,
      assignedUserName: $scope.assignedUserObj.name
    }).success(function(updatedTask) {
      console.log('here is the updatedtask');
      console.log(updatedTask);
      $scope.message = updatedTask.message;
      task = updatedTask.data;
      $scope.name = task.name;
      $scope.description = task.description;
      $scope.deadlinedate = task.deadline;
      $scope.assignedUserName = task.assignedUserName;

      //if user is changed and task was pending, take if off of the users pendingTasks
      // if(!(task.completed)) {
      //   if(task.assignedUser != origUserId) {
      //     $http.get(usersurl + '?where={\"_id\": {\"$in\": [\"'+origUserId+'\",\"'+task.assignedUser+'\"]}}')
      //     .success(function(u) {
      //       console.log("found users:");
      //       console.log(u);
      //     })
      //   }
      // }
    });
  };

}]);


mp4Controllers.controller('AddUserController', ['$scope', '$http', 'Users', '$window' , '$routeParams', function($scope, $http,  Users, $window, $routeParams) {
  $scope.name;
  $scope.email;
  $scope.message;
  var usersurl = $window.sessionStorage.baseurl + '/api/users';

  $scope.addUser = function() {
    $http.post(usersurl, {
      name: $scope.name,
      email: $scope.email
    }).success(function(res) {
      $scope.message = res.message;
      console.log(res);
    }).error(function(res) {
      $scope.message = res.message;
      console.log(res);
    });
  }

}]);

mp4Controllers.controller('AddTaskController', ['$scope', '$http', 'Users', '$window' , '$routeParams', function($scope, $http,  Users, $window, $routeParams) {
  // $scope.hello = "hi there addtaskcontroller";

  $scope.name;
  $scope.description = '';
  $scope.deadline;
  $scope.assignedUserObj;
  $scope.message;
  $scope.selectedUser = null;

  var tasksurl = $window.sessionStorage.baseurl + '/api/tasks';
  var usersurl = $window.sessionStorage.baseurl + '/api/users';

  $scope.users;
  $http.get(usersurl).success(function(res) {
    console.log(res);
    $scope.users = res.data;
  });

  $scope.addTask = function() {
    if(typeof $scope.assignedUserObj != 'undefined') {
      $scope.assignedUserObj = JSON.parse($scope.assignedUserObj);
      $http.post(tasksurl, {
        name: $scope.name,
        deadline: $scope.deadline,
        description: $scope.description,
        assignedUser: $scope.assignedUserObj._id,
        assignedUserName: $scope.assignedUserObj.name,
        completed: false
      }).success(function(res) {
        $scope.message = res.message;
        var newTaskId = res.data._id;
        //TODO: if assigned user, PUT to that user with the new pending task
        var pending = $scope.assignedUserObj.pendingTasks;

        pending.push(newTaskId);
        $http.put(usersurl+'/'+$scope.assignedUserObj._id, {
          name: $scope.assignedUserObj.name,
          email: $scope.assignedUserObj.email,
          pendingTasks: pending
        }).success(function(res) {
          $scope.message += ' ' + res.message;
        });
      }).error(function(res) {
        $scope.message = res.message;
        console.log(res);
      });
    }

    else {
      console.log("no assigned user");
      $http.post(tasksurl, {
        name: $scope.name,
        deadline: $scope.deadline,
        description: $scope.description,
        assignedUser: '',
        assignedUserName: 'unassigned',
        completed: false
      }).success(function(res) {
        $scope.message = res.message;
        var newTaskId = res.data._id;
      }).error(function(res) {
        $scope.message = res.message;
        console.log(res);
      });
    }

  }

}]);

mp4Controllers.controller('TaskListController', ['$scope', '$http', 'Users', '$window' , function($scope, $http,  Users, $window) {
  $scope.start = 0;
  $scope.query = {};
  $scope.sortBy = ''
  $scope.viewStatus = 'pending';
  $scope.orderBy = 1;
  $scope.sorting = false;

  var tasksurl = $window.sessionStorage.baseurl + '/api/tasks';
  var users = $window.sessionStorage.baseurl + '/api/users';
  //get pending
  $scope.getPending = function() {
    $scope.viewStatus = 'pending';
    $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&where={\"completed\": false}')
    .success(function(tasks) {
      console.log(tasks);
      $scope.tasks = tasks.data;
    });
  };

  $scope.getComplete = function() {
    $scope.viewStatus = 'complete';
    $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&where={\"completed\": true}')
    .success(function(tasks) {
      console.log(tasks);
      $scope.tasks = tasks.data;
    });
  };

  $scope.getAll = function() {
    $scope.viewStatus = 'all';
    $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10')
    .success(function(tasks) {
      console.log(tasks);
      $scope.tasks = tasks.data;
    });
  };

  $scope.next10 = function() {
    console.log('nextclicked');
    $scope.start += 10;

    if(!($scope.sorting)) {
        if($scope.viewStatus == 'pending')
          $scope.getPending();
        else if($scope.viewStatus == 'complete')
          $scope.getComplete();
        else if($scope.viewStatus == 'all')
          $scope.getAll();
      }
    else {
        
      $scope.sortTasksKeepPage();
    }
  };


  $scope.previous10 = function() {
      $scope.start -= 10;
      if($scope.start < 0)
        $scope.start = 0;

      if(!($scope.sorting)) {
        if($scope.viewStatus == 'pending')
          $scope.getPending();
        if($scope.viewStatus == 'complete')
          $scope.getComplete();
        if($scope.viewStatus == 'all')
          $scope.getAll();
      }
      else {

        $scope.sortTasksKeepPage();
      }
  };

  $scope.same10 = function() {

    if(!($scope.sorting)) {
        if($scope.viewStatus == 'pending')
          $scope.getPending();
        else if($scope.viewStatus == 'complete')
          $scope.getComplete();
        else if($scope.viewStatus == 'all')
          $scope.getAll();
      }
    else {
        
      $scope.sortTasksKeepPage();
    }
  };

  $scope.viewPending = function() {
    $scope.start = 0;
    $scope.getPending();
  };
  $scope.viewComplete = function() {
    $scope.start = 0;
    $scope.getComplete();
  };
  $scope.viewAll = function() {
    $scope.start = 0;
    $scope.getAll();
  };

  $scope.deleteTask = function(userid, taskid, complete) {
    var tid = taskid;
    $http.delete(tasksurl+'/'+taskid).success(function(res) {
      $scope.message = res.message;

      if(userid != '' && !complete) {
        $http.get(usersurl+'/'+userid).success(function(user) {
          var pendingArr = user.data.pendingTasks;
          var index = pendingArr.indexOf(tid);
          if (index !== -1) {
              pendingArr.splice(index, 1);
          }
          $http.put(usersurl+'/'+userid, {
            name: user.data.name,
            email: user.data.email,
            pendingTasks: pendingArr
          }).success(function(updatedUser) {
            console.log(updatedUser);
            $scope.same10();
          });
        });
      }
      else
        $scope.same10();
    }).error(function(res) {
      $scope.message = res.message;
    });

  };

  $scope.sortTasks = function() {
    $scope.start = 0;
    console.log('time to sort!');
    console.log($scope.sortBy + ($scope.orderBy).toString());
    if($scope.sortBy == '')
      return;

    $scope.sorting = true;

    if($scope.viewStatus == 'pending') {
      $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&where={\"completed\": false}&sort={\"'+$scope.sortBy+'\":'+($scope.orderBy).toString()+'}')
      .success(function(tasks) {
        console.log(tasks);
        $scope.tasks = tasks.data;
      });
    }

    if($scope.viewStatus == 'complete') {
      $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&where={\"completed\": true}&sort={\"'+$scope.sortBy+'\":'+($scope.orderBy).toString()+'}')
      .success(function(tasks) {
        console.log(tasks);
        $scope.tasks = tasks.data;
      });
    }

    if($scope.viewStatus == 'all') {
      $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&sort={\"'+$scope.sortBy+'\":'+($scope.orderBy).toString()+'}')
      .success(function(tasks) {
        console.log(tasks);
        $scope.tasks = tasks.data;
      });
    }

  };

  $scope.sortTasksKeepPage = function() {

    console.log('time to sort!');
    console.log($scope.sortBy + ($scope.orderBy).toString());
    if($scope.sortBy == '')
      return;

    $scope.sorting = true;

    if($scope.viewStatus == 'pending') {
      $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&where={\"completed\": false}&sort={\"'+$scope.sortBy+'\":'+($scope.orderBy).toString()+'}')
      .success(function(tasks) {
        console.log(tasks);
        $scope.tasks = tasks.data;
      });
    }

    if($scope.viewStatus == 'complete') {
      $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&where={\"completed\": true}&sort={\"'+$scope.sortBy+'\":'+($scope.orderBy).toString()+'}')
      .success(function(tasks) {
        console.log(tasks);
        $scope.tasks = tasks.data;
      });
    }

    if($scope.viewStatus == 'all') {
      $http.get(tasksurl+'?skip='+($scope.start).toString()+'&limit=10&sort={\"'+$scope.sortBy+'\":'+($scope.orderBy).toString()+'}')
      .success(function(tasks) {
        console.log(tasks);
        $scope.tasks = tasks.data;
      });
    }

  };

  $scope.clearSort = function() {
    $scope.sorting = false;
    $scope.sortBy = '';
    $scope.start = 0;

    if($scope.viewStatus == 'pending') {
      console.log($scope.viewStatus);
      $scope.getPending();
    }
    if($scope.viewStatus == 'complete') {
      console.log($scope.viewStatus);
      $scope.getComplete();
    }
    if($scope.viewStatus == 'all') {
      console.log($scope.viewStatus);
      $scope.getAll();
    }
  };

  $scope.getPending(); //initially load pending only

}]);
// mp4Controllers.controller('UserListController', ['$scope', '$http', 'CommonData'  , function($scope, $http, CommonData) {
//   var baseurl = 'http://www.uiucwp.com:4000/api';
//   $scope.userList = [];
//   $scope.hello = "hello there!"
//   $http.get(baseurl+'/users').success(function(data) {
//     $scope.userList = data;
//     $scope.hello1 = "hello there lucas!"
//   });

// }]);