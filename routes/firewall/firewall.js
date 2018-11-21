/**
 * Module to routing Firewalls requests
 * <br>BASE ROUTE CALL: <b>/firewalls</b>
 *
 * @module Firewall
 * 
 * 
 */

/**
 * Class to manage firewalls routing
 * 
 * 
 * @class FirewallRouter
 * 
 */

/**
 * Property  to manage express
 *
 * @property express
 * @type express
 */
var express = require('express');

/**
 * Property  to manage Firewall route
 *
 * @property router
 * @type express.Router 
 */
var router = express.Router();

/**
 * Property Model to manage API RESPONSE data: {{#crossLinkModule "api_response"}}{{/crossLinkModule}}
 *
 * @property api_resp
 * @type api_respModel
 * 
 */
var api_resp = require('../../utils/api_response');

/**
 * Property to identify Data Object
 *
 * @property objModel
 * @type text
 */
var objModel = 'FIREWALL';

/**
 * Property Model to manage Firewall Data
 *
 * @property FirewallModel
 * @type ../../models/firewall/firewall
 * 
 * 
 */
var FirewallModel = require('../../models/firewall/firewall');
var FirewallExport = require('../../models/firewall/export');

/**
 * Property Model to manage Fwcloud Data
 *
 * @property FwcloudModel
 * @type ../../models/fwcloud
 * 
 * 
 */
var FwcloudModel = require('../../models/fwcloud/fwcloud');

/**
 * Property Logger to manage App logs
 *
 * @attribute logger
 * @type log4js/app
 * 
 */
var logger = require('log4js').getLogger("app");


var utilsModel = require("../../utils/utils.js");

var fwcTreemodel = require('../../models/tree/tree');

var InterfaceModel = require('../../models/interface/interface');

var Policy_rModel = require('../../models/policy/policy_r');
var Policy_cModel = require('../../models/policy/policy_c');

const restrictedCheck = require('../../middleware/restricted');


/**
 * Get Firewalls by User
 * 
 * 
 * > ROUTE CALL:  __/firewalls/:iduser__      
 * > METHOD:  __GET__
 * 
 * @method getFirewallByUser
 * 
 * @param {Integer} iduser User identifier
 * 
 * @return {JSON} Returns `JSON` Data from Firewall
 * @example #### JSON RESPONSE
 *    
 *       {"data" : [
 *          {  //Data Firewall 1       
 *           "id" : ,            //Firewall Identifier
 *           "cluster" : ,       //Cluster
 *           "fwcloud" : ,       //Id Firewall cloud
 *           "name" : ,          //Firewall name
 *           "comment" : ,       //comment
 *           "created_at" : ,    //Date Created
 *           "updated_at" : ,    //Date Updated
 *           "by_user" : ,       //User last update
 *          },
 *          {....}, //Data Firewall 2
 *          {....}  //Data Firewall ...n 
 *         ]
 *       };
 * 
 */
router.put('/all/get', (req, res) => {
	FirewallModel.getFirewalls(req.session.user_id, function(error, data) {
		//Get data
		if (data && data.length > 0) {
			api_resp.getJson(data, api_resp.ACR_OK, '', objModel, null, function(jsonResp) {
				res.status(200).json(jsonResp);
			});
		}
		//Get error
		else {
			api_resp.getJson(data, api_resp.ACR_NOTEXIST, 'not found', objModel, null, function(jsonResp) {
				res.status(200).json(jsonResp);
			});
		}
	});
});

/**
 * Get Firewalls by Cloud
 * 
 * 
 * > ROUTE CALL:  __/firewalls/Cloud/__      
 * > METHOD:  __GET__
 * 
 * @method getFirewallByUser_and_Cloud
 * 
 * @param {Integer} iduser User identifier
 * @param {Number} fwcloud Cloud identifier
 * 
 * @return {JSON} Returns `JSON` Data from Firewall
 * @example #### JSON RESPONSE
 *    
 *       {"data" : [
 *          {  //Data Firewall 1       
 *           "id" : ,            //Firewall Identifier
 *           "cluster" : ,       //Cluster
 *           "fwcloud" : ,       //Id Firewall cloud
 *           "name" : ,          //Firewall name
 *           "comment" : ,       //comment
 *           "created_at" : ,    //Date Created
 *           "updated_at" : ,    //Date Updated
 *           "by_user" : ,       //User last update
 *          },
 *          {....}, //Data Firewall 2
 *          {....}  //Data Firewall ...n 
 *         ]
 *       };
 * 
 */
