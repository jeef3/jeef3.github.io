---
layout: post
title: "JavaScript Behaviours Pattern"
date: 2010-07-29 16:59
comments: false
categories:
- ASP.NET
- jQuery
- JavaScript
published: false
---
In an interactive MVC framework web-application that takes heavy advantage of Javascript, we need a way to maintain quite a lot of (Javascript) code.

In a simple case, we might want to use a Date-picker widget.

``` JavaScript
$(document).ready(function () {
    $('input.date-picker').datepicker();
});
```

Done. Now every time the page loads, it will check to see if we have an input with class `date-picker` and turn that into our lovely date-picker widget. We can put this code into our main `$(document).ready(func)` and we don't have to worry about it.

But what if on one page in-particular we want something to happen when a date is selected. A pretty animation or something. This would require a separate explicit instantiation, with a callback or event listener attached. That's fine, this is a once off, so at the bottom of our view template we will add some in-line Javascript to take care of that instance.

``` JavaScript
// Using callback
$('#alerting-date-picker').datepicker({
    onChange: function (e) {
        alert("Date changed");
    }
});

// Or using event binding
$('#alerting-date-picker').datepicker().bind('change', function (e) {
    alert("Date changed");
});
```

Great. Now our element with id "alerting-date-picker" will have the date picker applied, and a callback set-up for when the date is changed.

There are several problems with this approach:

- What if a lot of our pages don't use the date-picker.
- If we are going to just attach events like this, we will have many anonymous functions, this will get very messy.
- There's no (server managed) locale support.

To address these issues I've adopted what I've dubbed the Behaviours Pattern. The theory is to have a single behaviour script for each controller. Within that script the code is broken down into behaviours for each view separated using a very simple namespacing method. Each behaviour is a self-contained object that gets instantiated by the view, where it (the view) can pass in any required server-side variables/locale information.

So to start, we create a new Javascript file matching the name of our controller: `home.js`. This is our behaviours file for all views that come from the HomeController. You can then use whatever pattern you like, but I like using the [Revealing Module Pattern](http://www.klauskomenda.com/code/javascript-programming-patterns/#revealing).

``` JavaScript
// The controller namespace
var home = {}; 

// The index view
home.index = function (properties) {
    // Default variables. I like to populate this with element selectors and variables. They can then be overwritten by the view later.
    var defaults = {
        datePickerSelector: '#alerting-date-picker',
        dateChangedMessage: null
    };

    // Private variables
    var properties

    // Constructor. This is where we instantiate our widgets and do all the initial page set-up for this view.
    var construct = function (properties) {
        // Set-up the properties object
        properties = $.extend(true, defaults, properties);

        $(properties.datePickerSelector).datepicker({
            callback: {
                onChange: event_datePickerChanged // This is a cut down version of my events/action pattern that I might blog about next.
            }
        });
    };

    // Private methods
    var event_datePickerChanged = function (e) {
        alert(properties.dateChangedMessage);
    };

    // Public methods
    var self = {
        init: construct
    };

    construct(properties);
    return self;
};
```

Then in our view we use a small amount of in-line Javascript we can inject server side variables. I like to use a render queue to send this line to outside the body tag.

``` JavaScript
$(document).ready(function () {
    home.init({
        dateChangedMessage: '&lt;= "Server-side message, probably from Resource" &gt;'
    });
```

And that's the start of my behaviours pattern.