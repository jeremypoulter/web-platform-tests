/// <reference path="testlist.js" />
/// <reference path="upload.js" />

/*jshint nonew: false */
(function() {
"use strict";
var runner;
var testharness_properties = {output:false,
                              timeout_multiplier:1};

function Config() {
    this.path_list = ['/config.default.json', '/config.json'];
    this.count = 0;
}

Config.prototype =
{
    load: function (loaded_callback)
    {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function ()
        {
            if (xhr.readyState !== 4) {
                return;
            }
            if (xhr.status === 200 ) 
            {
                var data = JSON.parse(xhr.responseText);
                for (var index in data) {
                    this[index] = data[index];
                }
            }

            if (this.count < this.path_list.length) {
                this.load(loaded_callback);
            } else {
                loaded_callback();
            }
        }.bind(this);
        xhr.open("GET", this.path_list[this.count++]);
        xhr.send(null);
    },

    by_type:function(type) {
        if (this.data.items.hasOwnProperty(type)) {
            return this.data.items[type];
        } else {
            return [];
        }
    }
};


function Manifest(path) {
    this.data = null;
    this.path = path;
    this.num_tests = null;
}

Manifest.prototype = {
    load: function (loaded_callback) {
        var xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) {
                return;
            }
            if (!(xhr.status === 200 || xhr.status === 0)) {
                throw new Error("Manifest " + this.path + " failed to load");
            }
            this.data = JSON.parse(xhr.responseText);
            loaded_callback();
        }.bind(this);
        xhr.open("GET", this.path);
        xhr.send(null);
    },

    by_type: function (type) {
        if (this.data.items.hasOwnProperty(type)) {
            return this.data.items[type];
        } else {
            return [];
        }
    }
};


function ManifestIterator(manifest, path, test_types) {
    this.manifest = manifest;
    this.path = path.split(',');
    this.test_types = test_types;
    this.test_types_index = -1;
    this.test_list = null;
    this.test_index = null;
}

ManifestIterator.prototype = {
    next: function() {
        var manifest_item = null;

        if (this.test_types.length === 0) {
            return null;
        }

        while (!manifest_item) {
            while (this.test_list === null || this.test_index >= this.test_list.length) {
                this.test_types_index++;
                if (this.test_types_index >= this.test_types.length) {
                    return null;
                }
                this.test_index = 0;
                this.test_list = this.manifest.by_type(this.test_types[this.test_types_index]);
            }

            manifest_item = this.test_list[this.test_index++];
            while (manifest_item && !this.matches(manifest_item)) {
                manifest_item = this.test_list[this.test_index++];
            }
            if (manifest_item) {
                return this.to_test(manifest_item);
            }
        }
    },

    matches: function (manifest_item)
    {
        for(var i in this.path) {
            if (0 === manifest_item.url.indexOf(this.path[i])) return true;
        }

        return false;
    },

    to_test: function(manifest_item) {
        var test = {
            type: this.test_types[this.test_types_index],
            url: manifest_item.url
        };
        if (manifest_item.hasOwnProperty("ref_url")) {
            test.ref_type = manifest_item.ref_type;
            test.ref_url = manifest_item.ref_url;
        }
        return test;
    },

    count: function() {
        return this.test_types.reduce(function(prev, current) {
            var matches = this.manifest.by_type(current).filter(function(x) {
                return this.matches(x);
            }.bind(this));
            return prev + matches.length;
        }.bind(this), 0);
    }
};

function VisualOutput(elem, runner) {
    this.elem = elem;
    this.runner = runner;
    this.results_table = null;
    this.section_wrapper = null;
    this.results_table = this.elem.querySelector(".results > table");
    this.section = null;
    this.progress = this.elem.querySelector(".summary .progress");
    this.meter = this.progress.querySelector(".progress-bar");
    this.result_count = null;
    this.json_results_area = this.elem.querySelector("textarea");

    this.elem.style.display = "none";
    this.runner.start_callbacks.push(this.on_start.bind(this));
    this.runner.result_callbacks.push(this.on_result.bind(this));
    this.runner.done_callbacks.push(this.on_done.bind(this));
}

