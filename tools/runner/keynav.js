function KeyNav(selector) {
    this.focusedElement = null;
    this.navElements = null;

    document.onkeydown = function (e) {
        switch (e.keyCode) {
            case 37 /* "ArrowLeft" */:
                break;

            case 38 /* "ArrowUp" */:
                break;

            case 39 /* "ArrowRight" */:
                break;

            case 40 /* "ArrowDown" */:
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


