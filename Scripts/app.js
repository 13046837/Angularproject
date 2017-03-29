var BlogApp = angular.module('BlogApp', ['ngRoute', 'ngFileUpload', 'angularUUID2']);

BlogApp.config(function ($routeProvider){

    $routeProvider

    .when('/', {
        templateUrl: '/Views/main.html',
        controller: 'mainController'
    })

    .when('/post/:id', {
        templateUrl: '/Views/detail.html',
        controller: 'detailController'
    })

    .when('/account/', {
        templateUrl: '/Views/account.html',
        controller: 'accountController'
    })

    .when('/create/', {
        templateUrl: '/Views/create.html',
        controller: 'createController'
    })

    .when('/login/', {
        templateUrl: '/Views/login.html',
        controller: 'loginController'
    })

    .when('/register/', {
        templateUrl: '/Views/register.html',
        controller: 'registerController'
    })
    .otherwise({
        redirectTo: '/'
    })
});

BlogApp.controller('mainController', ['$scope', 'databaseService', 'archiveService', function($scope, databaseService, archiveService){
    databaseService.get();
    $scope.posts = databaseService.posts;
    $scope.dates = archiveService.fillArchive($scope.posts);
    $scope.listlength = 5;

    $scope.addToList = function(){
        $scope.listlength = $scope.listlength + 5;
    }

    $scope.filterDate = function(date){
        databaseService.get();
        $scope.posts = databaseService.posts;
        $scope.posts = archiveService.filterPosts(date.month, date.year);
    }

    $scope.showAll = function() {
        databaseService.get();
        $scope.posts = databaseService.posts;
    }
}]);

BlogApp.controller('loginController', ['$scope', '$location', 'loginService', 'sessionService', function($scope, $location, loginService, sessionService){
    var tried = false;
    
    $scope.login = function(){
        if(loginService.login($scope.username, $scope.password) != null){
            $location.path('/');
        }else{
            tried = true;
        }
    };

    $scope.checkTried = function() {
        return tried;
    };

    $scope.logout = function(){
        sessionService.logout();
    };

    $scope.checkAdmin = function(){
        if($scope.checkLoggedIn()){
            return (JSON.parse(localStorage.getItem('currentUser')).admin != false);
        }
        else{
            return false;
        }
    };

    $scope.checkLoggedIn = function(){
        return (JSON.parse(localStorage.getItem('currentUser')) != null);
    };
}]);

BlogApp.controller('accountController', ['$scope', 'sessionService', 'databaseService', '$location', function($scope, sessionService, databaseService, $location){
   $scope.user = JSON.parse(localStorage.getItem('currentUser'));
   $scope.username = $scope.user.username;
   $scope.mail = $scope.user.mail;
   $scope.image = $scope.user.image;
   var pass = false;

   $scope.setPass = function(){
        pass = true;
    };

   $scope.pass = function(){
       return pass;
   }

   $scope.saveChanges = function () {
    var newPassword = null;
    if(pass != false){
        newPassword = $scope.password;
    }
     databaseService.editAccount($scope.user.id, $scope.username, $scope.mail, $scope.image, newPassword);
     $location.path('/');
   }

    $scope.deleteAccount = function() {
        databaseService.deleteAccount($scope.user.id);
        sessionService.logout();
        $location.path('/');
    };
}]);

BlogApp.controller('detailController', ['$scope','$http', '$routeParams', '$location', 'databaseService', 'uuid2', function($scope, $http, $routeParams, $location, databaseService, uuid2){
    databaseService.get();
    var id = $routeParams.id;
    var editC = false;
    var editComment;
    var editP = false;
    var editPost;
    $scope.currentuser = JSON.parse(localStorage.getItem('currentUser'));
    $scope.post = databaseService.getPost(id);
    $scope.comments = databaseService.getComments(id);
    $scope.postComment = function() {
        databaseService.postComment({user: $scope.currentuser.username, post: $scope.post.id, date: new Date, comment: $scope.commentText, image: $scope.currentuser.image, id: uuid2.newuuid()});
        $scope.comments = databaseService.getComments(id);
    };

    $scope.setEditC = function(comment){
        editC = true;
        editComment = comment;
        $scope.commentText = comment.comment;
    };

    $scope.editC = function(){
        return editC;
    };

     $scope.setEditP = function(post){
        editP = true;
        editPost = post;
        $scope.postText = post.body;
        $scope.postTitle = post.title;
    };

    $scope.editP = function(){
        return editP;
    };

    $scope.editComment = function() {
        databaseService.editComment(editComment.id, $scope.commentText);
        editComment = null;
        editC = false;
        $scope.comments = databaseService.getComments(id);
    };

    $scope.deleteComment = function(comment) {
        databaseService.deleteComment(comment.id);
        $scope.comments = databaseService.getComments(id);
    };

    $scope.editPost = function() {
        databaseService.editPost(editPost.id, $scope.postText, $scope.postTitle, $scope.postImage);
        console.log($scope.postText);
        console.log($scope.postTitle);
        editPost = null;
        editP = false;
        $scope.post = databaseService.getPost(id);
    };

    $scope.deletePost = function(post) {
        databaseService.deletePost(post.id);
        $location.path('/');
    }
}]);

