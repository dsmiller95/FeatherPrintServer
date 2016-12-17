//import * as prompt from 'prompt';
import * as read from 'read';
import * as mysql from 'mysql';


class MySQLConnectionFactory{

	private host: string = 'featherprint.cvzffvtv4h1p.us-east-1.rds.amazonaws.com';
	private user: string = 'MLBB';
	private password: string;
	private defaultDatabase: string = 'FeatherPrint';

	private completionPromise: Promise<void>;

	constructor(password: string){
		this.password = password;
	}
	public getConnection(): mysql.IConnection{
		return mysql.createConnection({
		  host     : this.host,
		  user     : this.user,
		  password : this.password,
		  database : this.defaultDatabase
		});
	}

	public testConnection(): Promise<boolean>{
		return new Promise<boolean>((resolve, reject) => {
			this.getConnection().connect((err) => {
				if(err){
					resolve(false);
				}else{
					resolve(true);
				}
			})
		});
	}
}

export class ConnectionManager{
	private static connectionFactory: MySQLConnectionFactory;

	private static completionPromise: Promise<void>;

	public static init(): Promise<void>{
		return new Promise<void>((resolve, reject) => {
			this.getPassword().then((factory) => {
				this.connectionFactory = factory;
				resolve();
			}).catch(() => reject());
		});
	}

	private static getPassword(): Promise<MySQLConnectionFactory>{
		return new Promise<MySQLConnectionFactory>((resolve, reject) => {
			read({ prompt: 'Password: ', silent: true, replace: '*' }, (er, password: string) => {
				console.log(password);
				var connectionFactory = new MySQLConnectionFactory(password);
				connectionFactory.testConnection().then((connected) => {
					if(connected){
						//we got a good connection; resolve on it
						resolve(connectionFactory);
					}else{
						//do it all over again
						console.log("invalid password, try again");
						return this.getPassword();
					}
				});
			});
		});
	}

	public static getConnection(): mysql.IConnection{
		return this.connectionFactory.getConnection();
	}
}