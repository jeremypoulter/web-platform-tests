/**
 * @class KeyNav
 * @brief Class that dynamically manages keyboard navigation of a HTML document
 * 
 * Looks for elements with the class 'keynav' and manages simple 'D-Pad' navigation 
 */
function KeyNav(selector) {
    this.focusedElement = null;
    this.navElements = null;

    // Update the list of visiable elements we can navigate

    document.onkeydown = function (e)
    {
        switch (e.keyCode) {
            case 37 /* "ArrowLeft" */:
                this.selectDirection(-1, 0);
                break;

            case 38 /* "ArrowUp" */:
                this.selectDirection(0, -1);
                break;

            case 39 /* "ArrowRight" */:
                this.selectDirection(1, 0);
                break;

            case 40 /* "ArrowDown" */:
                this.selectDirection(0, 1);
                break;

            case 13 /* "Return" */:
            case 32 /* "Space" */:
                if (this.focusedElement != null) {
                    this.focusedElement.click();
                }
                break;

            default:
                return true;
        }

        return false;
    }.bind(this);
};


KeyNav.prototype.selectDirection = function (dirX, dirY)
{
    var newElement = null;

    // Update the list of elements we care about
    var visibleElements = this.findVisibleNavigationElements();
    if (-1 == visibleElements.indexOf(this.focusedElement)) {
        this.focusedElement = null;
    }

    // Work out where we are going to search for a new element to focus
    var startX = 0;
    var startY = 0;

    if (null != this.focusedElement)
    {
        var rect = this.focusedElement.getBoundingClientRect();
        startX = rect.left + (rect.right - rect.left);
        startY = rect.bottom + (rect.top - rect.bottom);
        var index = visibleElements.indexOf(this.focusedElement);
        visibleElements.splice(index, 1);
    }
    else
    {
        switch (dirY) {
            case 0:
            case 1:
                startY = window.scrollY;
                switch(dirX)
                {
                    case 1:
                        startX = window.scrollX;
                        break;
                    case 0:
                        startX = window.scrollX + (window.innerWidth / 2);
                        break;
                    case -1:
                        startX = window.scrollX + window.innerWidth;
                        break;
                }
                break;

            case -1:
                startX = window.scrollX + (window.innerWidth / 2);
                startY = window.scrollY + window.innerHeight;
                break;
        }
    }

    // From our list of visible emements filter this to find only those that are in the direction we wish to go
    var elementsInDirection = [];
    for (var i = 0; i < visibleElements.length; i++)
    {
        var rect = visibleElements[i].getBoundingClientRect();
        var centerX = rect.left + (rect.right - rect.left);
        var centerY = rect.bottom + (rect.top - rect.bottom);

        var distance = (dirX * (centerX - startX)) +
                       (dirY * (centerY - startY));

        if(distance > 0)
        {
            elementsInDirection.push({ distance: distance, element: visibleElements[i] });
        }
    }

    // If we have any elements in the direction of our key press sort by distance and select the first (closest) element
    if (elementsInDirection.length > 0)
    {
        elementsInDirection.sort(function (a, b) {
            return a.distance - b.distance;
        });

        newElement = elementsInDirection[0].element;
    }

    // Have found an element? If so mark it as active
    if (null != newElement)
    {
        if(null != this.focusedElement)
        {
            var keynavClass = this.focusedElement.attributes["keynav-class"];
            var keynavStyle = keynavClass != undefined ? keynavClass.value : "active";
            this.focusedElement.classList.remove(keynavStyle);
        }
        this.focusedElement = newElement;
        var keynavClass = this.focusedElement.attributes["keynav-class"];
        var keynavStyle = keynavClass != undefined ? keynavClass.value : "active";
        this.focusedElement.classList.add(keynavStyle);
    }
}

KeyNav.prototype.findVisibleNavigationElements = function () {
    // Find all the visible elements with the class 'keynav'
    var visibleElements = [];

    var elements = document.querySelectorAll(".keynav");
    for (var i = 0; i < elements.length; i++) {
        if (this.isVisible(elements[i])) {
            visibleElements.push(elements[i]);
        }
    }

    return visibleElements;
}

KeyNav.prototype.isVisible = function(el)
{
    return el.offsetParent !== null;
}
