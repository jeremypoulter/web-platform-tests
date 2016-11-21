var TestMachine = function ()
{
    var i = 0,
    endLoops = 0,
    endMax = 100,
    sleep = 100;

    /*
      TestMachine constructor

      sequence: Array of test machine states that comprise the tests
      timeout: Number of seconds to wait before giving up on the tests
      testParameters: Array of values needed by various test machine states
     */
    var TestMachine = function (sequence, timeout, testParameters)
    {
        var
        i = 0,
        vid,
        sleep = 100,
        toObj;

        toObj = function (a)
        {
            var
            i,
            obj = {};

            for (i = 0; i < a.length - 1; i++) {
                obj[a[i]] = a[i+1];
            }

            return obj;
        }

        this.sequence = toObj(sequence);
        this.state = TestMachine.START;
        vid = document.getElementById("vid");
        this.fetchingDrmCredentials = false;

        for (i = 0; i < sequence.length; i++) {

            switch (sequence[i]) {

            case TestMachine.SET_STREAM:
                this.videoUrl = testParameters.videoUrl;
                break;

            case TestMachine.CHECK_KEYSTATUS:
                this.testKeystatus = async_test("Test keystatus == usable");
                break;

            case TestMachine.CHECK_SESSION_TYPE:
                this.sessionType = testParameters.sessionType;
                this.testSessionType = async_test("Test session type == "+testParameters.sessionType);
                break;

            case TestMachine.CHECK_SECOND_KEYSTATUS:
                this.testSecondKey = async_test("Test second key exists");
                this.testSecondKeyStatus = async_test("Test second key status == usable");
                break;

            case TestMachine.CHECK_PLAYING:
                vid.addEventListener("playing", function () {
                        this.playing = true;
                    }.bind(this));
                this.testPlaying = async_test("Test playing == true");
                break;

            case TestMachine.CHECK_NEEDKEY_EQUAL:
                this.keysNeededEqual = testParameters.keysNeededEqual;
                this.testNeedkeyEqual = async_test("Test needkey requests == "+this.keysNeededEqual);
                break;

            case TestMachine.CHECK_NEEDKEY_GREATER:
                this.keysNeededGreater = testParameters.keysNeededGreater;
                this.testNeedkeyGreater = async_test("Test needkey requests > "+this.keysNeededGreater);
                break;

            case TestMachine.CHECK_DURATION:
                this.duration = testParameters.duration;
                this.durationRange = testParameters.durationRange;
                this.testDuration = async_test("Test duration ~= "+this.duration);
                break;

            case TestMachine.SEEK_TIME:
                this.seekStart = testParameters.seekStart;
                this.seekEnd = testParameters.seekEnd;
                break;

            case TestMachine.SEEK_TIME2:
                this.seekStart2 = testParameters.seekStart2;
                this.seekEnd2 = testParameters.seekEnd2;
                break;

            case TestMachine.CHECK_ENDED:
                vid.addEventListener("ended", function () {
                        this.ended = true;
                    }.bind(this));
                this.testEnded = async_test("Test ended == true");
                break;

            case TestMachine.CHECK_END_TIME:
                this.endTime = testParameters.endTime;
                this.endRange = testParameters.endRange;
                this.testCurrentTime = async_test("Test last currentTime ~= "+this.endTime);
                break;
            }
        }

        setTimeout(function () { if (!this.ended) this.ended = false; }.bind(this), timeout * 1000);
    }

    TestMachine.START = "START";

    TestMachine.SET_TEMPORARY_SESSION = "SET_TEMPORARY_SESSION";
    TestMachine.SET_PERSISTENT_LICENSE_SESSION = "SET_PERSISTENT_LICENSE_SESSION";
    TestMachine.SET_PERSISTENT_RELEASE_SESSION = "SET_PERSISTENT_RELEASE_SESSION";
    TestMachine.GET_STREAMS = "GET_STREAMS";
    TestMachine.SET_STREAM = "SET_STREAM";
    TestMachine.START_PLAY = "START_PLAY";
    TestMachine.GET_LICENSE = "GET_LICENSE";
    TestMachine.WAIT_FOR_LICENSE = "WAIT_FOR_LICENSE";
    TestMachine.START_PLAY_LICENSE = "START_PLAY_LICENSE";
    TestMachine.CHECK_KEYSTATUS = "CHECK_KEYSTATUS";
    TestMachine.CHECK_SESSION_TYPE = "CHECK_SESSION_TYPE";
    TestMachine.CHECK_SECOND_KEYSTATUS = "CHECK_SECOND_KEYSTATUS";
    TestMachine.CHECK_PLAYING = "CHECK_PLAYING";
    TestMachine.SEEK_TIME = "SEEK_TIME";
    TestMachine.SEEK_TIME2 = "SEEK_TIME2";
    TestMachine.CHECK_NEEDKEY_EQUAL = "CHECK_NEEDKEY_EQUAL";
    TestMachine.CHECK_NEEDKEY_GREATER = "CHECK_NEEDKEY_GREATER";
    TestMachine.CHECK_ENDED = "CHECK_ENDED";
    TestMachine.CHECK_DURATION = "CHECK_DURATION";
    TestMachine.CHECK_END_TIME = "CHECK_END_TIME";

    TestMachine.END = "END";

    TestMachine.prototype.runTests = function ()
    {
        var i;

        console.info("TestMachine state: "+this.state);

        switch (this.state) {

        case TestMachine.START:
            this.state = this.sequence[this.state];
            break;

        case TestMachine.SET_TEMPORARY_SESSION:
            setSessionType("temporary");
            this.state = this.sequence[this.state];
            break;

        case TestMachine.SET_PERSISTENT_LICENSE_SESSION:
            setSessionType("persistent-license");
            this.state = this.sequence[this.state];
            break;

        case TestMachine.SET_PERSISTENT_RELEASE_SESSION:
            setSessionType("persistent-release-message");
            this.state = this.sequence[this.state];
            break;

        case TestMachine.GET_STREAMS:
            if(false === this.fetchingDrmCredentials)
            {
                this.fetchingDrmCredentials = true;
                this.endpoints = [];
                $.get("/config.json", function(config)
                {
                    $.get(config.test_tool_endpoint, function(api)
                    {
                        api.links.forEach(function (item)
                        {
                            var parser = document.createElement('a');
                            parser.href = config.test_tool_endpoint;
                            parser.pathname = item.href;

                            this.endpoints[item.rel] = parser.href;
                        }.bind(this));

                        $.get(this.endpoints.drm, function(drm)
                        {
                            var sessionId = btoa(JSON.stringify(
                                {
                                    "sessionID": drm.sessionId
                                }
                            ));
                            var drmTodayData = btoa(JSON.stringify(
                                {
                                    "userId": drm.userId,
                                    "sessionId": sessionId,
                                    "merchant": "global_dnla"
                                }
                            ));
                            var protData = {
                                "com.widevine.alpha":{
                                    "drmtoday":true,
                                    "serverURL":"https://lic.staging.drmtoday.com/license-proxy-widevine/cenc/",
                                    "httpRequestHeaders":{ "dt-custom-data":drmTodayData }
                                },
                                "com.microsoft.playready":{
                                    "drmtoday":true,
                                    "serverURL":"https://lic.staging.drmtoday.com/license-proxy-headerauth/drmtoday/RightsManager.asmx",
                                    "httpRequestHeaders":{
                                        "http-header-CustomData":drmTodayData
                                    }
                                }
                            };
                            this.stream = {
                                name: "",
                                url: this.videoUrl,
                                protData: protData
                            }

                            this.state = this.sequence[this.state];
                        }.bind(this), "json");
                    }.bind(this), "json");
                }.bind(this), "json");
            }
            break;

        case TestMachine.SET_STREAM:
            testing.setStream(this.stream);
            this.state = this.sequence[this.state];
            break;

        case TestMachine.START_PLAY:
            testing.doLoad();
            this.state = this.sequence[this.state];
            break;

        case TestMachine.GET_LICENSE:
            testing.doLicenseFetch();
            this.state = this.sequence[this.state];
            break;

        case TestMachine.WAIT_FOR_LICENSE:
            if (testing.drmData && testing.drmData[0]) {
                this.state = this.sequence[this.state];
            }
            break;

        case TestMachine.START_PLAY_LICENSE:
            testing.play(testing.drmData[0]);
            this.state = this.sequence[this.state];
            break;

        case TestMachine.CHECK_KEYSTATUS:
            if (testing.keySystemAccessCompleteError) {
                this.testKeystatus.step(function() {
                        assert_unreached(testing.keySystemAccessCompleteError);
                    }.bind(this));
                this.testKeystatus.done();
                this.state = TestMachine.END;
                break;
            }

            if (testing.session && testing.session.keystatus) {
                for (i = 0; i < testing.session.keystatus.length; i++) {
                    this.testKeystatus.key = testing.session.keystatus[i].key;
                    this.testKeystatus.step(function() {
                            assert_equals(testing.session.keystatus[i].status,
                                          "usable", "keystatus");
                        }.bind(this));
                    this.testKeystatus.done();
                    this.state = this.sequence[this.state];
                    break;
                }
            }
            break;

        case TestMachine.CHECK_SECOND_KEYSTATUS:
            if (testing.keySystemAccessCompleteError) {
                this.testSecondKey.step(function() {
                        assert_unreached(testing.keySystemAccessCompleteError);
                    }.bind(this));
                this.testSecondKey.done();
                this.testSecondKeyStatus.step(function() {
                        assert_unreached(testing.keySystemAccessCompleteError);
                    }.bind(this));
                this.testSecondKeyStatus.done();
                this.state = TestMachine.END;
                break;
            }

            if (testing.session && testing.session.keystatus) {
                for (i = 0; i < testing.session.keystatus.length; i++) {
                    if ((testing.session.keystatus[i].key != this.testKeystatus.key)
                        && (testing.session.keystatus[i].status == "usable")) {
                        this.testSecondKey.key = testing.session.keystatus[i].key;
                        this.testSecondKey.step(function() {
                                assert_not_equals(this.testKeystatus.key, this.testSecondKey.key, "key");
                            }.bind(this));
                        this.testSecondKey.done();
                        this.testSecondKeyStatus.step(function() {
                                assert_equals(testing.session.keystatus[i].status,
                                              "usable", "keystatus");
                            }.bind(this));
                        this.testSecondKeyStatus.done();
                        this.state = this.sequence[this.state];

                        break;
                    }
                }
            }
            break;

        case TestMachine.CHECK_SESSION_TYPE:
            if (testing.session && testing.session.sessionToken) {
                this.testSessionType.step(function() {
                        assert_equals(testing.session.sessionToken.getSessionType(),
                                      this.sessionType, "session type");
                    }.bind(this));
                this.testSessionType.done();
                this.state = this.sequence[this.state];
            }
            break;

        case TestMachine.CHECK_PLAYING:
            if (this.playing) {
                this.testPlaying.step(function() {
                        assert_true(this.playing, "playing");
                    }.bind(this));
                this.testPlaying.done();
                this.state = this.sequence[this.state];
            } else if (testing.protectionError) {
                this.testPlaying.step(function() {
                        assert_unreached(testing.protectionError);
                    }.bind(this));
                this.testPlaying.done();
                this.state = TestMachine.END;
            }
            break;

        case TestMachine.CHECK_NEEDKEY_EQUAL:
            this.testNeedkeyEqual.step(function() {
                    assert_equals(testing.needkey, this.keysNeededEqual, "needkey events");
                }.bind(this));
            this.testNeedkeyEqual.done();
            this.state = this.sequence[this.state];
            break;

        case TestMachine.CHECK_NEEDKEY_GREATER:
            this.testNeedkeyGreater.step(function() {
                    assert_greater_than(testing.needkey, this.keysNeededGreater, "needkey events");
                }.bind(this));
            this.testNeedkeyGreater.done();
            this.state = this.sequence[this.state];
            break;

        case TestMachine.CHECK_DURATION:
            this.testDuration.step(function() {
                    assert_approx_equals(vid.duration, this.duration, this.durationRange, "duration");
                }.bind(this));
            this.testDuration.done();
            this.state = this.sequence[this.state];
            break;

        case TestMachine.SEEK_TIME:
            if (vid.currentTime > this.seekStart) {
                vid.currentTime = this.seekEnd;
                this.state = this.sequence[this.state];
            }
            break;

        case TestMachine.SEEK_TIME2:
            if (vid.currentTime > this.seekStart2) {
                vid.currentTime = this.seekEnd2;
                this.state = this.sequence[this.state];
            }
            break;

        case TestMachine.CHECK_ENDED:
            if (this.ended !== undefined) {
                this.testEnded.step(function() {
                        assert_true(this.ended, "ended");
                    }.bind(this));
                this.testEnded.done();
                this.state = this.sequence[this.state];
            }
            break;

        case TestMachine.CHECK_END_TIME:
            if ((endLoops < endMax) && (vid.currentTime < (this.endTime - this.endRange))) {
                endLoops++;
                break;
            }
            this.testCurrentTime.step(function() {
                    assert_approx_equals(vid.currentTime, this.endTime, this.endRange, "currentTime");
                }.bind(this));
            this.testCurrentTime.done();
            this.state = this.sequence[this.state];
            break;

        case TestMachine.END:
            if (this.chain) {
                testing.needkey = 0;
                if (this.testKeystatus) {
                    this.chain.testKeystatus = this.testKeystatus;
                }
                this.chain.runTests();
            }
            return;

        }

        setTimeout(this.runTests.bind(this), sleep);
    }

    var setSessionType = function (newType)
    {
        var button, on, off;

        on = function (id)
        {
            var b = document.getElementById(id);
            b.setAttribute("checked", true);
            b.parentElement.classList.add("active");
        }

        off = function (id)
        {
            var b = document.getElementById(id);
            b.removeAttribute("checked");
            b.parentElement.classList.remove("active");
        }

        if (newType == "temporary") {
            off("persistent-license");
            off("persistent-release-message");
            on("temporary");
        } else if (newType == "persistent-license") {
            off("temporary");
            off("persistent-release-message");
            on("persistent-license");
        } else if (newType == "persistent-release-message") {
            off("temporary");
            off("persistent-license");
            on("persistent-release-message");
        }
    }

    return TestMachine;

}();