VisualOutput.prototype = {
    clear: function() {
        this.result_count = {"PASS":0,
                             "FAIL":0,
                             "ERROR":0,
                             "TIMEOUT":0};
        for (var p in this.result_count) {
            if (this.result_count.hasOwnProperty(p)) {
                this.elem.querySelector("td." + p).textContent = 0;
            }
        }
        if (this.json_results_area) {
            this.json_results_area.parentNode.removeChild(this.json_results_area);
        }
        this.meter.style.width = '0px';
        this.meter.textContent = '0%';
        this.elem.querySelector(".jsonResults").style.display = "none";
        this.results_table.removeChild(this.results_table.tBodies[0]);
        this.results_table.appendChild(document.createElement("tbody"));
    },

    hide: function() {
        
    },

    on_start: function() {
        this.clear();
        this.elem.style.display = "block";
        this.meter.classList.remove("stopped");
        this.meter.classList.add("progress-striped", "active");
    },

    on_result: function(test, status, message, subtests) {
        var row = document.createElement("tr");

        var subtest_pass_count = subtests.reduce(function(prev, current) {
            return (current.status === "PASS") ? prev + 1 : prev;
        }, 0);
        var subtests_count = subtests.length;

        var test_status;
        if (subtest_pass_count === subtests_count &&
            (status == "OK" || status == "PASS")) {
            test_status = "PASS";
        } else if (subtests_count > 0 && status === "OK") {
            test_status = "FAIL";
        } else {
            test_status = status;
        }

        subtests.forEach(function(subtest) {
            if (this.result_count.hasOwnProperty(subtest.status)) {
                this.result_count[subtest.status] += 1;
            }
        }.bind(this));
        if (this.result_count.hasOwnProperty(status)) {
            this.result_count[status] += 1;
        }

        var name_node = row.appendChild(document.createElement("td"));
        name_node.appendChild(this.test_name_node(test));

        var status_node = row.appendChild(document.createElement("td"));
        status_node.textContent = test_status;
        status_node.className = test_status;

        var message_node = row.appendChild(document.createElement("td"));
        message_node.textContent = message || "";

        var subtests_node = row.appendChild(document.createElement("td"));
        if (subtests_count) {
            subtests_node.textContent = subtest_pass_count + "/" + subtests_count;
        } else {
            if (status == "PASS") {
                subtests_node.textContent = "1/1";
            } else {
                subtests_node.textContent = "0/1";
            }
        }

        var status_arr = ["PASS", "FAIL", "ERROR", "TIMEOUT"];
        for (var i = 0; i < status_arr.length; i++) {
            this.elem.querySelector("td." + status_arr[i]).textContent = this.result_count[status_arr[i]];
        }

        this.results_table.tBodies[0].appendChild(row);
        this.update_meter(this.runner.progress(), this.runner.results.count(), this.runner.test_count());
    },

    on_done: function() {
        this.meter.setAttribute("aria-valuenow", this.meter.getAttribute("aria-valuemax"));
        this.meter.style.width = "100%";
        if (this.runner.stop_flag) {
            this.meter.textContent = "Stopped";
            this.meter.classList.add("stopped");
        } else {
            this.meter.textContent = "Done!";
        }
        this.meter.classList.remove("progress-striped", "active");
        this.runner.test_div.textContent = "";
        //add the json serialization of the results
        var a = this.elem.querySelector(".jsonResults");
        var json = this.runner.results.to_json();

        if (document.getElementById("dumpit").checked) {
            this.json_results_area = document.createElement("textarea");
            this.json_results_area.style.width = "100%";
            this.json_results_area.setAttribute("rows", "50");
            this.elem.appendChild(this.json_results_area);
            this.json_results_area.textContent = json;
        }
        var blob = new Blob([json], { type: "application/json" });
        a.href = window.URL.createObjectURL(blob);
        a.download = "runner-results.json";
        a.textContent = "Download JSON results";
        if (!a.getAttribute("download")) a.textContent += " (right-click and save as to download)";
        a.style.display = "inherit";
    },

    test_name_node: function(test) {
        if (!test.hasOwnProperty("ref_url")) {
            return this.link(test.url);
        } else {
            var wrapper = document.createElement("span");
            wrapper.appendChild(this.link(test.url));
            wrapper.appendChild(document.createTextNode(" " + test.ref_type + " "));
            wrapper.appendChild(this.link(test.ref_url));
            return wrapper;
        }
    },

    link: function(href) {
        var link = document.createElement("a");
        link.href = this.runner.server + href;
        link.textContent = href;
        return link;
    },

    update_meter: function(progress, count, total) {
        this.meter.setAttribute("aria-valuenow", count);
        this.meter.setAttribute("aria-valuemax", total);
        this.meter.textContent = this.meter.style.width = (progress * 100).toFixed(1) + "%";
    }

};

