/*
  This function selects the test stream based on the URL. 

  The test harness requires different test files for each test, and this
  allows a single multiple tests to be generated from a single file.

  If you use different test streams you'll need to update this function.
 */
var selectStream = function (path, id)
{
    var setLabel;

    setLabel = function (enc)
    {
        var label = document.getElementById(id);
        label.innerText += " - "+enc;
        document.title = label.innerText;
    }

    // The test streams are determined by the end of the test file name
    if (path.match(/-wv.html$/)) {
        setLabel("WideVine");
        return "/drm-tests/content/O-DASH_AVC_MP4_SD-DRM-02/O-DASH_AVC_MP4_SD-DRM-02.mpd";
    } else if (path.match(/-pr.html$/)) {
        setLabel("PlayReady");
        return "/drm-tests/content/O-DASH_AVC_MP4_SD-DRM-01/O-DASH_AVC_MP4_SD-DRM-01.mpd";
    } else if (path.match(/-pr-init.html$/)) {
        setLabel("PlayReady (InitData in MPD)");
        return "/drm-tests/content/O-DASH_AVC_MP4_SD-DRM-04/O-DASH_AVC_MP4_SD-DRM-04.mpd";
    } else if (path.match(/-prwv.html$/)) {
        setLabel("PlayReady/WideVine");
        return "/drm-tests/content/O-DASH_AVC_MP4_SD-DRM-03/O-DASH_AVC_MP4_SD-DRM-03.mpd";
    } else if (path.match(/-prwv-init.html$/)) {
        setLabel("PlayReady/WideVine (InitData in MPD)");
        return "/drm-tests/content/O-DASH_AVC_MP4_SD-DRM-06/O-DASH_AVC_MP4_SD-DRM-06.mpd";
    }

    console.warn("WARNING: Test has no encryption type encoded.");

    setLabel("PlayReady/WideVine");
    return "/drm-tests/content/O-DASH_AVC_MP4_SD-DRM-02/O-DASH_AVC_MP4_SD-DRM-03.mpd";
}


