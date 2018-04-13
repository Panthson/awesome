var path = require('path');
var fs = require('fs');
var server = require("http").createServer(serverRequestHandler);

function serverRequestHandler(request, response){
	//needs to respond to server requests now, like get uers
	if(request.method === 'GET'){
    	serveFile(request, response);
 		return;
	}
}


const PUBLIC_LOCATION = path.resolve('.');

function serveFile(request, response){
	var url = request.url;
	if(request.url === '/'){
		url = '/index.html';
	}

	var questionIndex = url.indexOf("?");
	if(questionIndex !== -1)
		url = url.substring(0, questionIndex);

    var extname = path.extname(url);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
    }

    new Promise((resolve, reject) => {
    	fs.realpath(PUBLIC_LOCATION + url, function(error, resolvedPath){
    		if(error || !resolvedPath)
    			reject('not found');
    		else if(!resolvedPath.toString().startsWith(PUBLIC_LOCATION)){
    			reject('not found');
    		}else{
    			resolve(resolvedPath);
    		}
    	});
    }).then(resolvedPath => {
    	return new Promise((resolve, reject) => {
    		fs.readFile(resolvedPath, function(error, content) {
		        if (error) {
		            if(error.code == 'ENOENT'){
		                reject('not found');
		            }
		            else {
		            	console.log(error);
					    response.writeHead(500);
					    response.end('Sorry, check with the site admin for error: '+error+' ..\n');
					    response.end(); 
					    resolve();
		            }
		        }
		        else {
		            response.writeHead(200, { 'Content-Type': contentType });
		            response.end(content, 'utf-8');
		            resolve();
		        }
		    });
    	})
    }).catch(err => {
    	if(err === 'not found'){
    		response.writeHead(404, { 'Content-Type': contentType });
            response.end('', 'utf-8');
    	}else{
    		console.log(err);
    		response.writeHead(500);
   			response.end('Sorry, check with the site admin for error: '+err+' ..\n');
    		response.end(); 
    	}
    });

    
}


server.listen(7777);