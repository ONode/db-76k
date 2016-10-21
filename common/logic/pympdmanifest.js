/**
 * Created by hesk on 2016/9/26.
 */
var shell = require('shelljs');
const PythonShell = require('python-shell');
const path = require('path');
const _ = require('lodash');
const fs = require('fs');
const cmdline = "curl $(youtube-dl https://www.youtube.com/watch?v=iVAgTiBrrDA --youtube-include-dash-manifest --dump-intermediate-pages -s | grep manifest.google | cut -d ' ' -f 5)";
function jExtractFormat(video_id_yt) {
  var t = "youtube-dl -j ";
  t += video_id_yt;
  t += " | jq '.formats'";
  //console.log("> print cmd:: ", t);
  return t;
}
function jExtractFormatV2(video_id) {
  var blist = [];
  blist.push("-j");
  blist.push(video_id);
  blist.push("|");
  blist.push("jq");
  blist.push("'.formats'");
  console.log("> list", blist);
  return blist;
}
function jOutAll(video_id_yt) {
  var t = "youtube-dl -j ";
  t += video_id_yt;
  return t;
}
function pdmExtract() {
  /* if (!shell.which('curl')) {
   shell.echo('Sorry, this script requires curl');
   shell.exit(1);
   }

   if (!shell.which('youtube-dl')) {
   shell.echo('Sorry, this script requires youtube-dl');
   shell.exit(1);
   }*/
}
pdmExtract.prototype.extFormatsV2 = function (video_id, callback) {
  var container = "";
  const spawn = require('child_process').spawn;
  const dl = spawn("youtube-dl", ['-j', '--', video_id]);
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
  const spawn = require('child_process').spawn;
  const dl = spawn("youtube-dl", ['-j', '--', video_id]);
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
pdmExtract.prototype.extFormatsV1 = function (video_id, callback) {
  var container = "";
  const spawn = require('child_process').spawn;
  const dl = spawn("youtube-dl", ['-j', '--', video_id]);
  const jq = spawn("jq", ["'.formats'"]);
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

function isValidJson(json) {
  try {
    JSON.parse(json);
    return true;
  } catch (e) {
    return false;
  }
}

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
}

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