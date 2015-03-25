# Angular-Sidenav

Automatically turn your `h1` to `h6` tags into a scrollable sidenav. Angular-Sidenav can also update the url fragment as the user scrolls.

[Demo](http://aakilfernandes.github.io/angular-sidenav/)

## Installation

1. Install via bower

	`bower install angular-sidenav`

2. Add the module

	`app.module('myApp',['sidenav'])`

3. (Optional) Include the css

    `<link href="/assets/components/angular-sidenav/sidenav.css" rel="stylesheet">`

## Usage

The existing header tags (`h1` - `h6`) will be used to construct a nav tree. Simply include `<div sidenav></div>` wherever you'd like your sidenav to appear.

You can use `sidenav-ignore` to ignore certain blocks of text which shouldn't be included in your sidenav. This is useful for title headers.

## Options

To change the options for sidenav, just extend

	angular.module('myApp').run(function(sidenav){
		angular.extend(sidenav,{
			//options
		})
	})

|option|default|explanation|
|---|---|---|---|---|
|minLevel|2|The minimum level header that will be used to generate the header. So by default, h1 is ignored.|
|maxLevel|6|The maximum level header that will be used to gnerate the header. So by default, h7 is ignored.|
|shouldUpdateFragment|true|Should the url fragment of your page automatically update?|
|scrollDebounce|100|How many milliseconds should the scrollbar be static before updating the sidenav. Increasing `scrollDebounce` makes the sidenav more responsive, but it is more expensive.|

