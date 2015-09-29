/*jslint browser: true, sloppy: true, vars: true, white: true, indent: 2 */


var optionIndexTestsJavascript = -4;
var optionIndexTestsReference = -3;
var optionIndexTestsManual = -2;
var optionIndexIFrame = -1;

var firstOption = optionIndexTestsJavascript;
var lastOption = optionIndexIFrame;

var indexSelected = firstOption - 1;

var optionTestsJavascript = null;
var optionTestsReference = null;
var optionTestsManual = null;
var optionIFrame = null;

var options = null;

function isElementInViewport(el) {
    var rect = el.getBoundingClientRect();

    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
      rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
}

function focusItem(item, scrollToTop) {
    if (indexSelected >= firstOption) {
        document.getElementById("test_" + indexSelected).classList.remove("active");
    }

    var selectedElement = document.getElementById("test_" + item);
    if (false === isElementInViewport(selectedElement)) {
        selectedElement.scrollIntoView(scrollToTop);
    }
    selectedElement.classList.add("active");

    indexSelected = item;
}

function toggleCheckbox(checkboxId) {
    index = (-checkboxId) - 1;
    var checkbox = options[index];
    checkbox.checked = !checkbox.checked;
 }

function startTest(index) {
    var url = "runner_simple.html?autorun=1&path=/" + tests[index];
    if (optionIFrame.checked) {
        url += "&iframe=1";
    }
    if (optionTestsManual.checked) {
        url += "&manual=1";
    }
    if (optionTestsReference.checked) {
        url += "&reftest=1";
    }
    if (optionTestsJavascript.checked) {
        url += "&testharness=1";
    }
    document.location.href = url;

    return true;
}

function installHandler(testLink, i) {
    testLink.addEventListener('click', function () {
        startTest(i);
    });
}

function parseOptions()
{
    if (0 == location.search.length) {
        return null;
    }
    var options = { };

    var optionstrings = location.search.substring(1).split("&");
    for (var i = 0, il = optionstrings.length; i < il; ++i) {
        var opt = optionstrings[i];
        //TODO: fix this for complex-valued options
        options[opt.substring(0, opt.indexOf("="))] =
            opt.substring(opt.indexOf("=") + 1);
    }
    return options;
}

function start()
{
    // Cache the option elements
    optionTestsJavascript = document.getElementById("optionTestsJavascript");
    optionTestsReference = document.getElementById("optionTestsReference");
    optionTestsManual = document.getElementById("optionTestsManual");
    optionIFrame = document.getElementById("optionIFrame");

    options = [
        optionIFrame,
        optionTestsManual,
        optionTestsReference,
        optionTestsJavascript
    ];

    var selectedPath = null;

    // Restore the state if any passed
    var urlOptions = parseOptions();
    if (null != urlOptions)
    {
        optionTestsJavascript.checked = urlOptions.testharness;
        optionTestsReference.checked = urlOptions.reftest;
        optionTestsManual.checked = urlOptions.manual;
        optionIFrame.checked = urlOptions.iframe;
        if (urlOptions.path) {
            selectedPath = urlOptions.path.substring(1);
        }
    }

    // Build list of the tests
    for (var i = 0; i < tests.length; i++)
    {
        var test = tests[i];

        var testLink = document.createElement("a");
        testLink.href = "#";
        testLink.className = "list-group-item";
        testLink.innerText = test;
        testLink.id = "test_" + i;
        installHandler(testLink, i);

        var testElement = document.createElement("div");
        testElement.appendChild(testLink);

        testList.appendChild(testLink);
        if(null != selectedPath && test == selectedPath)
        {
            focusItem(i, true);
        }
    }
}

function onKey(e) {
    switch (e.keyCode) {
        case 38 /* "ArrowUp" */:
            if (indexSelected > firstOption) {
                focusItem(indexSelected - 1, true);
            } else if ((firstOption - 1) === indexSelected) {
                focusItem(firstOption);
            }
            break;

        case 40 /* "ArrowDown" */:
            if (indexSelected < tests.length - 1) {
                focusItem(indexSelected + 1, false);
            }
            break;

        case 13 /* "Return" */:
        case 32 /* "Space" */:
            if (indexSelected > lastOption) {
                startTest(indexSelected);
            } else if (firstOption <= indexSelected && indexSelected <= lastOption) {
                toggleCheckbox(indexSelected);
            }
            break;

        default:
            return true;
    }

    return false;
}

