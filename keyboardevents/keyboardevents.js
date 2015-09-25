
var testKeyKeydownKeyup = function (keyName) 
{
  //var keyAttribute = "keyIdentifier";
  var keyAttribute = "key";

  var writeMessage = function (target, message)
  {
    var elem = document.getElementById(target);
    if (!elem) {
      alert("Unable to find element with id == '"+target+"'");
    }
    elem.innerHTML = message;
  };

  var appendMessage = function (target, message)
  {
    var elem = document.getElementById(target);
    if (!elem) {
      alert("Unable to find element with id == '"+target+"'");
    }
    elem.innerHTML = elem.innerHTML + message;
  };

  var initializeTest = function ()
  {
    // Initialize the test
    var INIT_TIMEOUT = 10000;
    var QUIET_INTERVAL = 2000;
    var elapsedTime = 0;
    var keyPressed = false;
    
    // Used to check for any keyboard activity 
    var quietListener = function () {
      keyPressed = true;
    };
    
    var startListener = function ()
    {
      window.addEventListener("keydown", quietListener, false);
    };

    var stopListener = function ()
    {
      window.clearTimeout(initTimer);
      window.removeEventListener("keydown", quietListener);
    };
    
    startListener();
    
    var initTimer = setInterval(
      function ()
      {
        // Check if there have been any key events since the last call
        if (keyPressed) {
          elapsedTime += QUIET_INTERVAL;
          keyPressed = false;
      
          if (elapsedTime >= INIT_TIMEOUT) {
            // The test could not initialize
            stopListener();
        
            test.step(function() {
              assert_unreached("Unable to initialize test. "+
                               "Initialization requires "+QUIET_INTERVAL+"ms without "+
                               "receiving keyboard events");
            });
            test.done();
          }
          return;
        }

        // No key events, so the test is initialized
        stopListener();
        keyTest();
      },
      QUIET_INTERVAL);
  };


  var keyTest = function ()
  {
    var KEY_INTERVAL = 1000;
    var KEY_TIMEOUT = 30000;
    var keyPressCount = 0;
    var KEY_INIT = 1;
    var KEY_DOWN_RECEIVED = 2;
    var KEY_UP_RECEIVED = 3;
    var keyState = KEY_INIT;
    var keyCount = 0;
    var keyPressed = false;
    var elapsedTime = 0;
    
    // Checks keydown events 
    var keyDownListener = function (keyEvent) {
      switch (keyState) {
    
      case KEY_INIT: // The expected value
        keyState = KEY_DOWN_RECEIVED;
        writeMessage("testlog",
                     "Received expected keydown event");

        if (keyEvent[keyAttribute] == keyName) {
          appendMessage("testlog",
                        "<br>Received expected key: '"+keyEvent[keyAttribute]+"'");
        } else {
          appendMessage("testlog",
                        "<br><b>ERROR keyDownListener:</b> "+
                        "Received unexpected key: '"+keyEvent[keyAttribute]+"'");
        }

        test.step(function() {
          assert_equals(keyEvent[keyAttribute], keyName, "keyDownListener: keyEvent.key");
        });
        test.done();
        break;

      case KEY_DOWN_RECEIVED: 
        appendMessage("testlog",
                      "<br><b>ERROR keyDownListener:</b> "+
                      "Received unexpected keydown event");
        test.step(function() {
          assert_equals(keyState, KEY_INIT, "keyDownListener: keyState");
        });
        test.done();
        break;

      case KEY_UP_RECEIVED:
        appendMessage("testlog",
                      "<br><b>ERROR keyDownListener:</b> "+
                      "Received unexpected keydown event");
        test.step(function() {
          assert_equals(keyState, KEY_INIT, "keyDownListener: keyState");
        });
        test.done();
        break;
      }
      return false;
    };

    // Checks keyup events 
    var keyUpListener = function () {
      switch (keyState) {
    
      case KEY_INIT:
        writeMessage("testlog",
                     "<b>ERROR keyUpListener</b> "+
                     "Received unexpected keyup event");
        test.step(function() {
            assert_equals(keyState, KEY_DOWN_RECEIVED, "keyUpListener: keyState");
        });
        test.done();
        break;
    
      case KEY_DOWN_RECEIVED: // The expected value
        appendMessage("testlog",
                      "<br>Received expected keyup event");
        keyState = KEY_UP_RECEIVED;
        keyPressed = true;
        break;

      case KEY_UP_RECEIVED:
        appendMessage("testlog",
                      "<br><b>ERROR keyUpListener</b> "+
                      "Received unexpected keyup event");
        test.step(function() {
          assert_equals(keyState, KEY_DOWN_RECEIVED, "keyUpListener: keyState");
        });
        test.done();
        break;
      }

      return false;
    };

    var startListeners = function () {
      window.addEventListener("keydown", keyDownListener, false);
      window.addEventListener("keyup", keyUpListener, false);
    };

    var stopListeners = function () {
      window.clearTimeout(keyTimer);
      window.removeEventListener("keydown", keyDownListener);
      window.removeEventListener("keyup", keyUpListener);
    };

    // Start the key test
    startListeners();
    writeMessage("instructions",
                 "Press and Release the <b>'"+keyName+"'</b> key one time."+
                 "<br><b>Do not</b> include any modifiers (shift/caps lock/etc)");
    writeMessage("testlog",
                 "Waiting for test key to be pressed...");

    // Make sure the document has the focus so we get the key presses
    window.focus();

    var keyTimer = setInterval(
      function ()
      {
        // Check if we've timed out
        elapsedTime += KEY_INTERVAL;
        if (elapsedTime >= KEY_TIMEOUT) {
          // The key was never pressed
          stopListeners();
          appendMessage("testlog",
                        "<br><b>ERROR keyTimer: </b> "+
                        "No key events were received.");
          test.step(function() {
            assert_greater_than(keyPressCount, 0, "keyTimer: keyPressCount");
          });
          test.done();
          return;
        }

        // See if the key was pressed
        if (!keyPressed) {
          return;
        }
    
        // Check if the key has been pressed for a while
        keyPressCount++;
        if (keyPressCount > 1) {
          stopListeners();
          return;
        }
      },
      KEY_INTERVAL);  
  };


  var test = async_test("KeyboardEvents: key == "+keyName);

  initializeTest();

};
