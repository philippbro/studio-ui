(function (angular, $) {
    'use strict';

    var app = angular.module('studio');

    app.service('adminService', [
        '$http', 'Constants', '$cookies', '$timeout', '$window',
        function ($http, Constants, $cookies, $timeout, $window) {

            var me = this;

            this.getSites = function() {
                return $http.get(users('get-sites-3'));
            };

            //USERS

            this.getUsers = function(params) {

                if(params && params.site_id && params.site_id != "all"){
                    return $http.get(users('get-per-site'), {
                        params: params
                    });
                }else{
                    return $http.get(users('get-all'), {
                        params: params
                    });
                }
            };

            this.getUser = function(username) {
                return $http.get(users('get', 'username=' + username));
            };

            this.createUser = function (user) {
                return $http.post(users('create'),user);
            };

            this.editUser = function(user) {
                return $http.post(users('update'), user);
            };

            this.deleteUser = function(user){
                return $http.post(users('delete'), user);
            };

            this.getUserStatus = function(username){
                return $http.get(users('status', 'username=' + username));
            };

            this.toggleUserStatus = function(user, status){
                return $http.post(users(status), user);
            };

            this.setPassword = function(data){
                return $http.post(users('set-password'), data);
            };

            //Allow the administrator to reset Crafter Studio’s user password provided.
            this.resetPassword = function(data){
                return $http.post(users('reset-password'), data);
            };

            this.changePassword = function(data){
                return $http.post(users('change-password'), data);
            };

            this.forgotPassword = function(username){
                return $http.get(users('forgot-password', 'username=' + username));
            };

            //GROUPS

            this.getGroups = function(params) {
                if(params.site_id && params.site_id != "all"){
                    return $http.get(groups('get-per-site'), {
                        params: params
                    });
                }else{
                    return $http.get(groups('get-all'), {
                        params: params
                    });
                }
            };

            this.getGroup = function(group) {
                return $http.get(groups('get', 'group_name=' + group.group_name + '&site_id=' + group.site_id));
            };

            this.getUsersFromGroup = function(group) {
                return $http.get(groups('users', 'group_name=' + group.group_name + "&site_id=" + group.site_id));
            };

            this.deleteUserFromGroup = function(user){
                return $http.post(groups('remove-user'), user);
            };

            this.createGroup = function (group) {
                return $http.post(groups('create'),group);
            };

            this.editGroup = function(group) {
                return $http.post(groups('update'), group);
            };

            this.deleteGroup = function(group){
                return $http.post(groups('delete'), group);
            };

            this.addUserToGroup = function(data) {
                return $http.post(groups('add-user'), data);
            };

            //AUDIT

            this.getAudit = function(data) {
                return $http.get(audit('get'), {
                    params: data
                })
            };



            function api(action) {
                return Constants.SERVICE + 'site/' + action + '.json';
            }

            function users(action, params) {
                if(params){
                    return Constants.SERVICE + 'user/' + action + '.json?' + params;
                }else {
                    return Constants.SERVICE + 'user/' + action + '.json';
                }
            }

            function groups(action, params) {
                if(params){
                    return Constants.SERVICE + 'group/' + action + '.json?' + params;
                }else {
                    return Constants.SERVICE + 'group/' + action + '.json';
                }
            }

            function audit(action, data) {
                return Constants.SERVICE + 'audit/' + action + '.json?';
            }

            return this;

        }
    ]);

    app.controller('AdminCtrl', [
        '$scope', '$state', '$window', '$sce', 'adminService', '$modal', '$timeout',
        'Upload', '$stateParams', '$translate', '$location',
        function ($scope, $state, $window, $sce, adminService, $modal, $timeout,
                  Upload, $stateParams, $translate, $location) {

            var current = $state.current.name.replace(/\./g, '');

            this.init = function() {
                $scope.debounceDelay = 500;

                adminService.getSites()
                    .success(function (data) {
                        $scope.sites = data;
                    })
                    .error(function () {
                        $scope.sites = null;
                    });

                //sites dropdown
                $scope.currentSite = {
                    name : "All Sites",
                    id: "all"
                };
                $scope.updateDropdown = function(siteId, siteName) {
                    $scope.currentSite = {
                        name: siteName,
                        id: siteId
                    };
                };

                $scope.showModal = function(template, size, verticalCentered){
                    return $modal.open({
                        templateUrl: template,
                        windowClass: verticalCentered ? 'centered-dialog' : '',
                        backdrop: 'static',
                        keyboard: false,
                        controller: 'AdminCtrl',
                        scope: $scope,
                        size: size ? size : ''
                    });
                };
                $scope.hideModal = function() {
                    $scope.adminModal.close();
                };
                $scope.uploadFiles = function(file, errFiles) {         //TODO: change upload to submit button
                    $scope.f = file;
                    $scope.errFile = errFiles && errFiles[0];
                    if (file) {
                        file.upload = Upload.upload({
                            // url: 'https://angular-file-upload-cors-srv.appspot.com/upload',
                            url: '',
                            data: {file: file}
                        });

                        file.upload.then(function (response) {
                            $timeout(function () {
                                file.result = response.data;
                            });
                        }, function (response) {
                            if (response.status > 0)
                                $scope.errorMsg = response.status + ': ' + response.data;
                        }, function (evt) {
                            file.progress = Math.min(100, parseInt(100.0 *
                                evt.loaded / evt.total));

                            if(file.progress == 100) {
                                file.uploaded = 'completed';
                            }
                        });
                    }
                }
                $scope.notification = function(notificationText, showOnTop){
                    var verticalAlign = showOnTop ? false : true;
                    $scope.notificationText = notificationText;
                    $scope.notificationType = 'alert';

                    var modal = $scope.showModal('notificationModal.html', 'sm', verticalAlign);

                    $timeout(function () {
                        modal.close();
                    }, 1500, false);

                };
            };
            
            this.homeadmin = function() {
            };

            this.homegroups = function() {

                $scope.groups = {};
                var groups = $scope.groups;

                this.init();

                $scope.assignUsers = false;
                $scope.toggleAssignUsersLabel = $translate.instant('admin.groups.ASSIGN_USERS_LABEL');
                $scope.noGroupSelected = true;
                
                //table setup
                groups.itemsPerPage=10;
                $scope.groupsCollection = [];

                var getGroups = function(site) {

                    groups.totalUsers = 0;
                    getResultsPage(1);

                    groups.pagination = {
                        current: 1
                    };

                    groups.pageChanged = function(newPage) {
                        getResultsPage(newPage);
                    };

                    function getResultsPage(pageNumber) {

                        var params = {};

                        params.site_id = site;

                        adminService.getGroups(params).success(function (data) {
                            if(data.sites){
                                var groupsCollection = {
                                    "groups": []
                                };
                                for(var x = 0; x < data.sites.length; x++){
                                    var site = data.sites[x],
                                        site_id = site.site_id;

                                    for(var y = 0; y < site.groups.length; y++){
                                        var group = site.groups[y];
                                        group.site_id = site_id;
                                        groupsCollection.groups.push(group);
                                    }
                                }

                                $scope.groupsCollection = groupsCollection;

                                groups.totalLogs = $scope.groupsCollection.groups.length;

                                if(groups.totalLogs > 0){
                                    var start = (pageNumber - 1) * groups.itemsPerPage,
                                        end = start + groups.itemsPerPage;
                                    params.start = start;
                                    params.number = groups.itemsPerPage;
                                }

                                adminService.getGroups(params).success(function (data) {
                                    if(data.sites){
                                        var groupsCollection = {
                                            "groups": []
                                        };
                                        for(var x = 0; x < data.sites.length; x++){
                                            var site = data.sites[x],
                                                site_id = site.site_id;

                                            for(var y = 0; y < site.groups.length; y++){
                                                var group = site.groups[y];
                                                group.site_id = site_id;
                                                groupsCollection.groups.push(group);
                                            }
                                        }

                                        $scope.groupsCollection = groupsCollection;
                                    }else{
                                        $scope.groupsCollection = data;
                                    }
                                });

                            }else{
                                // $scope.groupsCollection = data;
                            }



                        }).error(function (error) {
                            console.log(error);
                            //TODO: properly display the error.
                        });
                    }
                };
                // getGroups();

                $scope.$watch('currentSite', function() {
                    getGroups($scope.currentSite.id);
                    $scope.usersFromGroupCollection = {};
                });

                $scope.toggleAssignUsers = function() {
                    $scope.assignUsers = !$scope.assignUsers;
                    if($scope.assignUsers){
                        $scope.toggleAssignUsersLabel = $translate.instant('admin.groups.VIEW_GROUPS_LABEL');
                    }else{
                        $scope.toggleAssignUsersLabel = $translate.instant('admin.groups.ASSIGN_USERS_LABEL');
                    }
                }

                $scope.createGroupDialog = function(){
                    $scope.group = {};
                    $scope.okModalFunction = $scope.createGroup;

                    $scope.adminModal = $scope.showModal('modalView.html');

                    $scope.dialogMode = $translate.instant('common.CREATE');
                    $scope.dialogTitle = $translate.instant('admin.groups.CREATE_GROUP');
                }
                $scope.createGroup = function(group) {
                    $scope.hideModal();

                    adminService.createGroup(group).success(function (data) {
                        $scope.groupsCollection.groups.push(group);
                        $scope.notification('\''+ group.group_name + '\' created.');
                    }).error(function(error){
                        console.log(error);
                        //TODO: properly display error.
                    });

                };
                $scope.editGroupDialog = function(group){
                    $scope.editedGroup = group;
                    $scope.group = {};
                    $scope.okModalFunction = $scope.editGroup;

                    $scope.adminModal = $scope.showModal('modalView.html');
                    $scope.dialogMode = $translate.instant('common.EDIT');
                    $scope.dialogTitle = $translate.instant('admin.groups.EDIT_GROUP');

                    adminService.getGroup(group).success(function (data) {
                        $scope.group = data;
                    }).error(function () {
                        //TODO: properly display error.
                    });
                };
                $scope.editGroup = function(group) {
                    $scope.hideModal();

                    var createModalInstance = $modal.open({
                        templateUrl: 'creatingGroupConfirmation.html',
                        backdrop: 'static',
                        keyboard: false,
                        size: 'sm'
                    });
                    adminService.editGroup(group).success(function (data) {
                        var index = $scope.groupsCollection.groups.indexOf($scope.editedGroup);

                        if(index != -1){
                            group.group_description = group.description;
                            $scope.groupsCollection.groups[index] = group;
                            $scope.displayedCollection = $scope.groupsCollection.groups;
                        }
                        $scope.notification('\''+ group.group_name + '\' edited.');

                        createModalInstance.close();
                    }).error(function(error){
                        console.log(error);
                        //TODO: properly display error.
                    });
                };
                $scope.removeGroup = function(group) {
                    var deleteGroup = function() {
                        adminService.deleteGroup(group).success(function (data) {
                            var index = $scope.groupsCollection.groups.indexOf(group);
                            if (index !== -1) {
                                $scope.groupsCollection.groups.splice(index, 1);
                            }

                            $scope.usersFromGroupCollection = [];
                            $scope.noGroupSelected = true;

                            $scope.notification('\''+ group.group_name + '\' group deleted.');

                        }).error(function (error) {
                            console.log(error);
                            //TODO: properly display error;
                        });
                    };

                    $scope.confirmationAction = deleteGroup;
                    $scope.confirmationText = "Do you want to delete " + group.group_name + "?";

                    $scope.adminModal = $scope.showModal('confirmationModal.html', 'sm', true);
                };
                $scope.getUsersFromGroup = function(group){
                    $scope.usersFromGroupCollection = { users: [] };
                    $scope.activeGroup = group;
                    $scope.noGroupSelected = false;

                    if(!group.site_id){
                        group.site_id = $scope.currentSite.id;
                    }

                    $scope.removeUserFromGroup = function(user) {

                        user.group_name = group.group_name;
                        user.site_id = group.site_id;

                        var removeUserFromGroup = function() {
                            adminService.deleteUserFromGroup(user).success(function () {
                                var index = $scope.usersFromGroupCollection.users.indexOf(user);
                                if (index !== -1) {
                                    $scope.usersFromGroupCollection.users.splice(index, 1);
                                }
                            }).error(function () {
                                var index = $scope.usersFromGroupCollection.users.indexOf(user);
                                if (index !== -1) {
                                    $scope.usersFromGroupCollection.users.splice(index, 1);
                                }
                            });
                        };

                        $scope.confirmationAction = removeUserFromGroup;
                        $scope.confirmationText = "Do you want to delete " + user.username + " from " + group.group_name + "?";

                        $scope.adminModal = $scope.showModal('confirmationModal.html', 'sm');
                    };
                    
                    adminService.getUsersFromGroup(group).success(function (data) {
                        var users = data;
                        $scope.usersFromGroupCollection = users;

                        console.log($scope.usersFromGroupCollection);
                    }).error(function () {
                        //TODO: properly display error
                        console.log($scope.usersFromGroupCollection);
                    });
                };
                $scope.addUserToGroupDialog = function () {
                    $scope.userSelected = {};

                    $scope.adminModal = $scope.showModal('addUsersView.html');

                    adminService.getUsers().success(function (data) {

                        if($scope.usersFromGroupCollection.users) {
                            var usersData = { 'users': [] };

                            for(var x = 0; x < data.users.length; x++) {
                                var currentUser = data.users[x],
                                    added = false;

                                for(var y = 0; y < $scope.usersFromGroupCollection.users.length; y++){
                                    if(currentUser.username === $scope.usersFromGroupCollection.users[y].username){
                                        added = true;
                                    }
                                }
                                if(!added){
                                    usersData.users.push(currentUser);
                                }
                            }

                            $scope.usersCollection = usersData;
                        }else{
                            $scope.usersCollection = data;
                        }

                        console.log($scope.usersFromGroupCollection);
                        $scope.test = $scope.usersFromGroupCollection;
                    }).error(function (error) {
                        // console.log(error);
                    });
                };
                $scope.addUserToGroup = function (user) {
                    var activeGroup = $scope.activeGroup;
                    $scope.usersFromGroupCollection = $scope.test;

                    adminService.addUserToGroup({
                        "username": user.username,
                        "group_name": activeGroup.group_name,
                        "site_id": activeGroup.site_id
                    }).success(function (data) {
                        //TODO: set users to scope

                        $scope.usersFromGroupCollection.users.push(user);
                        $scope.hideModal();

                    }).error(function () {
                        $scope.hideModal();
                    });
                }
            };

            // this[current]();

        }
    ])

    app.controller('AuditCtrl', [
        '$scope', '$state', '$window', '$sce', 'adminService', '$modal', '$timeout',
        'Upload', '$stateParams', '$translate', '$location',
        function ($scope, $state, $window, $sce, adminService, $modal, $timeout,
                  Upload, $stateParams, $translate, $location) {

            $scope.audit = {};
            var audit = $scope.audit;
            audit.logsPerPage = 15;
            audit.defaultDelay = 500;
            audit.site = $location.search().site;
            var delayTimer;

            var getUsers = function(site) {
                adminService.getUsers(site)
                    .success(function (data) {
                        audit.users = data.users;
                        audit.userSelected = '';
                    })
                    .error(function () {
                        audit.users = null;
                    });
            };

            var getAudit = function(site) {
                audit.totalLogs = 0;
                getResultsPage(1);

                audit.pagination = {
                    current: 1
                };

                audit.pageChanged = function(newPage) {
                    getResultsPage(newPage);
                };

                function getResultsPage(pageNumber) {

                    var params = {};
                    params.site_id = site;
                    if(audit.userSelected && audit.userSelected != '') params.user = audit.userSelected;

                    if(audit.actions.length > 0){
                        params.actions = JSON.stringify(audit.actions);
                    }

                    if(audit.totalLogs && audit.totalLogs > 0) {
                        var start = (pageNumber - 1) * audit.logsPerPage,
                            end = start + audit.logsPerPage;
                        params.start = start;
                        params.number = audit.logsPerPage;
                    }else{
                        params.start = 0;
                        params.number = audit.logsPerPage;
                    }

                    adminService.getAudit(params).success(function (data) {
                        audit.totalLogs = data.total;
                        audit.logs = data.items;
                    });
                }
            };

            audit.updateUser = function(user){
                if(user){
                    audit.userSelected = user.username;
                }else{
                    audit.userSelected = '';
                }

                $timeout.cancel(delayTimer)
                delayTimer = $timeout(function() {
                    getAudit(audit.site);
                }, audit.defaultDelay);
            };

            audit.actions = [];
            audit.updateActions = function(action) {
                if(action === "all"){
                    audit.actions = [];
                }else{
                    if(audit.actions.indexOf(action) != -1){
                        var index = audit.actions.indexOf(action);

                        if (index !== -1) {
                            audit.actions.splice(index, 1);
                        }
                    }else{
                        audit.actions.push(action);
                    }
                }

                audit.actionsInputVal = audit.actions.toString();

                $timeout.cancel(delayTimer);
                delayTimer = $timeout(function() {
                    getAudit(audit.site);
                }, audit.defaultDelay);

            };

            getAudit(audit.site);

        }
    ]);

    app.controller('UsersCtrl', [
        '$scope', '$state', '$window', '$sce', 'adminService', '$modal', '$timeout',
        'Upload', '$stateParams', '$translate', '$location',
        function ($scope, $state, $window, $sce, adminService, $modal, $timeout,
                  Upload, $stateParams, $translate, $location) {

            $scope.users = {};
            var users = $scope.users;

            this.init = function() {
                $scope.debounceDelay = 500;

                $scope.showModal = function(template, size, verticalCentered){
                    return $modal.open({
                        templateUrl: template,
                        windowClass: verticalCentered ? 'centered-dialog' : '',
                        backdrop: 'static',
                        keyboard: false,
                        controller: 'UsersCtrl',
                        scope: $scope,
                        size: size ? size : ''
                    });
                };
                $scope.hideModal = function() {
                    $scope.adminModal.close();
                };
                $scope.notification = function(notificationText, showOnTop){
                    var verticalAlign = showOnTop ? false : true;
                    $scope.notificationText = notificationText;
                    $scope.notificationType = 'alert';

                    var modal = $scope.showModal('notificationModal.html', 'sm', verticalAlign);

                    $timeout(function () {
                        modal.close();
                    }, 1500, false);

                };
            };
            this.init();

            //table setup
            users.itemsPerPage = 10;
            $scope.usersCollection = {};

            var getUsers = function() {
                users.totalUsers = 0;
                getResultsPage(1);

                users.pagination = {
                    current: 1
                };

                users.pageChanged = function(newPage) {
                    getResultsPage(newPage);
                };

                function getResultsPage(pageNumber) {

                    var params = {};

                    if(users.totalLogs && users.totalLogs > 0) {
                        var start = (pageNumber - 1) * users.itemsPerPage,
                            end = start + users.itemsPerPage;
                        params.start = start;
                        params.number = users.itemsPerPage;
                    }else{
                        params.start = 0;
                        params.number = users.itemsPerPage;
                    }

                    adminService.getUsers(params).success(function (data) {
                        users.totalLogs = data.total;
                        $scope.usersCollection = data;
                    });
                }
            };

            getUsers();

            users.createUserDialog = function() {
                $scope.user = {};
                $scope.okModalFunction = users.createUser;

                $scope.adminModal = $scope.showModal('modalView.html');
                $scope.dialogMode = $translate.instant('common.CREATE');
            };
            users.createUser = function(user) {
                $scope.hideModal();

                adminService.createUser(user).success(function (data) {
                    $scope.usersCollection.users.push(user);
                    $scope.notification('\''+ user.username + '\' created.');
                }).error(function(error){
                    console.log(error);
                });

            };
            users.editUserDialog = function(user) {
                $scope.editedUser = user;
                $scope.user = {};
                $scope.okModalFunction = users.editUser;

                $scope.adminModal = $scope.showModal('modalView.html');
                $scope.dialogMode = $translate.instant('common.EDIT');

                adminService.getUser(user.username).success(function (data) {
                    $scope.user = data;

                    adminService.getUserStatus(user.username).success(function(data){
                        $scope.user.status = data;
                    }).error(function(error){
                        console.log(error);
                        //TODO: properly display error
                    });
                }).error(function (error) {
                    console.log(error);
                    //TODO: properly display error
                });
            };
            users.editUser = function(user) {
                $scope.hideModal();

                adminService.editUser(user).success(function (data) {
                    var index = $scope.usersCollection.users.indexOf($scope.editedUser);

                    if(index != -1){
                        $scope.usersCollection.users[index] = user;
                        $scope.displayedCollection = $scope.usersCollection.users;
                    }

                    $scope.notification('\''+ user.username + '\' edited.');
                }).error(function(error){
                    console.log(error);
                    //TODO: properly display the error.
                });

                if(user.newPassword){
                    adminService.resetPassword({
                        "username" : user.username,
                        "new" : user.newPassword
                    });
                }

                users.toggleUserStatus(user);
            };
            users.viewUser = function(user){
                $scope.user = {};
                $scope.dialogMode = false;

                $scope.adminModal = $scope.showModal('modalView.html');

                adminService.getUser(user.username).success(function (data) {
                    $scope.user = data;

                    adminService.getUserStatus(user.username).success(function(status){
                        $scope.user.status = status;
                    }).error(function(error){
                        console.log(error);
                    });
                }).error(function (error) {
                    console.log(error);
                    //TODO: properly display error
                });
            };
            users.toggleUserStatus = function(user){
                var currentStatus = user.status.enabled,
                    newStatus = currentStatus == true ? 'disable' : 'enable';

                adminService.toggleUserStatus(user, newStatus);
            };
            users.removeUser = function(user) {

                var deleteUser = function() {
                    adminService.deleteUser(user).success(function (data) {
                        var index = $scope.usersCollection.users.indexOf(user);
                        if (index !== -1) {
                            $scope.usersCollection.users.splice(index, 1);
                        }

                        $scope.notification('\''+ user.username + '\' deleted.');
                    }).error(function (data) {
                        $scope.error = data.message;
                        $scope.adminModal = $scope.showModal('deleteUserError.html', 'md', true);
                    });
                }

                $scope.confirmationAction = deleteUser;
                $scope.confirmationText = "Do you want to delete " + user.username + "?";

                $scope.adminModal = $scope.showModal('confirmationModal.html', 'sm', true);
            };
        }
    ]);

    app.controller('GroupsCtrl', [
        '$scope', '$state', '$window', '$sce', 'adminService', '$modal', '$timeout',
        'Upload', '$stateParams', '$translate', '$location', '$q',
        function ($scope, $state, $window, $sce, adminService, $modal, $timeout,
                  Upload, $stateParams, $translate, $location, $q) {

            $scope.groups = {};
            var groups = $scope.groups;
            groups.site = $location.search().site;

            this.init = function() {
                $scope.debounceDelay = 500;

                $scope.showModal = function(template, size, verticalCentered){
                    return $modal.open({
                        templateUrl: template,
                        windowClass: verticalCentered ? 'centered-dialog' : '',
                        backdrop: 'static',
                        keyboard: false,
                        controller: 'AdminCtrl',
                        scope: $scope,
                        size: size ? size : ''
                    });
                };
                $scope.hideModal = function() {
                    $scope.adminModal.close();
                };

                $scope.notification = function(notificationText, showOnTop){
                    var verticalAlign = showOnTop ? false : true;
                    $scope.notificationText = notificationText;
                    $scope.notificationType = 'alert';

                    var modal = $scope.showModal('notificationModal.html', 'sm', verticalAlign);

                    $timeout(function () {
                        modal.close();
                    }, 1500, false);

                };
            };
            this.init();

            //table setup
            groups.itemsPerPage=10;
            $scope.groupsCollection = [];

            /////////////////// MULTIPLE GROUPS VIEW ////////////////////

            var getGroups = function(site) {

                groups.totalLogs = 0;
                getResultsPage(1);

                groups.pagination = {
                    current: 1
                };

                groups.pageChanged = function(newPage) {
                    getResultsPage(newPage);
                };

                function getResultsPage(pageNumber) {

                    var params = {};

                    params.site_id = site;

                    if(groups.totalLogs && groups.totalLogs > 0) {
                        var start = (pageNumber - 1) * groups.itemsPerPage,
                            end = start + groups.itemsPerPage;
                        params.start = start;
                        params.number = groups.itemsPerPage;
                    }else{
                        params.start = 0;
                        params.number = groups.itemsPerPage;
                    }

                    adminService.getGroups(params).success(function (data) {
                        groups.totalLogs = data.total;
                        $scope.groupsCollection = data;
                    });

                }
            };
            getGroups(groups.site);

            $scope.createGroupDialog = function(){
                $scope.group = {};
                $scope.okModalFunction = $scope.createGroup;

                $scope.adminModal = $scope.showModal('modalView.html');

                $scope.dialogMode = $translate.instant('common.CREATE');
                $scope.dialogTitle = $translate.instant('admin.groups.CREATE_GROUP');
            }
            $scope.createGroup = function(group) {
                $scope.hideModal();
                group.site_id = groups.site;

                adminService.createGroup(group).success(function (data) {
                    $scope.groupsCollection.groups.push(group);
                    $scope.notification('\''+ group.group_name + '\' created.');
                }).error(function(error){
                    console.log(error);
                    //TODO: properly display error.
                });

            };
            $scope.editGroupDialog = function(group){
                group.site_id = groups.site;

                $scope.editedGroup = group;
                $scope.group = {};
                $scope.okModalFunction = $scope.editGroup;

                $scope.adminModal = $scope.showModal('modalView.html');
                $scope.dialogMode = $translate.instant('common.EDIT');
                $scope.dialogTitle = $translate.instant('admin.groups.EDIT_GROUP');

                adminService.getGroup(group).success(function (data) {
                    $scope.group = data;
                }).error(function () {
                    //TODO: properly display error.
                });
            };
            $scope.editGroup = function(group) {
                group.site_id = groups.site;

                adminService.editGroup(group).success(function (data) {
                    $scope.notification('\''+ group.group_name + '\' edited.');
                }).error(function(error){
                    console.log(error);
                    //TODO: properly display error.
                });
            };
            $scope.removeGroup = function(group) {
                var deleteGroup = function() {
                    group.site_id = groups.site;

                    adminService.deleteGroup(group).success(function (data) {
                        var index = $scope.groupsCollection.groups.indexOf(group);
                        if (index !== -1) {
                            $scope.groupsCollection.groups.splice(index, 1);
                        }

                        $scope.usersFromGroupCollection = [];
                        $scope.noGroupSelected = true;

                        $scope.notification('\''+ group.group_name + '\' group deleted.');

                    }).error(function (error) {
                        console.log(error);
                        //TODO: properly display error;
                    });
                };

                $scope.confirmationAction = deleteGroup;
                $scope.confirmationText = "Do you want to delete " + group.group_name + "?";

                $scope.adminModal = $scope.showModal('confirmationModal.html', 'sm', true);
            };


            /////////////////// SINGLE GROUP VIEW ////////////////////

            groups.viewGroup = function(group) {
                groups.selectedGroup = group;
                groups.groupView = true;
                groups.usersToAdd = [];

                $scope.getUsersFromGroup(group);
            };

            groups.getUsersAutocomplete = function() {
                adminService.getUsers().success(function(data){
                    groups.usersAutocomplete = [];

                    data.users.forEach(function(user){
                        var added = false;
                        groups.usersFromGroupCollection.users.forEach(function(userCompare){
                            if(user.username == userCompare.username){
                                added = true;
                            }
                        });

                        if(!added){
                            groups.usersAutocomplete.push(user);
                        }
                    });
                });
            };

            groups.addUsers = function() {

                var calls = [];

                groups.usersToAdd.forEach(function(user){
                    calls.push($scope.addUserToGroup(user));
                });

                $q.all(calls).then(function() {
                    $scope.notification('Users successfully added.');
                });

                groups.usersToAdd = [];
            };

            $scope.loadTags = function($query) {
                var users = groups.usersAutocomplete;

                return users.filter(function(user) {
                    var username= user.username.toLowerCase().indexOf($query.toLowerCase()) != -1,
                        email = user.email.toLowerCase().indexOf($query.toLowerCase()) != -1,
                        first_name = user.first_name.toLowerCase().indexOf($query.toLowerCase()) != -1,
                        last_name = user.last_name.toLowerCase().indexOf($query.toLowerCase()) != -1;
                    return username || email || first_name || last_name;
                });

            };

            $scope.validateTag = function($tag) {
                for(var x = 0; x < groups.usersAutocomplete.length; x++){
                    var user = groups.usersAutocomplete[x];

                    if($tag.username == user.username){
                        return true;
                    }
                };

                return false;
            };

            $scope.getUsersFromGroup = function(group){
                groups.usersFromGroupCollection = {};
                $scope.activeGroup = group;
                $scope.noGroupSelected = false;

                group.site_id = groups.site;

                adminService.getUsersFromGroup(group).success(function (data) {
                    groups.usersFromGroupCollection = data;
                    groups.getUsersAutocomplete();
                }).error(function () {
                    //TODO: properly display error
                });
            };

            $scope.removeUserFromGroup = function(user, group) {

                user.group_name = group.group_name;
                user.site_id = groups.site;

                var removeUserFromGroup = function() {
                    adminService.deleteUserFromGroup(user).success(function () {
                        $scope.getUsersFromGroup(group);
                    }).error(function () {
                    });
                };

                $scope.confirmationAction = removeUserFromGroup;
                $scope.confirmationText = "Do you want to delete " + user.username + " from " + group.group_name + "?";

                $scope.adminModal = $scope.showModal('confirmationModal.html', 'sm');
            };

            $scope.addUserToGroup = function (user) {
                var activeGroup = groups.selectedGroup;

                return adminService.addUserToGroup({
                    "username": user.username,
                    "group_name": activeGroup.group_name,
                    "site_id": groups.site
                }).success(function (data) {
                    $scope.getUsersFromGroup(activeGroup);
                }).error(function () {

                });
            };
        }
    ]);

})(angular);
