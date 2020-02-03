/*
    Copyright 2019 SOLTECSIS SOLUCIONES TECNOLOGICAS, SLU
    https://soltecsis.com
    info@soltecsis.com


    This file is part of FWCloud (https://fwcloud.net).

    FWCloud is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    FWCloud is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with FWCloud.  If not, see <https://www.gnu.org/licenses/>.
*/


import db from '../../database/DatabaseService';


//create object
var policy_gModel = {};
var tableModel = "policy_g";


var logger = require('log4js').getLogger("app");

//Get All policy_g by firewall
policy_gModel.getPolicy_gs = function (idfirewall, callback) {

	db.get(function (error, connection) {
		if (error)
			callback(error, null);
		var sql = 'SELECT * FROM ' + tableModel + ' WHERE firewall=' + connection.escape(idfirewall) + ' ORDER BY id';
		connection.query(sql, function (error, rows) {
			if (error)
				callback(error, null);
			else
				callback(null, rows);
		});
	});
};

//Get All policy_g by firewall and group father
policy_gModel.getPolicy_gs_group = function (idfirewall, idgroup, callback) {

	db.get(function (error, connection) {
		if (error)
			callback(error, null);
		var sql = 'SELECT * FROM ' + tableModel + ' WHERE firewall=' + connection.escape(idfirewall) + ' AND idgroup=' + connection.escape(idgroup) + ' ORDER BY id';
		connection.query(sql, function (error, rows) {
			if (error)
				callback(error, null);
			else
				callback(null, rows);
		});
	});
};



//Get policy_g by  id and firewall
policy_gModel.getPolicy_g = function (idfirewall, id, callback) {
	db.get(function (error, connection) {
		if (error)
			callback(error, null);
		var sql = 'SELECT * FROM ' + tableModel + ' WHERE id = ' + connection.escape(id) + ' AND firewall=' + connection.escape(idfirewall);
		connection.query(sql, function (error, row) {
			if (error)
				callback(error, null);
			else
				callback(null, row);
		});
	});
};


//Add new policy_g from user
policy_gModel.insertPolicy_g = function (policy_gData, callback) {
	db.get(function (error, connection) {
		if (error)
			callback(error, null);
		var sqlExists = 'SELECT * FROM ' + tableModel + '  WHERE id = ' + connection.escape(policy_gData.id) + ' AND firewall=' + connection.escape(policy_gData.firewall);
		
		connection.query(sqlExists, function (error, row) {                        
			if (row &&  row.length>0) {
				logger.debug("GRUPO Existente: " + policy_gData.id );
				callback(null, {"insertId": policy_gData.id});

			} else {
				sqlInsert='INSERT INTO ' + tableModel + ' SET firewall=' + policy_gData.firewall + ", name=" +  connection.escape(policy_gData.name) + ", comment=" + connection.escape(policy_gData.comment);
				connection.query(sqlInsert, function (error, result) {
					if (error) {
						callback(error, null);
					} else {
						//devolvemos la última id insertada
						logger.debug("CREADO nuevo GRUPO: " + result.insertId );
						callback(null, {"insertId": result.insertId});
					}
				});
			}
		});
	});
};

//Update policy_g from user
policy_gModel.updatePolicy_g = function (policy_gData, callback) {

	db.get(function (error, connection) {
		if (error)
			callback(error, null);
		var sql = 'UPDATE ' + tableModel + ' SET name = ' + connection.escape(policy_gData.name) + ',' +
				'firewall = ' + connection.escape(policy_gData.firewall) + ',' +
				'comment = ' + connection.escape(policy_gData.comment) + ' ' +
				' WHERE id = ' + policy_gData.id;
		
		connection.query(sql, function (error, result) {
			if (error) {
				callback(error, null);
			} else {
				callback(null, {"result": true});
			}
		});
	});
};

//Update policy_g NAME 
policy_gModel.updatePolicy_g_name = function (policy_gData, callback) {

	db.get(function (error, connection) {
		if (error)
			callback(error, null);
		var sql = 'UPDATE ' + tableModel + ' SET name = ' + connection.escape(policy_gData.name) + ' ' +
				' WHERE id = ' + policy_gData.id;
		
		connection.query(sql, function (error, result) {
			if (error) {
				callback(error, null);
			} else {
				callback(null, {"result": true});
			}
		});
	});
};