function ManualUI(elem, runner) {
    this.elem = elem;
    this.runner = runner;
    this.pass_button = this.elem.querySelector(".pass");
    this.fail_button = this.elem.querySelector(".fail");
    this.ref_type = this.elem.querySelector(".refType");

    this.ref_buttons = this.elem.querySelector(".reftestUI");
    this.test_button = this.ref_buttons.querySelector(".test");
    this.ref_button = this.ref_buttons.querySelector(".ref");

    this.hide();

    this.runner.test_start_callbacks.push(this.on_test_start.bind(this));
    this.runner.test_pause_callbacks.push(this.hide.bind(this));
    this.runner.done_callbacks.push(this.on_done.bind(this));

    this.pass_button.onclick = function() {
        this.disable_buttons();
        this.runner.on_result("PASS", "", []);
    }.bind(this);

    this.fail_button.onclick = function() {
        this.disable_buttons();
        this.runner.on_result("FAIL", "", []);
    }.bind(this);
}

ManualUI.prototype = {
    show: function() {
        this.elem.style.display = "block";
        setTimeout(this.enable_buttons.bind(this), 200);
    },

    hide: function() {
        this.elem.style.display = "none";
    },

    show_ref: function() {
        this.ref_buttons.style.display = "block";
        this.ref_button.parentNode.classList.remove("active");
        this.test_button.parentNode.classList.add("active");
        this.test_button.onclick = function () {
            this.ref_button.parentNode.classList.remove("active");
            this.test_button.parentNode.classList.add("active");
            this.runner.load(this.runner.current_test.url);
        }.bind(this);
        this.ref_button.onclick = function() {
            this.ref_button.parentNode.classList.add("active");
            this.test_button.parentNode.classList.remove("active");
            this.runner.load(this.runner.current_test.ref_url);
        }.bind(this);
    },

    hide_ref: function() {
        this.ref_buttons.style.display = "none";
    },

    disable_buttons: function() {
        this.pass_button.disabled = true;
        this.fail_button.disabled = true;
    },

    enable_buttons: function() {
        this.pass_button.disabled = false;
        this.fail_button.disabled = false;
    },

    on_test_start: function(test) {
        if (test.type == "manual" || test.type == "reftest") {
            this.show();
        } else {
            this.hide();
        }
        if (test.type == "reftest") {
            this.show_ref();
            this.ref_type.textContent = test.ref_type === "==" ? "equal" : "unequal";
        } else {
            this.hide_ref();
        }
    },

    on_done: function() {
        this.hide();
    }
};

function TestControl(elem, runner) {
    this.elem = elem;
    this.path_input = this.elem.querySelector(".path");
    this.pause_button = this.elem.querySelector("button.togglePause");
    this.start_button = this.elem.querySelector("button.toggleStart");
    this.type_checkboxes = Array.prototype.slice.call(
        this.elem.querySelectorAll("input[type=checkbox].test-type"));
    this.type_checkboxes.forEach(function(elem) {
        elem.addEventListener("click", function() {
            this.start_button.disabled = this.get_test_types().length < 1;
        }.bind(this),
        false);
    }.bind(this));
    this.timeout_input = this.elem.querySelector(".timeout_multiplier");
    this.render_checkbox = this.elem.querySelector(".render");
    this.runner = runner;
    this.runner.done_callbacks.push(this.on_done.bind(this));
    this.set_start();
}