router.put('/cloud/get', (req, res) => {
	FirewallModel.getFirewallCloud(req.session.user_id, req.body.fwcloud, (error, data) => {
		//get data
		if (data && data.length > 0) {
			api_resp.getJson(data, api_resp.ACR_OK, '', objModel, null, function(jsonResp) {
				res.status(200).json(jsonResp);
			});
		}
		//Get Error
		else {
			api_resp.getJson(data, api_resp.ACR_NOTEXIST, 'not found', objModel, null, function(jsonResp) {
				res.status(200).json(jsonResp);
			});
		}
	});
});


/**
 * Get Firewalls by User and ID
 * 
 * 
 * > ROUTE CALL:  __/firewalls/:iduser/:id__      
 * > METHOD:  __GET__
 * 
 * @method getFirewallByUser_and_Id
 * 
 * @param {Integer} iduser User identifier
 * @param {Integer} id firewall identifier
 * 
 * @return {JSON} Returns `JSON` Data from Firewall
 * @example #### JSON RESPONSE
 *    
 *       {"data" : [
 *          {  //Data Firewall        
 *           "id" : ,            //Firewall Identifier
 *           "cluster" : ,       //Cluster
 *           "fwcloud" : ,       //Id Firewall cloud
 *           "name" : ,          //Firewall name
 *           "comment" : ,       //comment
 *           "created_at" : ,    //Date Created
 *           "updated_at" : ,    //Date Updated
 *           "compiled_at" : ,   //Date Compiled
 *           "installed_at" : ,  //Date Installed
 *           "by_user" : ,       //User last update
 *          }
 *         ]
 *       };
 * 
 */
router.put('/get', async (req, res) => {
	try {
		const data = await FirewallModel.getFirewall(req);
		if (data && data.length > 0)
			api_resp.getJson(data, api_resp.ACR_OK, '', objModel, null, jsonResp => res.status(200).json(jsonResp));
		else
			api_resp.getJson(data, api_resp.ACR_NOTEXIST, 'not found', objModel, null, jsonResp => res.status(200).json(jsonResp));
	} catch(error) { api_resp.getJson(null, api_resp.ACR_ERROR, 'Error', objModel, error, jsonResp => res.status(200).json(jsonResp)) }
});



/**
 * Get Firewalls by Cluster
 * 
 * 
 * > ROUTE CALL:  __/firewalls/:iduser/cluster/:idcluster__      
 * > METHOD:  __GET__
 * 
 * @method getFirewallByUser_and_Cluster
 * 
 * @param {Integer} iduser User identifier
 * @param {Number} idcluster Cluster identifier
 * 
 * @return {JSON} Returns `JSON` Data from Firewall
 * @example #### JSON RESPONSE
 *    
 *       {"data" : [
 *          {  //Data Firewall 1       
 *           "id" : ,            //Firewall Identifier
 *           "cluster" : ,       //Cluster
 *           "fwcloud" : ,       //Id Firewall cloud
 *           "name" : ,          //Firewall name
 *           "comment" : ,       //comment
 *           "created_at" : ,    //Date Created
 *           "updated_at" : ,    //Date Updated
 *           "by_user" : ,       //User last update
 *          },
 *          {....}, //Data Firewall 2
 *          {....}  //Data Firewall ...n 
 *         ]
 *       };
 * 
 */
router.put('/cluster/get', (req, res) => {
	FirewallModel.getFirewallCluster(req.session.user_id, req.body.cluster, function(error, data) {
		//get data
		if (data && data.length > 0) {
			api_resp.getJson(data, api_resp.ACR_OK, '', objModel, null, function(jsonResp) {
				res.status(200).json(jsonResp);
			});
		}
		//Get Error
		else {
			api_resp.getJson(data, api_resp.ACR_NOTEXIST, 'not found', objModel, null, function(jsonResp) {
				res.status(200).json(jsonResp);
			});
		}
	});
});


/**
 * CREATE New firewall
 * 
 * 
 * > ROUTE CALL:  __/firewalls/firewall__      
 * > METHOD:  __POST__
 * 
 *
 * @method AddFirewall
 * 
 * @param {Integer} id Firewall identifier (AUTO)
 * @param {Integer} iduser User identifier
 * @param {Integer} cluster Cluster identifier
 * @param {String} name Firewall Name
 * @param {String} [comment] Firewall comment
 * 
 * @return {JSON} Returns Json result
 * @example 
 * #### JSON RESPONSE OK:
 *    
 *       {"data" : [
 *          { 
 *           "insertId : ID,   //firewall identifier           
 *          }
 *         ]
 *       };
 *       
 * #### JSON RESPONSE ERROR:
 *    
 *       {"data" : [
 *          { 
 *           "msg : ERROR,   //Text Error
 *          }
 *         ]
 *       };
 */
