/**
 * Created by hesk on 16年10月20日.
 */
var YouTube = require('youtube-node');
var dl = require('youtube-dl');
var path = require('path');
var _ = require('lodash');
var async = require('async');
var api = "AIzaSyCG_xyQEnd6NsBRvunrjpqiBrWPBQfx0PU";
var playlistid = "PLr2mLhT8gDUK-pMnT4tJKRwUn2FxNNhAU";
var playlist = "https://www.googleapis.com/youtube/v3/playlists";
const __parentDir = path.dirname(module.main);
const show_debug_list = false;
var dlworker = function () {
  this._staticYT = new YouTube();
  this._staticYT.setKey(api);
  this.NextToken = "";
  this.totalResult = 0;
  this.itemPerPage = 0;
};
dlworker.prototype.updateInfo = function (item) {
  if (show_debug_list) {
    console.log("> item", "================================");
    console.log("> item", "============ page Info =========");
    console.log("> item", "================================");
    console.log(JSON.stringify(item, null, 2));
    console.log("> item", "================================");
  }
};
dlworker.prototype.nextPage = function () {
  this._staticYT.addParam("pageToken", this.NextToken);
  console.log("> item", ">>>>>>>>> next page Info >>>>>>>>>>>");
  this.initList();
};
dlworker.prototype.initList = function () {
  // console.log(api);
  // youTube.addParam('order', 'title');
  this._staticYT.getPlayListsItemsById(playlistid, function (error, result) {
    if (_.isError(error)) {
      console.log("> item", "Error..", error);
    } else {
      var nextPage = result.nextPageToken;
      this.NextToken = nextPage;
      this.totalResult = result.pageInfo.totalResults;
      this.itemPerPage = result.pageInfo.resultsPerPage;
      async.forEachOf(result.items, function (val, key, callback) {
        this.updateInfo(val);
        console.log(key);
        if (key == this.itemPerPage - 1) {
          if (!_.isUndefined(this.NextToken)) {
            this.nextPage();
          } else {
            console.log("> item", "Scan for this playlist complete..");
          }
        }
      }.bind(this), function (err) {
        if (_.isError(err)) {
          console.error(err.message);
        }
      });
    }
  }.bind(this));

};
module.exports = {
  listitems: function () {
    var dm = new dlworker();
    dm.initList();
  },
  listp: function () {

  }
};