TestControl.prototype = {
    set_start: function() {
        this.start_button.disabled = this.get_test_types().length < 1;
        this.pause_button.disabled = true;
        this.start_button.textContent = "Start";
        this.path_input.disabled = false;
        this.type_checkboxes.forEach(function(elem) {
            elem.disabled = false;
        });
        this.start_button.onclick = function() {
            // Hide the instructions
            document.getElementById('instructions').style.display = "none";

            var path = this.get_path();
            var test_types = this.get_test_types();
            var settings = this.get_testharness_settings();
            this.runner.start(path, test_types, settings);
            if (this.runner.manifest_iterator.count() > 0) {
                this.set_stop();
                this.set_pause();
            }
        }.bind(this);
    },

    set_stop: function() {
        clearTimeout(this.runner.timeout);
        this.pause_button.disabled = false;
        this.start_button.textContent = "Stop";
        this.path_input.disabled = true;
        this.type_checkboxes.forEach(function(elem) {
            elem.disabled = true;
        });
        this.start_button.onclick = function() {
            this.runner.stop_flag = true;
            this.runner.done();
        }.bind(this);
    },

    set_pause: function() {
        this.pause_button.textContent = "Pause";
        this.pause_button.onclick = function() {
            this.runner.pause();
            this.set_resume();
        }.bind(this);
    },

    set_resume: function() {
        this.pause_button.textContent = "Resume";
        this.pause_button.onclick = function() {
            this.runner.unpause();
            this.set_pause();
        }.bind(this);

    },

    get_path: function() {
        return this.path_input.value;
    },

    get_test_types: function() {
        return this.type_checkboxes.filter(function(elem) {
            return elem.checked;
        }).map(function(elem) {
            return elem.value;
        });
    },

    get_testharness_settings: function() {
        return {timeout_multiplier: parseFloat(this.timeout_input.value),
                output: this.render_checkbox.checked};
    },

    on_done: function() {
        this.set_pause();
        this.set_start();
    }
};

function Results(runner) {
    this.test_results = null;
    this.runner = runner;

    this.runner.start_callbacks.push(this.on_start.bind(this));
}

Results.prototype = {
    on_start: function() {
        this.test_results = [];
    },

    set: function(test, status, message, subtests) {
        this.test_results.push({"test":test,
                                "subtests":subtests,
                                "status":status,
                                "message":message});
    },

    count: function() {
        return this.test_results.length;
    },

    to_json: function() {
        var data = {
            "results": this.test_results.map(function(result) {
                var rv = {"test":(result.test.hasOwnProperty("ref_url") ?
                                  [result.test.url, result.test.ref_type, result.test.ref_url] :
                                  result.test.url),
                          "subtests":result.subtests,
                          "status":result.status,
                          "message":result.message};
                return rv;
            })
        };
        return JSON.stringify(data, null, 2);
    }
};

function ServerResults(runner)
{
    this.runner = runner;
    this.endpoint = false;

    this.runner.result_callbacks.push(this.on_result.bind(this));
}

ServerResults.prototype =
{
    open: function(endpoint) {
        this.endpoint = endpoint;
    },
    close: function (){
        this.endpoint = false;
    },
    on_result: function (test, status, message, subtests)
    {
        if (false !== this.endpoint)
        {
            var dataObject = {
                "test": test,
                "subtests": subtests,
                "status": status,
                "message": message
            };
            var data = JSON.stringify(dataObject);
            ajax(this.endpoint, "POST", data);
        }
    }
};


function TopLevelTestList(inputBox, selectList)
{
  this.inputBox = inputBox;
  this.selectList = selectList;
  selectList.addEventListener('change', this.on_change.bind(this));
  var opt = new Option("Custom", "");
  selectList.add(opt);
  var opt = new Option("All", "/" + tests.join(",/"));
  selectList.add(opt);
  for (var i in tests)
  {
    var test = tests[i];
    
    opt = new Option(test, "/"+test);
    selectList.add(opt);
  }
}

