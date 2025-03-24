import express from "express";
import { handler } from "./index.js";

const app = express();
app.use( express.text({ type: 'application/json' }) );

const ONE_MINUTE_MILLIS = 1000 * 60;

app.use(function(req, res, next) {      
    console.log( 'Req.url', req.url, req.body, req.query );

    let event = {
        httpMethod: req.method,
        path: req.path,
        headers: req.headers,
        requestContext: {
            //path: req.url.split('?')[0]
        },
        //body: req.body,
        queryStringParameters: req.query,
        isBase64Encoded: false
    };
    let context = {
        endMillis: Date.now() + 2 * ONE_MINUTE_MILLIS - 30000,  // for testing, timeout after 1.5 minutes
        getRemainingTimeInMillis: function() {
            let timeRemaining = this.endMillis - Date.now();
            return timeRemaining;
        },
        succeed: function(response) {
            console.log( 'succeeded!', response );
        }
    };
    console.log("**\r\n** PROCESSING REQUEST\r\n**", new Date() );
    handler( event, context, (err,response) => {
        if(err) {
            console.error(err);
            return;
        }
        
        res.status(response.statusCode);
        if( response.headers ) {
            Object.keys(response.headers).forEach(function(name){
                let value = response.headers[name];
                res.setHeader(name,value);
            });
        }
        console.log( 'Finished at', new Date() );
        res.send( response.body );
    });
});

const port = process.env.PORT || 3001;
let server = app.listen(port);
server.timeout = 5 * ONE_MINUTE_MILLIS; // five minute request timeout (same as lambda)
console.log(`Test running lambda function on port ${port}`);