router.post('/', async(req, res) => {
	var firewallData = {
		id: null,
		cluster: req.body.cluster,
		name: req.body.name,
		status: 3,
		comment: req.body.comment,
		fwcloud: req.body.fwcloud,
		install_user: req.body.install_user,
		install_pass: req.body.install_pass,
		save_user_pass: req.body.save_user_pass,
		install_interface: req.body.install_interface,
		install_ipobj: req.body.install_ipobj,
		fwmaster: req.body.fwmaster,
		install_port: req.body.install_port,
		by_user: req.session.user_id,
		options: req.body.options
	};

	try {
		// Check that the tree node in which we will create a new node for the firewall is a valid node for it.
		if (req.tree_node.node_type!=='FDF' && req.tree_node.node_type!=='FD') throw(new Error('Bad node tree type'));

		firewallData = await FirewallModel.checkBodyFirewall(firewallData, true);

		//encript username and password
		firewallData.install_user = (firewallData.install_user) ? await utilsModel.encrypt(firewallData.install_user) : '';
		firewallData.install_pass = (firewallData.install_pass) ? await utilsModel.encrypt(firewallData.install_pass) : '';

		let data = await FirewallModel.insertFirewall(req.session.user_id, firewallData);
		if (data && data.insertId) {
			var dataresp = { "insertId": data.insertId };
			var newFirewallId = data.insertId;

			await FirewallModel.updateFWMaster(req.session.user_id, req.body.fwcloud, firewallData.cluster, newFirewallId, firewallData.fwmaster);

			if ((firewallData.cluster > 0 && firewallData.fwmaster === 1) || firewallData.cluster === null) {
				// Create the loop backup interface.
				const loInterfaceId = await InterfaceModel.createLoInterface(req.body.fwcloud, newFirewallId);
				await Policy_rModel.insertDefaultPolicy(newFirewallId, loInterfaceId);
			}

			if (!firewallData.cluster) // Create firewall tree.
				await fwcTreemodel.insertFwc_Tree_New_firewall(req.body.fwcloud, req.body.node_id, newFirewallId);
			else // Create the new firewall node in the NODES node of the cluster.
				await fwcTreemodel.insertFwc_Tree_New_cluster_firewall(req.body.fwcloud, firewallData.cluster, newFirewallId, firewallData.name);

			// Create the directory used for store firewall data.
			await utilsModel.createFirewallDataDir(req.body.fwcloud, newFirewallId);

			api_resp.getJson(dataresp, api_resp.ACR_INSERTED_OK, 'INSERTED OK', objModel, null, jsonResp => res.status(200).json(jsonResp));
		} else api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, "", jsonResp => res.status(200).json(jsonResp));
	} catch (error) { api_resp.getJson(null, api_resp.ACR_ERROR, 'Creating firewall', objModel, error, jsonResp => res.status(200).json(jsonResp)) }
});


/**
 * UPDATE firewall
 * 
 * 
 * > ROUTE CALL:  __/firewalls/firewall__      
 * > METHOD:  __PUT__
 * 
 *
 * @method UpdateFirewall
 * 
 * @param {Integer} id Firewall identifier
 * @optional
 * @param {Integer} iduser User identifier
 * @param {Integer} cluster Cluster identifier
 * @param {String} name Firewall Name
 * @param {String} comment Firewall comment
 * 
 * @return {JSON} Returns Json result
 * @example 
 * #### JSON RESPONSE OK:
 *    
 *       {"data" : [
 *          { 
 *           "msg : "success",   //result
 *          }
 *         ]
 *       };
 *       
 * #### JSON RESPONSE ERROR:
 *    
 *       {"data" : [
 *          { 
 *           "msg : ERROR,   //Text Error
 *          }
 *         ]
 *       };
 */
