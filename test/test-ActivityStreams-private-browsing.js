"use strict";

const test = require("sdk/test");
const windows = require("sdk/windows").browserWindows;
const httpd = require("./lib/httpd");
const {doGetFile, getTestActivityStream} = require("./lib/utils");

const PORT = 8199;

exports["test activity stream doesn't load in private windows"] = function*(assert) {
  let path = "/dummy-activitystreams.html";
  let url = `http://localhost:${PORT}${path}`;
  let srv = httpd.startServerAsync(PORT, null, doGetFile("test/resources"));
  let app = getTestActivityStream({pageURL: url});

  // Open a private browsing window to test with.
  let window = yield new Promise(resolve => windows.open({
    url: "about:privatebrowsing",
    isPrivate: true,
    onOpen: window => {
      resolve(window);
    }
  }));

  // Try opening all the app URLs. It should open about:privatebrowsing instead.
  for (let appURL of app.appURLs) {
    yield new Promise(resolve => {
      window.tabs.open({
        url: appURL,
        onReady: tab => {
          // onReady may fire more than once. The important thing is that we end up
          // on about:privatebrowsing at the end.
          if (tab.url === "about:privatebrowsing") {
            tab.close(resolve);
          }
        }
      });
    });
  }

  // Cleanup
  yield new Promise(resolve => window.close(resolve));

  app.unload();
  yield new Promise(resolve => {
    srv.stop(resolve);
  });
};

test.run(exports);
