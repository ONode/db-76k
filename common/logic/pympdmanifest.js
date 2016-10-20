/**
 * Created by hesk on 2016/9/26.
 */
var shell = require('shelljs');
const PythonShell = require('python-shell');
const path = require('path');
const fs = require('fs');
const cmdline = "curl $(youtube-dl https://www.youtube.com/watch?v=iVAgTiBrrDA --youtube-include-dash-manifest --dump-intermediate-pages -s | grep manifest.google | cut -d ' ' -f 5)";
function constructExtract(video_id_yt) {
  var t = "youtube-dl -j ";
  t += video_id_yt;
  t += " | jq '.formats[0].manifest_url'";
  //console.log("> print cmd:: ", t);
  return t;
}
function jsonExplore(video_id_yt) {
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

pdmExtract.prototype.getFormatJson = function (video_id, callback) {
  var child = shell.exec(jsonExplore(video_id), {async: true});
  child.stdout.on('data', function (data) {
    callback(JSON.parse(data));
  });
};
module.exports = pdmExtract;