router.put('/', (req, res) => {
	//Save firewall data into objet    
	var firewallData = {
		id: req.body.firewall,
		cluster: req.body.cluster,
		name: req.body.name,
		comment: req.body.comment,
		fwcloud: req.body.fwcloud, //working cloud      
		install_user: req.body.install_user,
		install_pass: req.body.install_pass,
		save_user_pass: req.body.save_user_pass,
		install_interface: req.body.install_interface,
		install_ipobj: req.body.install_ipobj,
		fwmaster: req.body.fwmaster,
		install_port: req.body.install_port,
		by_user: req.session.user_id, //working user
		options: req.body.options
	};

	//logger.debug(firewallData);
	Policy_cModel.deleteFullFirewallPolicy_c(req.body.firewall)
		.then(() => FirewallModel.updateFirewallStatus(req.body.fwcloud, req.body.firewall, "|3"))
		.then(() => FirewallModel.checkBodyFirewall(firewallData, false))
		.then(result => {
			firewallData = result;
			//encript username and password
			utilsModel.encrypt(firewallData.install_user)
				.then(data => {
					logger.debug("SSHUSER: " + firewallData.install_user + "   ENCRYPTED: " + data);
					firewallData.install_user = data;
				})
				.then(utilsModel.encrypt(firewallData.install_pass)
					.then(data => {
						logger.debug("SSPASS: " + firewallData.install_pass + "   ENCRYPTED: " + data);
						firewallData.install_pass = data;
					}))
				.then(() => {
					logger.debug("SAVING DATA NODE CLUSTER. SAVE USER_PASS:", firewallData.save_user_pass);
					if (!firewallData.save_user_pass) {
						firewallData.install_user = '';
						firewallData.install_pass = '';
					}

					FirewallModel.updateFirewall(req.session.user_id, firewallData, function(error, data) {
						//Saved ok
						if (data && data.result) {
							FirewallModel.updateFWMaster(req.session.user_id, req.body.fwcloud, firewallData.cluster, req.body.firewall, firewallData.fwmaster)
								.then(() => {
									//////////////////////////////////
									//UPDATE FIREWALL NODE STRUCTURE                                    
									fwcTreemodel.updateFwc_Tree_Firewall(req.session.user_id, req.body.fwcloud, firewallData, function(error, data) {
										if (error)
											api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, error, function(jsonResp) {
												res.status(200).json(jsonResp);
											});
										else if (data && data.result)
											api_resp.getJson(data, api_resp.ACR_UPDATED_OK, 'UPDATED OK', objModel, null, function(jsonResp) {
												res.status(200).json(jsonResp);
											});
										else
											api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, error, function(jsonResp) {
												res.status(200).json(jsonResp);
											});
									});
								})
								.catch(error => api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, error, jsonResp => res.status(200).json(jsonResp)));
						} else {
							api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, error, function(jsonResp) {
								res.status(200).json(jsonResp);
							});
						}
					});

				})
				.catch(e => {
					logger.debug(e);
					api_resp.getJson(null, api_resp.ACR_ERROR, 'Error', objModel, e, function(jsonResp) {
						res.status(200).json(jsonResp);
					});
				});

		})
		.catch(e => {
			logger.error("ERROR UPDATING FIREWALL: ", e);
			api_resp.getJson(null, api_resp.ACR_ERROR, e, objModel, e, function(jsonResp) {
				res.status(200).json(jsonResp);
			});
		});
});


router.put('/clone', (req, res) => {
	//Save firewall data into objet    
	var firewallData = {
		id: req.body.firewall,
		name: req.body.name,
		comment: req.body.comment,
		fwcloud: req.body.fwcloud, //working cloud      
		by_user: req.session.user_id //working user
	};

	// Check that the tree node in which we will create a new node for the firewall is a valid node for it.
	if (req.tree_node.node_type!=='FDF' && req.tree_node.node_type!=='FD')
		return api_resp.getJson(null, api_resp.ACR_ERROR, 'Bad node tree type', objModel, null, jsonResp => res.status(200).json(jsonResp));

	FirewallModel.cloneFirewall(req.session.user_id, firewallData)
		.then(data => {
			//Saved ok
			if (data && data.result) {
				logger.debug("NUEVO FIREWALL CREADO: " + data.insertId);
				var idNewFirewall = data.insertId;

				//CLONE INTERFACES
				InterfaceModel.cloneFirewallInterfaces(req.session.user_id, req.body.fwcloud, req.body.firewall, idNewFirewall)
					.then(dataI => Policy_rModel.cloneFirewallPolicy(req.session.user_idr, req.body.fwcloud, req.body.firewall, idNewFirewall, dataI))
					.then(dataP => utilsModel.createFirewallDataDir(req.body.fwcloud, idNewFirewall))
					.then(dataD => {
						//INSERT FIREWALL NODE STRUCTURE                                                
						fwcTreemodel.insertFwc_Tree_firewalls(req.body.fwcloud, req.body.node_id, idNewFirewall, (error, dataTree) => {
							if (error)
								api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, error, jsonResp => res.status(200).json(jsonResp));
							else if (data && data.result)
								api_resp.getJson(data, api_resp.ACR_UPDATED_OK, 'CLONED OK', objModel, null, jsonResp => res.status(200).json(jsonResp));
							else
								api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, error, jsonResp => res.status(200).json(jsonResp));
						});
					})
					.catch(err => api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, err, jsonResp => res.status(200).json(jsonResp)));
			} else
				api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, null, jsonResp => res.status(200).json(jsonResp));
		})
		.catch(e => api_resp.getJson(null, api_resp.ACR_ERROR, 'Error', objModel, e, jsonResp => res.status(200).json(jsonResp)));
});



