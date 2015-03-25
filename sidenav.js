(function(){

	angular
		.module('sidenav',[])
		.factory('sidenav',sidenavFactory)
		.directive('h1',headerDirective)
		.directive('h2',headerDirective)
		.directive('h3',headerDirective)
		.directive('h4',headerDirective)
		.directive('h5',headerDirective)
		.directive('h6',headerDirective)
		.directive('sidenav',sidenavDirective)
		.directive('sidenavNode',sidenavNodeDirective)
		.directive('sidenavIgnore',sidenavIgnoreDirective)

	function headerDirective(sidenav){

		return {
			link:function(scope,element,attributes){
				if(scope.isSidenavIgnored) return

				// level is 1 for h1, 2 for h2, etc
				var level = parseInt(element[0].tagName.replace(/\D/g,''))
					
				if(level<sidenav.levelMin || level > sidenav.levelMax)
					return

				var node = new Node({
					level:level
					,element:element[0]
					,attributes: attributes
					,children:[]
					,nodePrev:sidenav.nodePrev
				})

				node.nodeParent = findnodeParent(node,sidenav.nodePrev)
				node.nodeParent.children.push(node)

				sidenav.nodes.push(node)

				sidenav.nodePrev = node
			}
		}
	}

	function findnodeParent(node,nodePrev){
		var nodeTesting = nodePrev

		while(nodeTesting.level >= node.level)
			nodeTesting = nodeTesting.nodeParent

		return nodeTesting
	}

	function sidenavDirective(sidenav,$window){

		angular
			.element($window)
			.bind('scroll',debounce(sidenavOnScroll,sidenav.scrollDebounce))

		return {
			scope:{}
			,template: 
				'<div sidenav-node="sidenav.nodeRoot"></div>'
			,compile:function(){
				return{
					pre:function(scope,element){
						scope.sidenav = sidenav
						sidenav.scope = scope	
					},post:function(){
						sidenavOnScroll()
					}
				}
			}
		}
	}

	function sidenavNodeDirective(sidenav,$compile,$timeout){
		return {
			scope:{
				node:'=sidenavNode'
			}
			,template:sidenav.nodeTemplate
			,compile: function(element,attributes) {
				return recursionHelper.compile(element,{post:postLink},$compile);
        	}
		}

		function postLink(scope,element,attributes){

			scope.node.scope = scope

			scope.$on('sidenav.setIsActive',function (event, isActive) {

			    $timeout(function() {
				    scope.node.isActive = isActive
				    scope.$apply()
				})
			 })

			element.bind('click',function(){
				event.preventDefault();
				event.stopPropagation();
				scrollTo(scope.node.element,sidenav.scrollOffset)
			})
			
        }

	}

	function sidenavIgnoreDirective(){
		return {
			scope:true
			,compile: function compile(tElement, tAttrs, transclude) {
		    	return {
		    		pre: function(scope,element){
						scope.isSidenavIgnored = true
					}
		    	}
		    },
		}
	}

	function sidenavFactory(){
		sidenav = {
			nodeRoot:new Node({
				nodeParent:null
				,nodePrev:null
				,children:[]
				,level:-1
			})
			,nodes:[]
			,nodeActive:null
			,shouldUpdateFragment:true
			,scrollOffset:-10
			,levelMin: 2
			,levelMax: 6
			,levelPrev: -1
			,scrollDebounce:100
			,nodeTemplate:
				'<a class="sidenav-node-text" ng-href="#{{node.element.id}}">{{node.element.textContent}}</a>'
				+'<ul class="sidenav-nodes">'
					+'<li ng-repeat="nodeChild in node.children" index="{{$index}}" sidenav-node="nodeChild" class="sidenav-node" ng-class="{isActive:nodeChild.isActive}">'
					+'</li>'
				+'</ul>'
		}

		sidenav.nodePrev = sidenav.nodeRoot


		return sidenav
	}

	var recursionHelper = {
        /**
         * Manually compiles the element, fixing the recursion loop.
         * @param element
         * @param [link] A post-link function, or an object with function(s) registered via pre and post properties.
         * @returns An object containing the linking functions.
         */
        compile: function(element, link, $compile){
            // Normalize the link parameter
            if(angular.isFunction(link)){
                link = { post: link };
            }

            // Break the recursion loop by removing the contents
            var contents = element.contents().remove();
            var compiledContents;
            return {
                pre: (link && link.pre) ? link.pre : null,
                /**
                 * Compiles and re-adds the contents
                 */
                post: function(scope, element){
                    // Compile the contents
                    if(!compiledContents){
                        compiledContents = $compile(contents);
                    }
                    // Re-add the compiled contents to the element
                    compiledContents(scope, function(clone){
                        element.append(clone);
                    });

                    // Call the post-linking function, if any
                    if(link && link.post){
                        link.post.apply(null, arguments);
                    }
                }
            };
        }
    };


	function Node(configs){
		angular.extend(this,configs)
	}

	Node.prototype.getIsNotAboveWindow = function(){
		var rect = this.element.getBoundingClientRect();
	    return rect.top  + sidenav.scrollOffset > 0
	}


	function debounce(func, wait, immediate) {
		var timeout;
		return function() {
			var context = this, args = arguments;
			var later = function() {
				timeout = null;
				if (!immediate) func.apply(context, args);
			};
			var callNow = immediate && !timeout;
			clearTimeout(timeout);
			timeout = setTimeout(later, wait);
			if (callNow) func.apply(context, args);
		};
	}

	function sidenavOnScroll(){
		

		sidenav.scope.$broadcast('sidenav.setIsActive',false)

		var nodeActive = null

		sidenav.nodes.every(function(node){
			if(node.getIsNotAboveWindow()){
				return false
			}

			nodeActive = node
			
			return true
		})


		if(nodeActive && nodeActive.scope){
			nodeActive.scope.$emit('sidenav.setIsActive',true)
		
			if(sidenav.shouldUpdateFragment 
				&& nodeActive.attributes 
				&& history.replaceState
			)
				history.replaceState(null,null,'#'+nodeActive.attributes.id);

		}

	}


	function scrollTo(element,scrollOffset,callback) {
        // This scrolling function 
        // is from http://www.itnewb.com/tutorial/Creating-the-Smooth-Scroll-Effect-with-JavaScript
        
        var startY = currentYPosition();
        var stopY = elmYPosition(element) + scrollOffset;
        var distance = stopY > startY ? stopY - startY : startY - stopY;
        var speed = Math.round(distance / 50);
        if (speed >= 20) speed = 20;
        var step = Math.round(distance / 25);
        var leapY = stopY > startY ? startY + step : startY - step;
        var timer = 0;
        if (stopY > startY) {
            for ( var i=startY; i<stopY; i+=step ) {
                setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
                leapY += step; if (leapY > stopY) leapY = stopY; timer++;
            } return;
        }
        for ( var i=startY; i>stopY; i-=step ) {
            setTimeout("window.scrollTo(0, "+leapY+")", timer * speed);
            leapY -= step; if (leapY < stopY) leapY = stopY; timer++;
        }
        
        function currentYPosition() {
            // Firefox, Chrome, Opera, Safari
            if (self.pageYOffset) return self.pageYOffset;
            // Internet Explorer 6 - standards mode
            if (document.documentElement && document.documentElement.scrollTop)
                return document.documentElement.scrollTop;
            // Internet Explorer 6, 7 and 8
            if (document.body.scrollTop) return document.body.scrollTop;
            return 0;
        }
        
        function elmYPosition(elm) {
            var y = elm.offsetTop;
            var node = elm;
            while (node.offsetParent && node.offsetParent != document.body) {
                node = node.offsetParent;
                y += node.offsetTop;
            } return y;
        }

    };
	    
	
})()