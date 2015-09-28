
function setup()
{
    var keyNav = new KeyNav('key');

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
}

window.addEventListener("load", setup, false);