/* Get locked Status of firewall by Id */
/**
 * Get Locked status of Firewall by ID and User
 * 
 * <br>ROUTE CALL:  <b>/firewalls/:iduser/firewall/:id/locked</b>
 * <br>METHOD: <b>GET</b>
 *
 * @method getLockedStatusFirewallByUser_and_ID_V2
 * 
 * @param {Integer} iduser User identifier
 * @param {Integer} id Firewall identifier
 * 
 * @return {JSON} Returns Json Data from Firewall
 */
router.put('/accesslock/get', async (req, res) => {
	try {
		const data = await FirewallModel.getFirewall(req);
		if (data && data.length > 0) {
			await FwcloudModel.getFwcloudAccess(req.session.user_id, req.body.fwcloud);
			api_resp.getJson(resp, api_resp.ACR_OK, '', "", null, jsonResp => res.status(200).json(jsonResp));
		}
	} catch(error) { api_resp.getJson(null, api_resp.ACR_ERROR, 'Error', objModel, error, jsonResp => res.status(200).json(jsonResp)) }
});


// API call for check deleting restrictions.
router.put("/restricted",
	restrictedCheck.otherFirewall,
	restrictedCheck.firewallApplyTo,
	(req, res) => api_resp.getJson(null, api_resp.ACR_OK, '', objModel, null, jsonResp => res.status(200).json(jsonResp)));


/**
 * DELETE firewall
 * 
 * 
 * > ROUTE CALL:  __/firewalls/firewall__      
 * > METHOD:  __DELETE__
 * 
 *
 * @method DeleteFirewall
 * 
 * @param {Integer} id Firewall identifier
 * @optional
 * 
 * @return {JSON} Returns Json result
 * @example 
 * #### JSON RESPONSE OK:
 *    
 *       {"data" : [
 *          { 
 *           "msg : "success",   //result
 *          }
 *         ]
 *       };
 *       
 * #### JSON RESPONSE ERROR:
 *    
 *       {"data" : [
 *          { 
 *           "msg : ERROR,   //Text Error
 *          }
 *         ]
 *       };
 */
router.put('/del',
	restrictedCheck.otherFirewall,
	async(req, res) => {
		try {
			data = await FirewallModel.deleteFirewall(req.session.user_id, req.body.fwcloud, req.body.firewall);
			if (data && data.result)
				api_resp.getJson(data, api_resp.ACR_DELETED_OK, '', objModel, null, jsonResp => res.status(200).json(jsonResp));
			else
				api_resp.getJson(data, api_resp.ACR_RESTRICTED, 'Error', objModel, null, jsonResp => res.status(200).json(jsonResp));
		} catch (error) { api_resp.getJson(null, api_resp.ACR_ACCESS_ERROR, 'Error', objModel, error, jsonResp => res.status(200).json(jsonResp)) }
	});

//DELETE FIREWALL FROM CLUSTER
router.put('/delfromcluster',
restrictedCheck.otherFirewall,
restrictedCheck.firewallApplyTo,
(req, res) => {
	//CHECK FIREWALL DATA TO DELETE
	FirewallModel.deleteFirewallFromCluster(req.session.user_id, req.body.fwcloud, req.body.firewall, req.body.cluster)
	.then(data => {
		if (data && data.result)
			api_resp.getJson(data, api_resp.ACR_DELETED_OK, '', objModel, null, jsonResp => res.status(200).json(jsonResp));
	 	else
			api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, null, jsonResp => res.status(200).json(jsonResp));
	})
	.catch(error => api_resp.getJson(null, api_resp.ACR_ACCESS_ERROR, 'Error', objModel, error, jsonResp => res.status(200).json(jsonResp)));
});

/**
 * Get firewall export
 * 
 */
router.put('/export/get', (req, res) => {
	FirewallExport.exportFirewall(req.body.firewall)
		.then(data => {
			api_resp.getJson(data, api_resp.ACR_OK, '', objModel, null, jsonResp => res.status(200).json(jsonResp));
		})
		.catch(err => api_resp.getJson(null, api_resp.ACR_ERROR, '', objModel, err, jsonResp => res.status(200).json(jsonResp)));
});

module.exports = router;