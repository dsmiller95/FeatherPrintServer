//Requires

import * as mysql from 'mysql';
import * as http from 'http';
import * as request from 'request';

/*var mysql      = require('mysql');
var http 	   = require('http');
var request	   = require('request');
*/

export class DatabasePopulator{
	constructor(){
		//blah and shit
	}

	public doThePopulate(){

		//This is the one we will pull
		var birdName = "Red-winged blackbird";
		console.log("loaded");
		//Do first request
		request("https://en.wikipedia.org/w/api.php?action=query&format=json&prop=revisions|images&titles=" + birdName + "&rvprop=parsetree", function(error, response, body){
			console.log("oh hi");                             
			parse(body);

		});

		//Helper function to parse out all that
		function parse(body){
			var model={name:"", desc:"", imageUrl:"", imageCap:"", status:"", sciName:"", behavior:"", rangeUrl:"", };
			var raw = body;
			
			//Name
			model.name = raw.replace(/[^]+?title":"/,"");
			model.name = model.name.replace(/\",\"revisions\".+/,"");
			
			//Trim raw for speed and neatness
			raw = raw.replace(/[^]+?<root>/,"");//Trim front end of query
			raw = raw.replace(/\\n/g,"");//Trim out newline characters
			raw = raw.replace(/<ext>[^]+?<\/ext>/g,"");//Trim out citations
			
			//Desc
			model.desc = raw.replace(/==.+/,"");//Trim rear end of query. '==' Preceeds the first heading
			model.desc = model.desc.replace(/<template.*?>[^]+?<\/template>/g,"");//Clean out templates
			model.desc = model.desc.replace(/<.+?>/g,"");//Trim out HTML stuff
			
			//	Now to clean out Wikipedia links
			//	Wikipedia allows a linked page to display different text. In these cases, delete the part of the link that is the actual page name
			//	Example: [[page|Displayed text]] looks like "Displayed text" and links to 'page'
			model.desc = model.desc.replace(/\[\[[^\]]+?\|/g,"");
			model.desc = model.desc.replace(/\[\[/g,"");//Delete all beginning link bounds
			model.desc = model.desc.replace(/\]\]/g,"");//Delete all ending link bounds
			
			//Image URL
			model.imageUrl = raw.replace(/.+?image.+?<value>/,"");//Get file name
			model.imageUrl = model.imageUrl.replace(/<\/value>.+/,"");//Get file name
			model.imageUrl = "https://commons.wikimedia.org/wiki/File:" + encodeURIComponent(model.imageUrl);
			
			//Image caption
			if(raw.search(/image_alt/) > -1){
				model.imageCap = raw.substring(raw.indexOf("image_alt")+42,raw.indexOf("<\/value>",raw.indexOf("image_alt")));
			}
			
			//Conservation status
			model.status = raw.substring(raw.indexOf("status")+40, raw.indexOf("status")+42);
			if(model.status == "EX"){
				model.status = "Extinct (EX). No know individuals remaining";
			}else if(model.status == "EW"){
				model.status = "Extinct in the wild (EW). Known only to survive in captivity";
			}else if(model.status == "CR"){
				model.status = "Critically endangered (CR). Extremely high risk of extinction";
			}else if(model.status == "EN"){
				model.status = "Endangered (EN). High risk of extinction";
			}else if(model.status == "VU"){
				model.status = "Vulnerable (VU). High risk of endangerment in wild";
			}else if(model.status == "NT"){
				model.status = "Near threatened (NT). Likely to become endangered in near future";
			}else if(model.status == "LC"){
				model.status = "Least concern (LC). Lowest risk";
			}else if(model.status == "DD"){
				model.status = "Extinct (DD). Not enough data to make assessment";
			}else if(model.status == "NE"){
				model.status = "Not evaluated (NE). Has not yet been evaluated against criteria";
			}else{
				model.status = null;
			}
			
			//Scientific name
			model.sciName = raw.substring(raw.indexOf("binomial")+44,raw.indexOf("<\/value>",raw.indexOf("binomial"))-2);
			
			//Behavior
			if(raw.search(/==Behaviou?r==/) > -1){//If behavior section exists
				model.behavior = raw.replace(/[^]+==Behaviou?r==/,"");//Trim up to behavior
				model.behavior = model.behavior.replace(/==[^]+/,"");//Trim any following headings
				model.behavior = model.behavior.replace(/<.+?>/g,"");//Trim out HTML stuff	
			
				//	Now to clean out Wikipedia links
				//	Wikipedia allows a linked page to display different text. In these cases, delete the part of the link that is the actual page name
				//	Example: [[page|Displayed text]] looks like "Displayed text" and links to 'page'
				model.behavior = model.behavior.replace(/\[\[[^\]]+?\|/g,"");
				model.behavior = model.behavior.replace(/\[\[/g,"");//Delete all beginning link bounds
				model.behavior = model.behavior.replace(/\]\]/g,"");//Delete all ending link bounds
				
				//If this was formatted with no upper-level behavior blurb, then the selection is empty space. Check for it
				if(model.behavior.search(/\W/) == -1){
					model.behavior = null;
				}
			}//Not found
			
			//Territory
			model.rangeUrl = raw.replace(/.+?range_map.+?<value>/,"");//Get file name
			model.rangeUrl = model.rangeUrl.replace(/<\/value>.+/,"");//Get file name
			model.rangeUrl = "https://en.wikipedia.org/w/api.php?action=query&titles=Image:" + encodeURIComponent(model.rangeUrl) + "&prop=imageinfo&iiprop=url";

			var r = request(model.rangeUrl, function callback(error, response, body){
				return body;
			});
			console.log(r);


		}
	}
}