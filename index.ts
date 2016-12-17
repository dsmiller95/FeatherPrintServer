
import {DatabasePopulator, BirdModel} from './populate';

import {ConnectionManager} from './ConnectionGenerator';

import * as express from 'express';

import { InfoApp } from './app/birdInformation';


var populateDatabase = false;

console.log('Loaded');

ConnectionManager.init().then(() => {
	if(populateDatabase){
		var database = new DatabasePopulator();

		database.doThePopulate();
	}

	if(!populateDatabase){
		let app = express();

		app.use('/info', InfoApp);
		app.listen(3000, function(){
			console.log("listening on port 3000");
		});
	}
});