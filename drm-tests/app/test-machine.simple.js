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
    var TestMachine = function (sequence, timeout, testParameters, vid) 
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
        {
            var sessionId = btoa(JSON.stringify(
                    {
                        "auth": "123",
                        "overide": {
                            "profile": {
                                "rental" : {
                                    "absoluteExpiration" : "2014-07-18T12:15:24Z",
                                    "playDuration" : 360000
                                }
                            }
                        }
                    }
                ));
            var drmTodayData = btoa(JSON.stringify(
                    {
                        "userId": "drm-test@example.com",
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
                url: this.videoUrl,
                protData: protData
            }
            this.state = this.sequence[this.state];
        } break;

        case TestMachine.SET_STREAM:
            this.context = new Dash.di.DashContext();
            this.player = new MediaPlayer(context);
            this.player.startup();
            this.player.attachView(video);
            this.state = this.sequence[this.state];
            break;

        case TestMachine.START_PLAY:
            this.player.attachSource(this.stream.url, null, this.stream.protData);
            this.player.setAutoSwitchQuality(true);
            this.state = this.sequence[this.state];
            break;

        case TestMachine.GET_LICENSE:
            this.player.retrieveManifest(this.stream.url, manifestLoaded);
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

    var manifestLoaded = function (manifest/*, error*/) 
    {
        if (manifest) 
        {
            var found = false;
            for (var i = 0; i < $scope.drmData.length; i++) {
                if (manifest.url === $scope.drmData[i].manifest.url) {
                    found = true;
                    break;
                }
            }
            if (!found) 
            {
                var protCtrl = player.createProtection();
                if ($scope.selectedItem.hasOwnProperty("protData")) {
                    protCtrl.setProtectionData($scope.selectedItem.protData);
                }

                addDRMData(manifest, protCtrl);

                protCtrl.init(manifest);
            }

        } else {
            // Log error here
        }

    };


    var addDRMData = function(manifest, protCtrl) 
    {
        // Assign the session type to be used for this controller
        protCtrl.setSessionType($("#session-type").find(".active").children().attr("id"));

        var data = {
            manifest: manifest,
            protCtrl: protCtrl,
            licenseReceived: false,
            sessions: []
        };
        var findSession = function(sessionID) {
            for (var i = 0; i < data.sessions.length; i++) {
                if (data.sessions[i].sessionID === sessionID)
                    return data.sessions[i];
            }
            return null;
        };
        $scope.drmData.push(data);
        $scope.safeApply();

        protCtrl.addEventListener(MediaPlayer.dependencies.ProtectionController.events.KEY_SYSTEM_SELECTED, function(e) 
        {
            if (!e.error) {
                data.ksconfig = e.data.ksConfiguration;
            } else {
                data.error = e.error;

                // (ew)
                testing.keySystemAccessCompleteError = data.error;
            }
            $scope.safeApply();
        });
        protCtrl.addEventListener(MediaPlayer.dependencies.ProtectionController.events.KEY_SESSION_CREATED, function(e) 
        {
            if (!e.error) {
                var persistedSession = findSession(e.data.getSessionID());
                if (persistedSession) {
                    persistedSession.isLoaded = true;
                    persistedSession.sessionToken = e.data;
                } else {
                    var sessionToken = e.data;
                    data.sessions.push({
                        sessionToken: sessionToken,
                        sessionID: e.data.getSessionID(),
                        isLoaded: true
                    });

                    // (ew)
                    testing.session = data.sessions[data.sessions.length-1];
                }
            } else {
                data.error = e.error;

                // (ew)
                testing.keySystemAccessCompleteError = data.error;
            }
            $scope.safeApply();
        });
        protCtrl.addEventListener(MediaPlayer.dependencies.ProtectionController.events.KEY_SESSION_REMOVED, function(e) 
        {
            if (!e.error) {
                var session = findSession(e.data);
                if (session) {
                    session.isLoaded = false;
                    session.sessionToken = null;
                }
            } else {
                data.error = e.error;
            }
            $scope.safeApply();
        });
        protCtrl.addEventListener(MediaPlayer.dependencies.ProtectionController.events.KEY_SESSION_CLOSED, function(e) 
        {
            if (!e.error) {
                for (var i = 0; i < data.sessions.length; i++) {
                    if (data.sessions[i].sessionID === e.data) {
                        data.sessions.splice(i, 1);
                        break;
                    }
                }
            } else {
                data.error = e.error;
            }
            $scope.safeApply();
        });
        protCtrl.addEventListener(MediaPlayer.dependencies.ProtectionController.events.KEY_STATUSES_CHANGED, function(e) {
            var session = findSession(e.data.getSessionID());
            if (session) {
                var toGUID = function(uakey) {
                    var keyIdx = 0, retVal = "", i, zeroPad = function(str) {
                        return (str.length === 1) ? "0" + str : str;
                    };
                    for (i = 0; i < 4; i++, keyIdx++)
                        retVal += zeroPad(uakey[keyIdx].toString(16));
                    retVal += "-";
                    for (i = 0; i < 2; i++, keyIdx++)
                        retVal += zeroPad(uakey[keyIdx].toString(16));
                    retVal += "-";
                    for (i = 0; i < 2; i++, keyIdx++)
                        retVal += zeroPad(uakey[keyIdx].toString(16));
                    retVal += "-";
                    for (i = 0; i < 2; i++, keyIdx++)
                        retVal += zeroPad(uakey[keyIdx].toString(16));
                    retVal += "-";
                    for (i = 0; i < 6; i++, keyIdx++)
                        retVal += zeroPad(uakey[keyIdx].toString(16));
                    return retVal;
                };
                session.keystatus = [];
                e.data.getKeyStatuses().forEach(function(status, key){
                    session.keystatus.push({
                        key: toGUID(new Uint8Array(key)),
                        status: status
                    });
                });
                $scope.safeApply();
            }
        });
        protCtrl.addEventListener(MediaPlayer.dependencies.ProtectionController.events.KEY_MESSAGE, function(e) 
        {
            var session = findSession(e.data.sessionToken.getSessionID());
            if (session) {
                session.lastMessage = "Last Message: " + e.data.message.byteLength + " bytes";
                if (e.data.messageType) {
                    session.lastMessage += " (" + e.data.messageType + "). ";
                } else {
                    session.lastMessage += ". ";
                }
                session.lastMessage += "Waiting for response from license server...";
                $scope.safeApply();
            }
        });
        protCtrl.addEventListener(MediaPlayer.dependencies.ProtectionController.events.LICENSE_REQUEST_COMPLETE, function(e) {
            if (!e.error) {
                var session = findSession(e.data.sessionToken.getSessionID());
                if (session) {
                    session.lastMessage = "Successful response received from license server for message type '" + e.data.messageType + "'!";
                    data.licenseReceived = true;
                }
            } else {
                data.error = "License request failed for message type '" + e.data.messageType + "'! " + e.error;

                // (ew)
                testing.keySystemAccessCompleteError = data.error;
            }
            $scope.safeApply();
        });

        // (ew)
        data[MediaPlayer.models.ProtectionModel.eventList.ENAME_NEED_KEY] = function(e) {
            testing.needkey++;
        };
        protCtrl.protectionModel.subscribe(MediaPlayer.models.ProtectionModel.eventList.ENAME_NEED_KEY, data);

        return data;
    };

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

