var mysql      = require('mysql');
var http 	   = require('http');
var request	   = require('request');

//This is the one we will pull
var birdName = "Chestnut sparrow";
console.log("loaded");
//Do first request
request("https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions|images&titles=" + birdName + "&rvprop=parsetree", function(error, response, body){
	parse(body);

});

//Helper function to parse out all that
function parse(body){
	var model={name:"", desc:"", imageUrl:"", imageCap:"", status:"", sciName:"", behavior:"", rangeUrl:"", };
	var raw = body;
	var query = "INSERT INTO `information`(`birdName`,`description`,`scientificName`,`behavior`,`conservation`) VALUES (";
	
	//Name
	model.name = raw.replace(/[^]+?title":"/,"");
	model.name = model.name.replace(/\",\"revisions\".+/,"");
	query = query + ("\"" + model.name + "\", ");
	
	//Trim raw for speed and neatness
	raw = raw.replace(/[^]+?<root>/,"");//Trim front end of query
	raw = raw.replace(/\\n/g,"");//Trim out newline characters
	raw = raw.replace(/<ext>[^]+?<\/ext>/g,"");//Trim out citations
	
	//Desc
	model.desc = desc(raw);
	query = query + ("\"" + model.desc + "\", ");

	//Scientific name
	model.sciName = raw.substring(raw.indexOf("binomial")+44,raw.indexOf("<\/value>",raw.indexOf("binomial"))-2);
	query = query + ("\"" + model.sciName + "\", ");

	//Behavior
	if(raw.search(/==Behaviou?r==/) > -1){//If behavior section exists
		model.behavior = behavior(raw);
		query = query + ("\"" + model.behavior + "\", ");
	}else{
		query = query + ("NULL, ");
	}
	
	//Conservation status
	model.status = conStatus(raw);
	query = query + ("\"" + model.status + "\")");

	//Image URL
	model.imageUrl = raw.replace(/.+?image.+?<value>/,"");//Get file name
	model.imageUrl = model.imageUrl.replace(/<\/value>.+/,"");//Get file name
	model.imageUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=Image:" + encodeURIComponent(model.imageUrl) + "&prop=imageinfo&iiprop=url";

	//Image caption
	if(raw.search(/image_alt/) > -1){
		model.imageCap = raw.substring(raw.indexOf("image_alt")+42,raw.indexOf("<\/value>",raw.indexOf("image_alt")));
	}
	
	//Territory
	model.rangeUrl = raw.replace(/.+?range_map.+?<value>/,"");//Get file name
	model.rangeUrl = model.rangeUrl.replace(/<\/value>.+/,"");//Get file name
	model.rangeUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=Image:" + encodeURIComponent(model.rangeUrl) + "&prop=imageinfo&iiprop=url";
	
	
	//Send to database
	var connection = mysql.createConnection({
	  host     : 'featherprint.cvzffvtv4h1p.us-east-1.rds.amazonaws.com',
	  user     : 'MLBB',
	  password : 'G1tR3kt123',
	  database : 'FeatherPrint'
	});

	connection.connect();

	//INSERT
	connection.query(query, function(err, result) {
		if (err){
			console.log("Failed to add information entry");
		}else{
			console.log('ROWS AFFECTED: ' + result.affectedRows);
		}
	});
	
	//SELECT
	//TODO Comment these selects out for speed
	connection.query("SELECT * FROM information", function(err, result) {
		if (err){
			throw err;
		}else{
			for(var i = 0; i < result.length; i++){
				console.log(result[i]);
			}
		}
	});
	
	
	//Main image
	imageUrl(model.imageUrl, model);
	
	//Range
	rangeUrl(model.rangeUrl, model);
	
	//SELECT
	connection.query("SELECT * FROM images", function(err, result) {
		if (err){
			throw err;
		}else{
			for(var i = 0; i < result.length; i++){
				console.log(result[i]);
			}
		}
	});
	
	connection.end();
}

function imageUrl(api, model){
	request(api, (function(model) { 
        var model = model;
        return function(error, response, body){
			var url = body.replace(/[^]+?;url[^]+?https/,"https");
			url = url.replace(/\&[^]+/,"");
			
			var connection = mysql.createConnection({
			  host     : 'featherprint.cvzffvtv4h1p.us-east-1.rds.amazonaws.com',
			  user     : 'MLBB',
			  password : 'G1tR3kt123',
			  database : 'FeatherPrint'
			});
			
			connection.connect();
			var query = "INSERT INTO `images`(`image`,`birdId`,`isTerritoryImage`,`caption`) VALUES (\"" + url + "\", (SELECT id FROM information WHERE birdName = \"" + model.name + "\"), 0, \"" + model.imageCap + "\")";
			
			//INSERT
			connection.query(query, function(err, result) {
				if (err){
					console.log("Failed to add image entry");
				}else{
					console.log('ROWS AFFECTED: ' + result.affectedRows);
				}
			});
			connection.end();
		}
	})(model));
}

function rangeUrl(api, model){
	request(api, (function(model) { 
        var model = model;
        return function(error, response, body){
			var url = body.replace(/[^]+?;url[^]+?https/,"https");
			url = url.replace(/\&[^]+/,"");
			
			var connection = mysql.createConnection({
			  host     : 'featherprint.cvzffvtv4h1p.us-east-1.rds.amazonaws.com',
			  user     : 'MLBB',
			  password : 'G1tR3kt123',
			  database : 'FeatherPrint'
			});
			
			connection.connect();
			
			var query = "INSERT INTO `images`(`image`,`birdId`,`isTerritoryImage`,`caption`) VALUES (\"" + url + "\", (SELECT id FROM information WHERE birdName = \"" + model.name + "\"), 1, NULL)";

			//INSERT
			connection.query(query, function(err, result) {
				if (err){
					console.log("Failed to add rangeImage entry");
				}else{
					console.log('ROWS AFFECTED: ' + result.affectedRows);
				}
			});
			connection.end();
		}
	})(model));
}

function desc(raw){
	var desc = raw.replace(/==.+/,"");//Trim rear end of query '==' Preceeds the first heading
	desc = desc.replace(/<template.*?>[^]+?<\/template>/g,"");//Clean out templates
	desc = desc.replace(/<.+?>/g,"");//Trim out HTML stuff
	
	//	Now to clean out Wikipedia links
	//	Wikipedia allows a linked page to display different text. In these cases, delete the part of the link that is the actual page name
	//	Example: [[page|Displayed text]] looks like "Displayed text" and links to 'page'
	desc = desc.replace(/\[\[[^\]]+?\|/g,"");
	desc = desc.replace(/\[\[/g,"");//Delete all beginning link bounds
	desc = desc.replace(/\]\]/g,"");//Delete all ending link bounds
	return desc;
}

function conStatus(raw){
	var conStatus = raw.substring(raw.indexOf("status")+40, raw.indexOf("status")+42);
	if(conStatus == "EX"){
		conStatus = "Extinct (EX). No know individuals remaining";
	}else if(conStatus == "EW"){
		conStatus = "Extinct in the wild (EW). Known only to survive in captivity";
	}else if(conStatus == "CR"){
		conStatus = "Critically endangered (CR). Extremely high risk of extinction";
	}else if(conStatus == "EN"){
		conStatus = "Endangered (EN). High risk of extinction";
	}else if(conStatus == "VU"){
		conStatus = "Vulnerable (VU). High risk of endangerment in wild";
	}else if(conStatus == "NT"){
		conStatus = "Near threatened (NT). Likely to become endangered in near future";
	}else if(conStatus == "LC"){
		conStatus = "Least concern (LC). Lowest risk";
	}else if(conStatus == "DD"){
		conStatus = "Extinct (DD). Not enough data to make assessment";
	}else if(conStatus == "NE"){
		conStatus = "Not evaluated (NE). Has not yet been evaluated against criteria";
	}else{
		conStatus = null;
	}
	
	return conStatus;
}

function behavior(raw){
		var behavior = raw.replace(/[^]+==Behaviou?r==/,"");//Trim up to behavior
		behavior = behavior.replace(/==[^]+/,"");//Trim any following headings
		behavior = behavior.replace(/<.+?>/g,"");//Trim out HTML stuff	
	
		//	Now to clean out Wikipedia links
		//	Wikipedia allows a linked page to display different text. In these cases, delete the part of the link that is the actual page name
		//	Example: [[page|Displayed text]] looks like "Displayed text" and links to 'page'
		behavior = behavior.replace(/\[\[[^\]]+?\|/g,"");
		behavior = behavior.replace(/\[\[/g,"");//Delete all beginning link bounds
		behavior = behavior.replace(/\]\]/g,"");//Delete all ending link bounds
		
		//If this was formatted with no upper-level behavior blurb, then the selection is empty space. Check for it
		if(behavior.search(/\W/) == -1){
			behavior = null;
		}
		return behavior;
}