BlogApp.controller('createController', ['$scope', 'databaseService', '$location', 'uuid2', function($scope, databaseService, $location, uuid2){
    $scope.createPost = function(){
        databaseService.createPost({title: $scope.title, body: $scope.body, date: new Date, image: $scope.image, id: uuid2.newuuid()});
        $location.path('/');
    }
}]);

BlogApp.controller('registerController', ['$scope', 'databaseService', 'loginService', '$location', 'uuid2', function($scope, databaseService, loginService, $location, uuid2){
    $scope.register = function(){
        databaseService.register({username: $scope.username, mail: $scope.mail, password: $scope.password, admin: false, image: $scope.image, id: uuid2.newuuid()});
        loginService.login($scope.username, $scope.password)
        $location.path('/');
    }
}]);

BlogApp.service('databaseService',['uuid2', function(uuid2){
    if(localStorage.getItem('users') == null){
        this.users = [{username: 'Admin', mail: 'Admin@admin.com', password: 'safepassword', admin: 'Yes', image: 'https://puu.sh/uCHZN/784e35969f.jpg',  id: uuid2.newuuid()}];
        localStorage.setItem('users', JSON.stringify(this.users));
    }
    if(localStorage.getItem('posts') == null){
        this.posts = [{title: 'kroketten', body: 'zijn vies...', date: new Date, image: 'http://www.planwallpaper.com/static/images/nature_backgrounds_perfect_backgrounds_picture_7049.jpg', id: 0},{title: 'test', body: 'This is a test...', date: new Date, image: 'http://i.imgur.com/tAHVmXi.jpg', id: 1},{title: 'test', body: 'zijn vies...', date: new Date, image: 'http://www.planwallpaper.com/static/images/nature_backgrounds_perfect_backgrounds_picture_7049.jpg', id: 2}];
        this.posts[0].date.setFullYear('2018');
        localStorage.setItem('posts', JSON.stringify(this.posts));
    }
    if(localStorage.getItem('comments') == null){
        this.comments = [{user: this.users[0].username, post: this.posts[0].id, date: new Date, comment: 'this is a test', image: this.users[0].image,  id: uuid2.newuuid()}];
        localStorage.setItem('comments', JSON.stringify(this.comments));
    }

    this.get = function(){
        this.users = JSON.parse(localStorage.getItem('users'));
        this.posts = JSON.parse(localStorage.getItem('posts'));
        this.comments = JSON.parse(localStorage.getItem('comments'));
    };

    this.getPost = function(id){
        var post = null;
        this.posts.forEach(function(e, i) {
            if(e.id == id){
               post = e;
            }
        })
        return post;
    };
     
    this.createPost = function(data){
        this.get();
        this.posts.push(data);
        localStorage.setItem('posts', JSON.stringify(this.posts));
    };

    this.editPost = function(id, editText, editTitle, editImage) {
        this.get();
        var postIndex;
        this.posts.forEach(function(e, i) {
            if(e.id == id){
                postIndex = i;
            }
        })
        if(postIndex != null) {
            this.posts[postIndex].body = editText;
            this.posts[postIndex].title = editTitle;
            this.posts[postIndex].image = editImage;
            localStorage.setItem('posts', JSON.stringify(this.posts));
        }
    };

    this.deletePost = function(id){
        this.get();
        var postIndex;
        this.posts.forEach(function(e, i) {
            if(e.id == id){
                postIndex = i;
            }
        })
        if(postIndex != null){
            this.posts.splice(postIndex, 1);
            localStorage.setItem('posts', JSON.stringify(this.posts));
        }
    };


    this.getComments = function(id){
        this.get();
        var commentList = [];
        this.comments.forEach(function(e, i) {
            if(e.post == id) {
                commentList.push(e);
            }
        })
        return commentList;
    };

    this.postComment = function(data){
        this.get();
        this.comments.push(data);
        localStorage.setItem('comments', JSON.stringify(this.comments));
    };

    this.editComment = function(id, editText) {
        this.get();
        var commentIndex;
        this.comments.forEach(function(e, i) {
            if(e.id == id){
                console.log(i);
                console.log(e);
                commentIndex = i;
            }
        })
        if(commentIndex != null) {
            this.comments[commentIndex].comment = editText;
            localStorage.setItem('comments', JSON.stringify(this.comments));
        }
    };

    this.deleteComment = function(id){
        this.get();
        var commentIndex;
        this.comments.forEach(function(e, i) {
            if(e.id == id){
                console.log(i);
                console.log(e);
                commentIndex = i;
            }
        })
        if(commentIndex != null) {
            this.comments.splice(commentIndex, 1);
            localStorage.setItem('comments', JSON.stringify(this.comments));
        }
    };

    this.register = function(data){
        this.get();
        this.users.push(data);

        localStorage.setItem('users', JSON.stringify(this.users));
    };

    this.editAccount = function(id, username, mail, image, password) {
        this.get();
        var accountIndex;
        this.users.forEach(function(e, i) {
            if(e.id == id){
                console.log(i);
                console.log(e);
                accountIndex = i;
            }
        })
        if(accountIndex != null) {
            this.users[accountIndex].username = username;
            this.users[accountIndex].mail = mail;
            this.users[accountIndex].image = image;
            if(password != null){
                this.users[accountIndex].password = password;
            }
            localStorage.setItem('users', JSON.stringify(this.users));
            localStorage.setItem('currentUser', JSON.stringify(this.users[accountIndex]))
        }
    };

    this.deleteAccount = function(id){
        this.get();
        var accountIndex;
        this.users.forEach(function(e, i) {
            if(e.id == id){
                console.log(i);
                console.log(e);
                accountIndex = i;
            }
        })
        if(accountIndex != null) {
            this.users.splice(accountIndex, 1);
            localStorage.setItem('users', JSON.stringify(this.users));
        }
    };
}]);

