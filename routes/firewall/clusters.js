/**
 * Module to routing CLUSTER requests
 * <br>BASE ROUTE CALL: <b>/clusters</b>
 *
 * @module Cluster
 * 
 * @requires express
 * @requires Clustermodel
 * 
 */


/**
 * Clase to manage CLUSTER DATA
 *
 * @class ClusterRouter
 */


/**
 * Property  to manage express
 *
 * @property express
 * @type express
 */
var express = require('express');

/**
 * Property  to manage  route
 *
 * @property router
 * @type express.Router 
 */
var router = express.Router();


/**
 * Property Model to manage API RESPONSE data
 *
 * @property api_resp
 * @type ../../models/api_response
 * 
 */
var api_resp = require('../../utils/api_response');

/**
 * Property to identify Data Object
 *
 * @property objModel
 * @type text
 */
var objModel = 'CLUSTER';

/**
 * Property Model to manage Cluster Data
 *
 * @property ClusterModel
 * @type ../../models/cluster
 */
var ClusterModel = require('../../models/firewall/cluster');

var utilsModel = require("../../utils/utils.js");

var fwcTreemodel = require('../../models/tree/fwc_tree');
var Policy_rModel = require('../../models/policy/policy_r');


/**
 * My method description.  Like other pieces of your comment blocks, 
 * this can span multiple lines.
 * ROUTE CALL:  /
 *
 * @method getclusters
 * 
 * @param {String} foo Argument 1
 * @param {Object} config A config object
 * @param {String} config.name The name on the config object
 * @param {Function} config.callback A callback function on the config object
 * @param {Boolean} [extra=false] Do extra, optional work
 * @return {Boolean} Returns true on success
 */
router.get('', function (req, res)
{
    ClusterModel.getClusters(function (error, data)
    {
        //Get data
        if (data && data.length > 0)
        {
            api_resp.getJson(data, api_resp.ACR_OK, '', objModel, null, function (jsonResp) {
                res.status(200).json(jsonResp);
            });
        }
        //get error
        else
        {
            api_resp.getJson(data, api_resp.ACR_NOTEXIST, 'not found', objModel, null, function (jsonResp) {
                res.status(200).json(jsonResp);
            });
        }
    });
});




/* New cluster */
router.post("/cluster", function (req, res)
{
    var iduser = req.iduser;
    var fwcloud = req.fwcloud;

    //new objet with Cluster data
    var clusterData = {        
        name: req.body.name,
        comment: req.body.comment,
        fwcloud: fwcloud
    };
    ClusterModel.insertCluster(clusterData, function (error, data)
    {
        //get cluster info
        if (data && data.insertId)
        {
            var dataresp = {"insertId": data.insertId};
            var idcluster = data.insertId;

            //////////////////////////////////
            //INSERT CLUSTER NODE STRUCTURE
            fwcTreemodel.insertFwc_Tree_New_cluster(fwcloud, "FDC", idcluster, function (error, dataTree) {
                if (error)
                    api_resp.getJson(dataTree, api_resp.ACR_ERROR, 'Error', objModel, error, function (jsonResp) {
                        res.status(200).json(jsonResp);
                    });
                else if (dataTree && dataTree.result) {
                    api_resp.getJson(dataresp, api_resp.ACR_INSERTED_OK, 'CLUSTER INSERTED OK', objModel, null, function (jsonResp) {
                        res.status(200).json(jsonResp);
                    });
                } else
                    api_resp.getJson(data, api_resp.ACR_ERROR, 'Error', objModel, error, function (jsonResp) {
                        res.status(200).json(jsonResp);
                    });
            });

        } else
        {
            api_resp.getJson(data, api_resp.ACR_ERROR, 'Error inserting', objModel, error, function (jsonResp) {
                res.status(200).json(jsonResp);
            });
        }
    });
});

/* cluster update */
router.put('/cluster', function (req, res)
{
    //Save cluster data into objet 
    var clusterData = {id: req.param('id'), name: req.param('name')};
    ClusterModel.updateCluster(clusterData, function (error, data)
    {
        //cluster ok
        if (data && data.result)
        {
            api_resp.getJson(null, api_resp.ACR_UPDATED_OK, 'UPDATED OK', objModel, null, function (jsonResp) {
                res.status(200).json(jsonResp);
            });
        } else
        {
            api_resp.getJson(data, api_resp.ACR_ERROR, 'Error updating', objModel, error, function (jsonResp) {
                res.status(200).json(jsonResp);
            });
        }
    });
});

/* Get cluster by Id */
router.get('/cluster/:id', function (req, res)
{
    var id = req.params.id;

    if (!isNaN(id))
    {
        ClusterModel.getCluster(id, function (error, data)
        {
            //cluster ok
            if (data && data.length > 0)
            {
//                res.render("update_cluster",{ 
//                    title : "", 
//                    info : data
//                });
                api_resp.getJson(data, api_resp.ACR_OK, '', objModel, null, function (jsonResp) {
                    res.status(200).json(jsonResp);
                });

            }
            //Get error
            else
            {
                api_resp.getJson(data, api_resp.ACR_NOTEXIST, 'not found', objModel, null, function (jsonResp) {
                    res.status(200).json(jsonResp);
                });
            }
        });
    } else
    {
        api_resp.getJson(null, api_resp.ACR_NOTEXIST, 'not found', objModel, null, function (jsonResp) {
            res.status(200).json(jsonResp);
        });
    }
});



/* Remove cluster */
router.put("/del/cluster/:id", function (req, res)
{

    var id = req.param('id');
    ClusterModel.deleteCluster(id, function (error, data)
    {
        if (data && data.result)
        {
            api_resp.getJson(data, api_resp.ACR_DELETED_OK, '', objModel, null, function (jsonResp) {
                res.status(200).json(jsonResp);
            });
        } else
        {
            api_resp.getJson(data, api_resp.ACR_ERROR, 'Error deleting', objModel, error, function (jsonResp) {
                res.status(200).json(jsonResp);
            });
        }
    });
});

module.exports = router;