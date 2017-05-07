/*
User Story: I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.

User Story: If I pass an invalid URL that doesn't follow the valid http://www.example.com format, the JSON response will contain an error instead.

User Story: When I visit that shortened URL, it will redirect me to my original link.



FreeCodeCamp API Basejump: URL Shortener Microservice
User stories:
I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.
When I visit that shortened URL, it will redirect me to my original link.
Example creation usage:
https://little-url.herokuapp.com/new/https://www.google.com
https://little-url.herokuapp.com/new/http://foo.com:80
Example creation output
{ "original_url":"http://foo.com:80", "short_url":"https://little-url.herokuapp.com/8170" }
Usage:
https://little-url.herokuapp.com/2871
Will redirect to:
https://www.google.com/


//url path > new/site
https://little-url.herokuapp.com/new/https://www.google.com
{"original_url":"https://www.google.com","short_url":"https://little-url.herokuapp.com/5576"}
//url path > short url > redirects to th original url
https://little-url.herokuapp.com/5576
*/

//express
var path    = require("path");
var express = require("express");
var app     = express();
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
var config  = require("./config/config.js");

// mongo
var mongo   =   require("mongodb").MongoClient;
var mongoPort       = config.mongoPort;
var mongoDatabase   = config.mongoDatabase;
var mongoCollectionName = config.mongoCollectionName;
console.log(mongoCollectionName);
var mongoUrl =  `mongodb://localhost:${mongoPort}/${mongoDatabase}`;


function addDocument(document){
    mongo.connect(mongoUrl, function(err, db){
        if(err){console.error(err)};
        var collection = db.collection(mongoCollectionName);
        collection.insertOne(document, function(err){
            if(err){console.error(err)}
            collection.findOne(document,
            {},
            function(err, document){
                if(err){console.error(err)};
                //console.log(JSON.stringify(document));
                db.close();            
            })
        });
    })
}

//
function findDocumentByOriginalURL(original_url, callback ){
    mongo.connect(mongoUrl, function(err, db){
        if(err){console.error(err)};
        var collection = db.collection(mongoCollectionName);
        collection.findOne({
            original_url: original_url
        },
        {},
        function(err, foundDocument){
            if(err){console.error(err)};
            callback(foundDocument);
            db.close();            
        })
    });
}

function findDocumentByShortURL(short_url, callback){
    mongo.connect(mongoUrl, function(err, db){
        if(err){console.error(err)};
        var collection = db.collection(mongoCollectionName);
        collection.find({
            short_url: short_url
        }).toArray(
        function(err, documents){
            if(err){console.error(err)};
            callback(documents);
            db.close();
        });
    });
}


function countDocuments(callback){
    mongo.connect(mongoUrl, function(err, db ){
        if(err){console.error(err)};
        var collection = db.collection(mongoCollectionName);
        collection.count({}
        , function(err, count){
            if(err){console.error(err)};
            if(count == null){
                count= 0;
            }

            callback(count);
            db.close();
        });
    });
}



var newUrlPath = "/new/";
app.get( (newUrlPath + "*"), function(req, res){
    var url = req.url.slice(newUrlPath.length);

    if((url.match("http://") ) || (url.match("https://") ) ){
        //var message = url;

        findDocumentByOriginalURL(url, function (foundDocument){
            if(foundDocument != null){
                res.write(  JSON.stringify(foundDocument) );
                res.end();
            }else{
                //Count the documents
                countDocuments(function(count){
                    var newDoc = {
                        original_url: url,
                        short_url: (count +1)
                    };
                    //Add the new document
                    addDocument(newDoc);
                    //show the new document
                    findDocumentByOriginalURL(url, function (foundDocument){
                        if(foundDocument != null){
                            res.write(  JSON.stringify(foundDocument) );
                            res.end();            
                        }else{
                            res.write("Unable to add document");
                            res.end();
                        }
                    });
                });
            }
        });
    }else{
        var message = "invalid url";
        console.error(message);
        res.write(message);
        res.end();
    }

});

var rootUrlPath = "/";
app.get((rootUrlPath), function(req, res){
    res.write(`
FreeCodeCamp API Basejump: URL Shortener Microservice
User stories:
I can pass a URL as a parameter and I will receive a shortened URL in the JSON response.
When I visit that shortened URL, it will redirect me to my original link.
Example creation usage:
https://little-url.herokuapp.com/new/https://www.google.com
https://little-url.herokuapp.com/new/http://foo.com:80
Example creation output
{ "original_url":"http://foo.com:80", "short_url":"https://little-url.herokuapp.com/8170" }
Usage:
https://little-url.herokuapp.com/2871
Will redirect to:
https://www.google.com/


//url path > new/site
https://little-url.herokuapp.com/new/https://www.google.com
{"original_url":"https://www.google.com","short_url":"https://little-url.herokuapp.com/5576"}
//url path > short url > redirects to th original url
https://little-url.herokuapp.com/5576    
    `);
    res.end();
});


var rootUrlPath = "/";
app.get((rootUrlPath + "*"), function(req, res){
    var short_url = Number.parseInt(req.url.slice(rootUrlPath.length)) ;
    //console.log(short_url );
    findDocumentByShortURL(short_url, function(documents){
        if(documents.length > 0){

            app.set('views', path.join(__dirname, 'server/templates' ))
            app.set('view engine', 'jade');
            var original_url= documents[0].original_url;
            res.render('redirect', {redirectUrl: original_url });


        }else{
            console.log("no short url found");
            res.write("no short url found" );
            res.end();
        }
    });
});


app.listen(config.port, function(){
    console.log("listening on port: " + config.port );
});