TopLevelTestList.prototype = {
    on_change: function() {
        this.inputBox.value = this.selectList.value;
    }
};


    /*
     * Hugely simplified version of WAMP, just enough to connect and subscribe to the required topic.
     * 
     * Will probably only work with PHP Ratcher (http://socketo.me/) and probably full of security holes.
     * 
     * +--------------+----+------------------+
     * | Message Type | ID | DIRECTION        |
     * |--------------+----+------------------+
     * | WELCOME      | 0  | Server-to-Client |
     * | PREFIX       | 1  | Bi-Directional   |
     * | CALL         | 2  | Client-to-Server |
     * | CALL RESULT  | 3  | Server-to-Client |
     * | CALL ERROR   | 4  | Server-to-Client |
     * | SUBSCRIBE    | 5  | Client-to-Server |
     * | UNSUBSCRIBE  | 6  | Client-to-Server |
     * | PUBLISH      | 7  | Client-to-Server |
     * | EVENT        | 8  | Server-to-Client |
     * +--------------+----+------------------+
     */

function SimpleWamp(server, onConnect)
{
    this.WELCOME = 0;
    this.PREFIX = 1;
    this.CALL = 2;
    this.CALL_RESULT = 3;
    this.CALL_ERROR = 4;
    this.SUBSCRIBE = 5;
    this.UNSUBSCRIBE = 6;
    this.PUBLISH = 7;
    this.EVENT = 8;

    this.topics = [];

    this.serverSocket = new WebSocket(server);
    this.serverSocket.onmessage = function (event)
    {
        var msg = JSON.parse(event.data);
        switch (msg[0])
        {
            case this.WELCOME:
                onConnect();
                break;
            case this.EVENT:
                this.topics[msg[1]](msg[2]);
                break;
        }
    }.bind(this);
}

SimpleWamp.prototype = 
{
    subscribe: function (topic, onEvent) 
    {
        this.serverSocket.send(JSON.stringify([this.SUBSCRIBE, topic]));
        this.topics[topic] = onEvent;
    },
    unsubscribe: function (topic) 
    {
        this.serverSocket.send(JSON.stringify([this.UNSUBSCRIBE, topic]));
        this.topics[topic] = null;
    }
}

function Runner(manifest_path, options)
{
    this.server = location.protocol + "//" + location.host;
    this.manifest = new Manifest(manifest_path);
    this.config = new Config();
    this.path = null;
    this.test_types = null;
    this.manifest_iterator = null;

    this.test_window = null;
    this.test_div = document.getElementById('test_url');
    this.current_test = null;
    this.timeout = null;
    this.num_tests = null;
    this.pause_flag = false;
    this.stop_flag = false;
    this.done_flag = false;

    this.start_callbacks = [];
    this.test_start_callbacks = [];
    this.test_pause_callbacks = [];
    this.result_callbacks = [];
    this.done_callbacks = [];
    this.error_callbacks = [];

    this.results = new Results(this);
    this.serverResults = new ServerResults(this);

    this.endpoints = [];
    this.resultsSessionEndpoint = false;

    this.start_after_manifest_load = false;
    this.manifest.load(this.manifest_loaded.bind(this));
    this.config.load(this.config_loaded.bind(this));

    this.topic = 'test.html5_test_suite.dlna.org/';
    this.serverEvent = null;

    var new_session = document.getElementById("new_session");
    new_session.addEventListener('click', function () {
        this.create_new_session();
    }.bind(this));

    var upload_results = document.getElementById("upload_results");
    upload_results.addEventListener('change', function () {
        if (upload_results.checked) {
            new_session.parentNode.style.display = 'inherit';
            this.create_new_session();
        } else {
            new_session.parentNode.style.display = 'none';
            this.resultsSessionEndpoint = false;
            this.remote_disconnect();
        }
    }.bind(this));
}

