const pool_config = {
	host: process.env.db_host,
	user: process.env.db_user,
	password: process.env.db_password,
	database: process.env.db_name,
	max: 10,
	idleTimeoutMillis: 10000,
	connectionTimeoutMillis: 0,
};

export { pool_config };
