
import {DatabasePopulator, BirdModel} from './populate';

import {ConnectionManager} from './ConnectionGenerator';

import * as express from 'express';

import { InfoApp } from './app/birdInformation';


var populateDatabase = true;

console.log('Loaded');

if(populateDatabase){
	ConnectionManager.init().then(() => {
		var database = new DatabasePopulator();

		database.doThePopulate();
	});
}

if(!populateDatabase){
	let app = express();

	app.use('/info', InfoApp);
	app.listen(3000, function(){
		console.log("listening on port 3000");
	});
}
