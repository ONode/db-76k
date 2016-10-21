// Copyright IBM Corp. 2014. All Rights Reserved.
// Node module: loopback-getting-started-intermediate
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT
const
  _YouTube = require("../../common/logic/youTubebi.js"),
  clearall = require("../../common/logic/clearallfolders"),
  pymanifest = require("../../common/logic/pympdmanifest"),
  _ = require("lodash"),
  express = require("express"),
  timeout = require("req-timeout"),
  request = require("request")
  ;

module.exports = function (app) {
  // Install a "/ping" route that returns "pong"
  app.get("/ping", function (req, res) {
    res.send("pong");
  });
  console.log("> created /ping request router");
  app.get("/youtest/", function (req, res) {
    _YouTube.listitems();
    return res.json({done: true});
  });

  app.get("/testLocalLoop/", function (req, res) {
    var Video_tuba_Meta = app.models.Videotuba;
    _YouTube.listLoopLocal(Video_tuba_Meta);
    return res.json({done: true});
  });

  console.log("> remove all uploaded tmp files with http://{domain}/removeallxxx");
  //UwInFiAtfl0
  app.use("/testPy/", function (req, res) {
    var p = new pymanifest();
    var id_mm = "z6t6AZJtrxQ";
    var id_m = "UwInFiAtfl0";
    p.extFormatsV3(function (dat) {
      return res.json(dat);
    });
  });
};
/*
 app.get("/api/config/", function (req, res) {
 var production = "https://cdn.rawgit.com/GDxU/gallerygo/master/configurations.json";
 var development = "https://rawgit.com/GDxU/gallerygo/master/configurations.json";
 request({url: development, json: true}, function (error, response, configuration_body) {
 if (_.isError(error)) {
 res.json({});
 return;
 }
 res.json(configuration_body);
 });
 });
 console.log("> created /sbupload request router");
 app.use("/static", express.static(__parentDir + "/storage/tmp/"));
 console.log("> server static file path is created and started from http://{domain}/static");
 app.use("/removeallxxx", function (req, res) {
 var Basemap_model = app.models.Basemap;
 clearall(Basemap_model, req, res);
 });
 app.use("/first_install", function (req, res) {
 var Basemap_model = app.models.Basemap;
 clearall(Basemap_model, req, res);
 });*/