//Update policy_r Style
policy_gModel.updatePolicy_g_Style = function (firewall, id, style, callback) {

	db.get(function (error, connection) {
		if (error)
			callback(error, null);

		var sql = 'UPDATE ' + tableModel + ' SET ' +
				'groupstyle = ' + connection.escape(style) + ' ' +
				' WHERE id = ' + connection.escape(id) + " and firewall=" + connection.escape(firewall);        
		connection.query(sql, function (error, result) {
			if (error) {                
				logger.error(error);
				callback(error, null);
			} else {
				if (result.affectedRows > 0) {
					callback(null, {"result": true});
				} else
					callback(null, {"result": false});
			}
		});
	});
};

//Remove policy_g with id to remove
//FALTA BORRADO EN CASCADA 
policy_gModel.deletePolicy_g = (idfirewall, id, callback) => {
	db.get(function (error, connection) {
		if (error)
			callback(error, null);
		var sqlExists = 'SELECT * FROM ' + tableModel + '  WHERE id = ' + connection.escape(id) + ' AND firewall=' + connection.escape(idfirewall);
		connection.query(sqlExists, function (error, row) {
			//If exists Id from policy_g to remove
			if (row) {
				db.get(function (error, connection) {
					var sql = 'DELETE FROM ' + tableModel + ' WHERE id = ' + connection.escape(id);
					connection.query(sql, function (error, result) {
						if (error) {
							callback(error, null);
						} else {
							callback(null, {"result": true, "msg": "deleted"});
						}
					});
				});
			} else {
				callback(null, {"result": false});
			}
		});
	});
};

//Delete policy group if it is empty.
policy_gModel.deleteIfEmptyPolicy_g = (dbCon,firewall,group) => {
	return new Promise((resolve, reject) => {
		let sql = 'SELECT count(*) AS n FROM policy_r WHERE idgroup=' + group + ' AND firewall=' + firewall;
		dbCon.query(sql, (error, rows) => {
			if (error) return	reject(error);

			// Only delete if the group is empty.
			if (rows[0].n>0) return resolve();

			sql = 'DELETE FROM ' + tableModel + ' WHERE id=' + group;
			dbCon.query(sql, (error, rows) => {
				if (error) return	reject(error);
				resolve();
			});
		});
	});
};


//Clone policy groups
policy_gModel.clonePolicyGroups = function (idFirewall, idNewFirewall) {
	return new Promise((resolve, reject) => {
		db.get((error, connection) => {
			if (error) return reject(error);
			
			let sql = 'select '+ connection.escape(idNewFirewall) + ' as newfirewall,id,firewall,name,comment,idgroup,groupstyle'+
				' from ' + tableModel + ' where firewall=' + connection.escape(idFirewall);
			connection.query(sql, (error, rows) => {
				if (error) return	reject(error);
				
				//Bucle for each policy group.
				Promise.all(rows.map(policy_gModel.cloneGroup))
				.then(data => resolve(data))
				.catch(error => reject(error));
			});
		});
	});
};

policy_gModel.cloneGroup = function (rowData) {
	return new Promise((resolve, reject) => {
		db.get((error, connection) => {
			if (error) return reject(error);

			let sql = 'INSERT INTO ' + tableModel + ' (firewall,name,comment,idgroup,groupstyle)' +
				' VALUES(' + connection.escape(rowData.newfirewall) + ',' +
				connection.escape(rowData.name) + ',' + connection.escape(rowData.comment) + ',' +
				connection.escape(rowData.idgroup) + ',' + connection.escape(rowData.groupstyle) + ')';
			connection.query(sql, (error, result) => {
				if (error) return reject(error);

				sql = 'UPDATE policy_r SET idgroup=' + connection.escape(result.insertId) +
					' WHERE idgroup=' + connection.escape(rowData.id) + ' AND firewall=' + connection.escape(rowData.newfirewall);
				connection.query(sql, (error, result) => {
					if (error) return reject(error);
					resolve();
				});
			});
		});
	});
};

//Clone policy groups
policy_gModel.deleteFirewallGroups = function (idFirewall) {
	return new Promise((resolve, reject) => {
		db.get((error, connection) => {
			if (error) return reject(error);
			
			let sql = 'DELETE FROM ' + tableModel + ' WHERE firewall=' + connection.escape(idFirewall);
			connection.query(sql, (error, rows) => {
				if (error) return	reject(error);
				resolve();
			});
		});
	});
};

//Move rules from one firewall to other.
policy_gModel.moveToOtherFirewall = (dbCon, src_firewall, dst_firewall) => {
	return new Promise((resolve, reject) => {
		dbCon.query(`UPDATE ${tableModel} SET firewall=${dst_firewall} WHERE firewall=${src_firewall}`, (error, result) => {
			if (error) return reject(error);
			resolve();
		});
	});
};

//Export the object
module.exports = policy_gModel;