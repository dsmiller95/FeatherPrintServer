import * as express from 'express';

import {ConnectionManager} from '../ConnectionGenerator';

import {Configuration} from '../config';

export var InfoApp = express();

/*

/bird/:id
	Get details for a specific bird

/birds?pagesize=20&page=0
	Get a list of birds, limited by pagesize(default 20) and on page page(default 0)

*/


InfoApp.get('/bird/:id', (req, res) => {
	var connection = ConnectionManager.getConnection();

	var id = req.params.id;
	connection.connect();

	connection.query(
		`SELECT *
		FROM information
		WHERE id=${id}`,
		(err, result) => {
			if(err){
				res.sendStatus(500);
			}else{
				if(result.length > 0){
					res.json(result[0]);
				}else{
					res.sendStatus(404);
				}
			}
	});
});


InfoApp.get('/birds', (req, res) => {

	var pageSize = req.query.pagesize || Configuration.getDetailsPageLimit();
	var page = req.query.page || 0;

	var connection = ConnectionManager.getConnection();
	connection.connect();

	connection.query(
		`SELECT *
		FROM information
		LIMIT ${pageSize * page}, ${pageSize}`,
		(err, result) => {
			if(err){
				res.sendStatus(500);
			}else{
				res.json(result);
			}
		})
});
