
import {DatabasePopulator, BirdModel} from './populate';

import {ConnectionManager} from './ConnectionGenerator';

console.log('Loaded');

ConnectionManager.init().then(() => {
	var database = new DatabasePopulator();

	database.doThePopulate();
});