BlogApp.service('archiveService', ['databaseService', function(databaseService){
    var dates = [];

    this.fillArchive = function(posts){
        posts.forEach(function(e, i) {     
            var date = new Date(e.date);
            var dateString;
            var month;
            var year;
            if(date.getMonth() == 0){
                dateString = 'January ' + date.getFullYear()
            }else if(date.getMonth() == 1){
                dateString = 'February ' + date.getFullYear()
            }else if(date.getMonth() == 2){
                dateString = 'March ' + date.getFullYear()
            }else if(date.getMonth() == 3){
                dateString = 'April ' + date.getFullYear() 
            }else if(date.getMonth() == 4){
                dateString = 'May ' + date.getFullYear() 
            }else if(date.getMonth() == 5){
                dateString = 'June ' + date.getFullYear()
            }else if(date.getMonth() == 6){
                dateString = 'July ' + date.getFullYear()
            }else if(date.getMonth() == 7){
                dateString = 'August ' + date.getFullYear()
            }else if(date.getMonth() == 8){
                dateString = 'September ' + date.getFullYear()
            }else if(date.getMonth() == 9){
                dateString = 'October ' + date.getFullYear()
            }else if(date.getMonth() == 10){
                dateString = 'November ' + date.getFullYear()
            }else if(date.getMonth() == 11){
                dateString = 'December ' + date.getFullYear()
            }
            var duplicate = false;
            dates.forEach(function(e, i) { 
                if(e.dateString == dateString){
                    duplicate = true;
                }
            })
            if(duplicate != true){
                month = date.getMonth();
                year = date.getFullYear();
                dates.push({dateString: dateString, month: month, year: year});
            }
        })
        return dates;
    }

    this.filterPosts = function(month, year){
        var posts = [];
        databaseService.get();
        databaseService.posts.forEach(function(e, i) { 
            var date = new Date(e.date);
            if(date.getMonth() == month && date.getFullYear() == year){
                posts.push(e);
            }
        })
        return posts;
    }
}]);

BlogApp.service('sessionService',[ function(databaseService){

    this.setCurrentUser = function(user){
        localStorage.setItem('currentUser', JSON.stringify(user));
    }

    this.logout = function(){
        localStorage.removeItem('currentUser');
    }

    this.currentUser = function(){
        return JSON.parse(localStorage.getItem('currentUser'));
    }
}]);

BlogApp.service('loginService',['databaseService', 'sessionService', function(databaseService, sessionService){
   
    this.login = function(username, password){
        databaseService.get();
        var current;
        console.log(username);
        console.log(password);
        databaseService.users.forEach(function(e, i){
            if(e.username == username && e.password == password){
                current = e;
                sessionService.setCurrentUser(current);
            }
        })
        return current;
    }
}]);