const hapi = require("@hapi/hapi");
let express = require("express");
const AuthBearer = require("hapi-auth-bearer-token");
let fs = require("fs");
let cors = require("cors");

const OnlineAgent = require("./repository/OnlineAgent");

//-------------------------------------

//process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const apiport = 8443;

var url = require("url");

//init Express
var app = express();
//init Express Router
var router = express.Router();
//var port = process.env.PORT || 87;

//REST route for GET /status
router.get("/status", function (req, res) {
  res.json({
    status: "App is running!",
  });
});

//connect path to router
app.use("/", router);

//----------------------------------------------

const init = async () => {
  //process.setMaxListeners(0);
  require("events").defaultMaxListeners = 0;
  process.setMaxListeners(0);

  var fs = require("fs");

  var tls = {
    key: fs.readFileSync("server.key"),
    cert: fs.readFileSync("server.crt"),
  };

  //const server = Hapi.Server({
  const server = hapi.Server({
    port: apiport,
    host: "0.0.0.0",
    tls: tls,
    //routes: {
    //    cors: true
    //}
    routes: {
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
  });

  await server.register(require("@hapi/inert"));

  await server.register(AuthBearer);

  server.auth.strategy("simple", "bearer-access-token", {
    allowQueryToken: true, // optional, false by default
    validate: async (request, token, h) => {
      // here is where you validate your token
      // comparing with token from your database for example
      const isValid =
        token ===
        "1aaZ!ARgAQGuQzp00D5D000000.mOv2jmhXkfIsjgywpCIh7.HZpc6vED1LCbc90DTaVDJwdNqbTW5r4uZicv8AFfkOE1ialqnR8UN5.wnAgh090h";

      const credentials = { token };
      const artifacts = { test: "info" };

      return { isValid, credentials, artifacts };
    },
  });

  server.auth.default("simple");

  //-- Route ------

  server.route({
    method: "GET",
    path: "/",
    config: {
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
    handler: async (request, h) => {
      try {
        //console.log('CORS request.info:');
        //console.log(request.info.cors);
        return "Test Hello, from Endpoint Web Report API.";
      } catch (err) {
        console.dir(err);
      }
    },
  });

  //-------- Your Code continue here -------------------

  server.route({
    method: "GET",
    path: "/api/v1/getOnlineAgentByAgentCode",
    config: {
      cors: {
        origin: ["*"],
        headers: [
          "Access-Control-Allow-Headers",
          "Access-Control-Allow-Origin",
          "Accept",
          "Authorization",
          "Content-Type",
          "If-None-Match",
          "Accept-language",
        ],
        additionalHeaders: [
          "Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization",
        ],
        credentials: true,
      },
    },
    handler: async (request, res) => {
      let param = request.query;

      try {
        console.dir(param);
        //return ('API1');

        if (param.agentcode == null)
          return res.response("Please provide agentcode.").code(400);
        else {
          const responsedata =
            await OnlineAgent.OnlineAgentRepo.getOnlineAgentByAgentCode(
              `${param.agentcode}`
            );

          if (responsedata.statusCode == 500)
            return res
              .response("Something went wrong. Please try again later.")
              .code(500);
          else if (responsedata.statusCode == 200) return responsedata;
          else if (responsedata.statusCode == 404)
            return res.response(responsedata).code(404);
          else
            return res
              .response("Something went wrong. Please try again later.")
              .code(500);
        }
      } catch (err) {
        console.dir(err);
      }
    },
  });

  server.route({
    method: "POST",
    path: "/api/v1/postOnlineAgentStatus",
    config: {
        cors: {
            origin: [
                '*'
            ],
            headers: ["Access-Control-Allow-Headers", "Access-Control-Allow-Origin", "Accept", "Authorization", "Content-Type", "If-None-Match", "Accept-language"],
            additionalHeaders: ["Access-Control-Allow-Headers: Origin, Content-Type, x-ms-request-id , Authorization"],
            credentials: true
        },
        payload: {
            parse: true,
            allow: ['application/json', 'multipart/form-data'],
            multipart: true  // <== this is important in hapi 19
        }
    },
    handler: async (request, res) => {
      const { payload } = request;

      try {
        //console.dir(payload);
        console.log(payload.AgentCode);
        console.log(payload.AgentName);
        console.log(payload.IsLogin);
        console.log(payload.AgentStatus);

        if (payload.AgentCode == null)
          return res.response("Please provide agentcode.").code(400);
        else {

        const responsedata =
        await OnlineAgent.OnlineAgentRepo.postOnlineAgentStatus(payload.AgentCode, payload.AgentName, payload.IsLogin, payload.AgentStatus);

          if (responsedata.statusCode == 500)
            return res
              .response("Something went wrong. Please try again later.")
              .code(500);
          else if (responsedata.statusCode == 200) return responsedata;
          else if (responsedata.statusCode == 404)
            return res.response(responsedata).code(404);
          else
            return res
              .response("Something went wrong. Please try again later.")
              .code(500);
        }



      } catch (err) {
        console.dir(err);
      }
    },
  });

  //----------------------------------------------

  await server.start();
  console.log("Webreport API Server running on %s", server.info.uri);
};

process.on("unhandledRejection", (err) => {
  console.log(err);
  process.exit(1);
});

init();
