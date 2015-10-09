/*jshint nonew: false */
(function () {
"use strict";

function TestList()
{
}

TestList.prototype = {
    build_test_list: function ()
    {
        // Build list of the tests
        for (var i = 0; i < tests.length; i++)
        {
            var test = tests[i];

            var testLink = document.createElement("a");
            testLink.href = "#";
            testLink.className = "list-group-item row keynav";
            testLink.innerText = test;
            testLink.id = "test_" + i;
            this.install_handler(testLink, i);

            var testElement = document.createElement("div");
            testElement.appendChild(testLink);

            testList.appendChild(testLink);
        }
    },
    install_handler: function (testLink, i)
    {
        var start_test = this.start_test;
        testLink.addEventListener('click', function () {
            start_test(i);
        });
    },
    start_test: function (i)
    {
        var path = document.getElementById("path");
        var start_button = document.querySelector(".toggleStart");
        path.value = "/" + tests[i];
        start_button.click();
    }
};

function setup()
{
    var keyNav = new KeyNav('.keynav');
    var testList = new TestList();
    testList.build_test_list();

/*
    // Little hook to make the key nav work
    var manualUI = document.getElementById("manualUI");
    var test_button = manualUI.querySelector(".test");
    var ref_button = manualUI.querySelector(".ref");

    ref_button.parentNode.onclick = function () {
        ref_button.click();
    }.bind(this);
    test_button.parentNode.onclick = function () {
        test_button.click();
    }.bind(this);

    // Tweek the back links to maintain the position and options in the main test 
    // list
    var backLinks = document.querySelectorAll(".backlink");
    for(var i = 0; i < backLinks.length; i++)
    {
        backLinks[i].href = "tests.html" + location.search;
    }
*/
    var backButtons = document.querySelectorAll(".backButton");
    for (var i = 0; i < backButtons.length; i++)
    {
        backButtons[i].addEventListener('click', function ()
        {
            var elements = document.querySelectorAll(".hide-during-test-run");
            for (var i = 0; i < elements.length; i++) {
                elements[i].style.display = "inherit";
            };
        });
    }
}

window.addEventListener("load", setup, false);
})();
