var express = require('express'),
    app = express(),
    _ = require("underscore"),
    querystring = require("querystring"),
    BizzFuzz = require("bizzfuzz");

var routes = {
  "home": "/",
  "fizzbuzz": "/fizzbuzz"
}

var baseQueryString = ["add", "startsAt", "endsAt", "firstNumber", "secondNumber"];

var cleanQS = function(qs) {
  var cleanedQS = _.pick(qs, baseQueryString);

  // Every value must be an integer
  _.each(_.keys(cleanedQS), function(key) {
    cleanedQS[key] = parseInt(cleanedQS[key]);
  });

  return cleanedQS;
}

var baseRepresentation = function(qs, bizzFuzz) {
  var startNumber = bizzFuzz.startingNumber(),
      lastNumber = bizzFuzz.finalNumber();

  return {
    links: [
      { rel: ["home"], href: routes.home },
      { rel: ["first"], href: buildUrl(startNumber, qs) },
      { rel: ["last"], href: buildUrl(lastNumber, qs) }
    ]
  }
}

var startFizzBuzzAction = function() {
  return {
    name: "custom-fizzbuzz",
    title: "Custom FizzBuzz",
    method: "GET",
    href: routes.fizzbuzz,
    type: "application/x-www-form-urlencoded",
    fields: [
      { name: "add", type: "number", value: "1" },
      { name: "startsAt", type: "number", value: "1" },
      { name: "endsAt", type: "number", value: "100" },
      { name: "firstNumber", type: "number", value: "3" },
      { name: "secondNumber", type: "number", value: "5" },
      { name: "embed", type: "number" }
    ]
  }
}

var getValueAction = function() {
  return {
    name: "get-fizzbuzz-value",
    title: "Get FizzBuzz Value",
    method: "GET",
    href: routes.fizzbuzz,
    type: "application/x-www-form-urlencoded",
    fields: [
      { name: "number", type: "number"}
    ]
  }
}

var buildUrl = function(number, qs) {
  var newQueryString = _.extend({}, qs, { number: number });
  return [routes.fizzbuzz, "?", querystring.stringify(newQueryString)].join("");
}

var embed = function(bizzFuzz, number) {
  var rep = {
    rel: ["next"],
    properties: {
      number: number,
      value: bizzFuzz.valueFor(number)
    }
  };

  if (bizzFuzz.isNextAfter(number)) {
    var nextNumber = bizzFuzz.nextAfter(number);
    rep.entities = [];
    rep.entities.push(embed(bizzFuzz, nextNumber));
  }

  return rep;
}

app.get(routes.home, function(req, res){
  var cleanedQS = cleanQS(req.query),
      bizzFuzz = new BizzFuzz(cleanedQS),
      rep = baseRepresentation(req.query, bizzFuzz);

  rep.actions = [
    startFizzBuzzAction(),
    getValueAction()
  ];

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rep));
});

app.get(routes.fizzbuzz, function(req, res) {
  var cleanedQS = cleanQS(req.query),
      bizzFuzz = new BizzFuzz(cleanedQS),
      rep = baseRepresentation(req.query, bizzFuzz);

  if ("number" in req.query) {
    rep.properties = {};
    rep.properties.number = parseInt(req.query.number);
    rep.properties.value = bizzFuzz.valueFor(rep.properties.number);

    if (bizzFuzz.isNextAfter(rep.properties.number)) {
      var nextNumber = bizzFuzz.nextAfter(rep.properties.number)

      if ("embed" in req.query) {
        rep.entities = [embed(bizzFuzz, nextNumber)]
      } else {
        var link = { rel: ["next"], href: buildUrl(nextNumber, req.query) }
        rep.links.push(link);
      }
    }
  }

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(rep));
});

var port = Number(process.env.PORT || 3000);
app.listen(port, function() {
  console.log("Listening on " + port);
});