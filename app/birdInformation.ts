import * as express from 'express';

export var InfoApp = express();

InfoApp.get('/', (req, res) => {
	res.send('API up and running!');
})
