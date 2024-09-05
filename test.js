const bodyParser= require("body-parser")
const express = require("express")
const dialogflow = require("dialogflow")
const { WebhookClient } = require('dialogflow-fulfillment')

const app = express().use(bodyParser.json())
const port = process.env.PORT || 3005



app.post("/webhook", (request , response) => {
    const _agent=new WebhookClient({request: request , response : response});
    function Welcome(agent) {
      return agent.add("welcome to my agent from js");
    }
    let intents = new Map()
    
    intents.set("Default Welcome Intent", Welcome) ; 
    _agent.handleRequest(intents)
  
  })
  app.get('/', (req, res) => {
    res.send('HELLO WORLD')
  })