Runner.prototype = {
    test_timeout: 20000, //ms

    currentTest: function() {
        return this.manifest[this.mTestCount];
    },

    open_test_window: function() {
        if (document.getElementById('iframe').checked) {
            var placeHolder = document.getElementById('iFramePlaceholder');

            var iFrameElement = document.createElement("iframe");
            iFrameElement.id = 'outputWindow';
            iFrameElement.style.width = placeHolder.clientWidth + "px";
            iFrameElement.style.height = (window.innerHeight * 0.6) + "px";
            
            placeHolder.appendChild(iFrameElement);
            this.test_window = iFrameElement.contentWindow;
        } else {
            this.test_window = window.open("about:blank", 800, 600);
        }
    },

    manifest_loaded: function() {
        if (this.start_after_manifest_load) {
            this.do_start();
        }
    },

    config_loaded: function () {
        if (this.config.test_tool_endpoint)
        {
            ajax(this.config.test_tool_endpoint, "GET", "", function (data) {
                data.links.forEach(function (item)
                {
                    var parser = document.createElement('a');
                    parser.href = this.config.test_tool_endpoint;
                    parser.pathname = item.href;

                    this.endpoints[item.rel] = parser.href;
                }.bind(this));
            }.bind(this));
        }
    },

    start: function(path, test_types, testharness_settings) {
        this.pause_flag = false;
        this.stop_flag = false;
        this.done_flag = false;
        this.path = path;
        this.test_types = test_types;
        window.testharness_properties = testharness_settings;
        this.manifest_iterator = new ManifestIterator(this.manifest, this.path, this.test_types);
        this.num_tests = null;

        if(this.resultsSessionEndpoint) {
            this.serverResults.open(this.resultsSessionEndpoint);
        } else {
            this.serverResults.close();
        }

        if (this.manifest.data === null) {
            this.start_after_manifest_load = true;
        } else {
            this.do_start();
        }
    },

    do_start: function() {
        if (this.manifest_iterator.count() > 0)
        {
            this.open_test_window();
            this.start_callbacks.forEach(function(callback) {
                callback();
            });
            this.run_next_test();
        }
        else
        {
            var tests = "tests";
            if (this.test_types.length < 3) {
                tests = this.test_types.join(" tests or ") + " tests";
            }
            var message = "No " + tests + " found in '"+this.path+"'.";

            document.querySelector(".path").setCustomValidity(message);

            this.error_callbacks.forEach(function (callback)
            {
                callback(message);
            });
        }
    },

    pause: function() {
        this.pause_flag = true;
        this.test_pause_callbacks.forEach(function(callback) {
            callback(this.current_test);
        }.bind(this));
    },

    unpause: function() {
        this.pause_flag = false;
        this.run_next_test();
    },

    on_result: function(status, message, subtests) {
        clearTimeout(this.timeout);
        this.results.set(this.current_test, status, message, subtests);
        this.result_callbacks.forEach(function (callback) {
            callback(this.current_test, status, message, subtests);
        }.bind(this));
        this.run_next_test();
    },

    on_timeout: function() {
        this.on_result("TIMEOUT", "", []);
    },

    done: function() {
        this.done_flag = true;
        if (this.test_window) {
            if(document.getElementById('iframe').checked) {
                var outputWindow = document.getElementById('outputWindow');
                outputWindow.parentNode.removeChild(outputWindow);
            } else {
                this.test_window.close();
            }
        }
        this.done_callbacks.forEach(function(callback) {
            callback();
        });
    },

    run_next_test: function() {
        if (this.pause_flag) {
            return;
        }
        var next_test = this.manifest_iterator.next();
        if (next_test === null||this.done_flag) {
            this.done();
            return;
        }

        this.current_test = next_test;

        if (next_test.type === "testharness") {
            this.timeout = setTimeout(this.on_timeout.bind(this),
                                      this.test_timeout * window.testharness_properties.timeout_multiplier);
        }
        this.test_div.textContent = this.current_test.url;
        this.load(this.current_test.url);

        this.test_start_callbacks.forEach(function(callback) {
            callback(this.current_test);
        }.bind(this));
    },

    load: function(path) {
        if (this.test_window.location === null) {
            this.open_test_window();
        }
        this.test_window.location.href = this.server + path;
    },

    progress: function() {
        return this.results.count() / this.test_count();
    },

    test_count: function() {
        if (this.num_tests === null) {
            this.num_tests = this.manifest_iterator.count();
        }
        return this.num_tests;
    },

    create_new_session: function ()
    {
        ajax(this.endpoints.results, "POST", "",
        function (e) // onComplete
        {
            if (e.session)
            {
                this.remote_unsubscribe();
                document.getElementById("sessionId").innerHTML = e.session.id;
                this.remote_subscribe();

                var parser = document.createElement('a');
                parser.href = this.endpoints.results;
                parser.pathname = e.session.href;
                this.resultsSessionEndpoint = parser.href;
            }
        }.bind(this),
        function () // onError
        {
        }.bind(this));
    },

    remote_connect: function ()
    {
        if (null != this.serverEvent) {
            this.remote_disconnect();
        }

        var parser = document.createElement('a');
        parser.href = this.config.test_tool_endpoint;
        this.serverEvent = new SimpleWamp('ws://' + parser.hostname + ':9001', function () {
            this.remote_subscribe();
        }.bind(this));
    },

    remote_disconnect: function ()
    {
        this.remote_unsubscribe();
        this.serverEvent = null;
    },

    remote_subscribe: function ()
    {
        if (null != this.serverEvent) {
            this.serverEvent.subscribe(this.topic + document.getElementById("sessionId").innerHTML, function (event) {
                console.log(event);
            }.bind(this));
        } else {
            this.remote_connect();
        }
    },

    remote_unsubscribe: function ()
    {
        if (null != this.serverEvent) {
            this.serverEvent.unsubscribe(this.topic + document.getElementById("sessionId").innerHTML);
        }
    }
};


