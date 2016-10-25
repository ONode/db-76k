/**
 * Created by hesk on 2016/9/26.
 */
var shell = require('shelljs');
const PythonShell = require('python-shell');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const cmdline = "curl $(youtube-dl https://www.youtube.com/watch?v=iVAgTiBrrDA --youtube-include-dash-manifest --dump-intermediate-pages -s | grep manifest.google | cut -d ' ' -f 5)";
function jOutAll(video_id_yt) {
  var t = "youtube-dl -j ";
  t += video_id_yt;
  return t;
}
function cliVideoChannelGetIds(channel_id) {
  var cmd = [];
  cmd.push(channel_id);
  cmd.push("--get-id");
  console.log("> cmd", cmd);
  return cmd;
}
function cliVideoFormat(videoid) {
  var cmd = [];
  cmd.push("--no-cache-dir");
  cmd.push("-j");
  cmd.push("--");
  cmd.push(videoid);
  console.log("> cmd", cmd);
  return cmd;
}
function isValidJson(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}
function pdmExtract() {
  const spawnProc = require('child_process').spawn;
  this.spawnprocess = spawnProc;
  this.list_ids = [];
}
pdmExtract.prototype.fire = function (cmd_array) {
  return this.spawnprocess("youtube-dl", cmd_array);
};
pdmExtract.prototype.extFullArchive = function (video_id, callback) {
  var container = "";
  const dl = this.fire(cliVideoFormat(video_id));
  dl.stdout.on('data', function (data) {
    container += data;
  });
  dl.stderr.on('data', function (data) {
    console.log('youtube-d stderr: ' + data);
  });
  dl.on('close', function (code) {
    if (code !== 0) {
      console.log('youtube-dl has an exit code: ' + code);
    } else {
      var out = JSON.parse(container);
      callback(out);
    }
  });
};
pdmExtract.prototype.extFormatsV2 = function (video_id, callback) {
  var container = "";
  const dl = this.fire(cliVideoFormat(video_id));
  dl.stdout.on('data', function (data) {
    container += data;
  });
  dl.stderr.on('data', function (data) {
    console.log('youtube-d stderr: ' + data);
  });
  dl.on('close', function (code) {
    if (code !== 0) {
      console.log('youtube-dl has an exit code: ' + code);
    } else {
      var out = JSON.parse(container);
      if (out.hasOwnProperty("formats")) {
        var outlist = out.formats;
        var is_array = _.isArray(outlist);
        console.log(". is array", is_array);
        callback(outlist);
      } else {
        console.log('jq-out >> === cannot find formats');
      }
    }
  });
};
pdmExtract.prototype.extFormatsV3 = function (callback) {
  var container = "", video_id = "-f7zZt6ad-A";
  const dl = this.fire(['-j', '--', video_id]);
  dl.stdout.on('data', function (data) {
    container += data;
  });
  dl.stderr.on('data', function (data) {
    console.log('youtube-d stderr: ' + data);
  });
  dl.on('close', function (code) {
    if (code !== 0) {
      console.log('youtube-dl has an exit code: ' + code);
    } else {
      var out = JSON.parse(container);
      if (out.hasOwnProperty("formats")) {
        var outlist = out.formats;
        var is_array = _.isArray(outlist);
        console.log(". is array", is_array);
        callback(outlist);
      } else {
        console.log('jq-out >> === cannot find formats');
      }
    }
  });
};
pdmExtract.prototype.harvestChannelContentIds = function (channel_id, callback) {
  const red = this.fire(cliVideoChannelGetIds(channel_id));
  var i = 0;
  red.stdout.on('data', function (buffer) {
    var get_video_id = buffer.toString('utf8');
    console.log('> item: ', i, get_video_id);
    this.list_ids.push(get_video_id);
    i++;
  }.bind(this));
  red.stderr.on('data', function (data) {
    console.log('youtube-d stderr: ' + data);
  });
  red.on('close', function (code) {
    if (code !== 0) {
      console.log('youtube-dl has an exit code: ' + code);
    } else {
      var is_array = _.isArray(this.list_ids);
      console.log("harvested in array", is_array);
      callback(this.list_ids);
    }
  }.bind(this));
};
pdmExtract.prototype.extFormatsV1 = function (video_id, callback) {
  var container = "";
  const dl = this.fire(['-j', '--', video_id]);
  const jq = this.spawnprocess("jq", ["'.formats'"]);
  dl.stdout.on('data', function (data) {
    jq.stdin.write(data);
  });
  dl.stderr.on('data', function (data) {
    console.log('youtube-d stderr: ' + data);
  });
  dl.on('close', function (code) {
    if (code !== 0) {
      console.log('youtube-dl has an exit code: ' + code);
    }
    jq.stdin.end();
  });
  jq.stdout.on('data', function (data) {
    container += data;
  });
  jq.stderr.on('data', function (data) {
    console.log('jq-d stderr: ' + data);
  });
  jq.on('close', function (code) {
    if (code !== 0) {
      console.log('jq has an exit code: ' + code);
    } else {
      console.log('jq-out is out now');
      var out = JSON.parse(container);
      callback(out);
    }
  });
};
/**
 * Delete all null (or undefined) properties from an object.
 * Set 'recurse' to true if you also want to delete properties in nested objects.
 */
function delete_null_properties(test, recurse) {
  for (var i in test) {
    if (test[i] === null) {
      delete test[i];
    } else if (recurse && typeof test[i] === 'object') {
      delete_null_properties(test[i], recurse);
    }
  }
};
function dateReviver(key, value) {
  var a;
  if (typeof value === 'string') {
    a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
    if (a) {
      return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
        +a[5], +a[6]));
    }
  }
  return value;
};
module.exports = pdmExtract;