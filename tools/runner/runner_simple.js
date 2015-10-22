/// <reference path="testlist.js" />
/// <reference path="upload.js" />
/// <reference path="runner.js" />
/// <reference path="keynav.js" />

/*jshint nonew: false */
(function () {
"use strict";

function TestList()
{
    this.resultsServerEndpoint = "http://localhost:35127/api.php/results";
    this.resultsSessionEndpoint = false;
}

TestList.prototype = {
    build_test_list: function ()
    {
        var self = this;
        var test_list = document.getElementById("test_list");

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

            test_list.appendChild(testLink);
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
}

window.addEventListener("load", setup, false);
})();