function parseOptions() {
    var options = {
        test_types: ["testharness", "reftest", "manual"]
    };

    var optionstrings = location.search.substring(1).split("&");
    for (var i = 0, il = optionstrings.length; i < il; ++i) {
        var opt = optionstrings[i];
        //TODO: fix this for complex-valued options
        options[opt.substring(0, opt.indexOf("="))] =
            opt.substring(opt.indexOf("=") + 1);
    }
    return options;
}

function setup() {
    var options = parseOptions();

    if (options.path) {
        document.getElementById('path').value = options.path;
    }
    if (options.testharness) {
        document.getElementById('th').checked = true;
    }
    if (options.reftest) {
        document.getElementById('ref').checked = true;
    }
    if (options.manual) {
        document.getElementById('man').checked = true;
    }
    if (options.iframe) {
        document.getElementById('iframe').checked = true;
    }

    runner = new Runner("/MANIFEST.json", options);
    var test_control = new TestControl(document.getElementById("testControl"), runner);
    new ManualUI(document.getElementById("manualUI"), runner);
    new VisualOutput(document.getElementById("output"), runner);
    new TopLevelTestList(document.getElementById("path"), document.getElementById("pathSelector"));
    if (window.RunnerSimple) {
        new RunnerSimple(runner);
    }

    if (options.autorun === "1")
    {
        // Hide the instructions and controls
        document.getElementById('instructions').style.display = "none";
        document.getElementById('testSelection').style.display = "none";

        runner.start(test_control.get_path(),
                     test_control.get_test_types(),
                     test_control.get_testharness_settings());
        return;
    }
}

window.completion_callback = function(tests, status) {
    var harness_status_map = {0:"OK", 1:"ERROR", 2:"TIMEOUT"};
    var subtest_status_map = {0:"PASS", 1:"FAIL", 2:"TIMEOUT", 3:"NOTRUN"};

    // this ugly hack is because IE really insists on holding on to the objects it creates in
    // other windows, and on losing track of them when the window gets closed
    var subtest_results = JSON.parse(JSON.stringify(
        tests.map(function (test) {
            return {name: test.name,
                    status: subtest_status_map[test.status],
                    message: test.message};
        })
    ));

    runner.on_result(harness_status_map[status.status],
                     status.message,
                     subtest_results);
};

window.addEventListener("load", setup, false);
})();
