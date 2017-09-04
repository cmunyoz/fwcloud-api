var express = require('express');
var router = express.Router();
var Policy_typeModel = require('../models/policy_type');

/**
* Property Logger to manage App logs
*
* @property logger
* @type log4js/app
* 
*/
var logger = require('log4js').getLogger("app");

/* get data para crear nuevos */
router.get('/policy-type', function (req, res)
{
    res.render('new_policy_type', {title: 'Crear nuevo policy_type'});
});

/* Get all policy_types*/
router.get('/', function (req, res)
{

    Policy_typeModel.getPolicy_types(function (error, data)
    {
        //If exists policy_type get data
        if (typeof data !== 'undefined')
        {
            res.status(200).json( {"data": data});
        }
        //Get Error
        else
        {
            res.status(404).json( {"msg": "notExist"});
        }
    });
});



/* Get  policy_type by type */
router.get('/:type', function (req, res)
{    
    var type = req.params.type;
    Policy_typeModel.getPolicy_type(type,function (error, data)
    {
        //If exists policy_type get data
        if (typeof data !== 'undefined')
        {
            res.status(200).json( {"data": data});
        }
        //Get Error
        else
        {
            res.status(404).json( {"msg": "notExist"});
        }
    });
});

/* Get all policy_types by name */
router.get('/name/:name', function (req, res)
{
    var name = req.params.name;
    Policy_typeModel.getPolicy_typeName(name,function (error, data)
    {
        //If exists policy_type get data
        if (typeof data !== 'undefined')
        {
            res.status(200).json( {"data": data});
        }
        //Get Error
        else
        {
            res.status(404).json( {"msg": "notExist"});
        }
    });
});




/* Create New policy_type */
router.post("/policy-type", function (req, res)
{
    //Create New objet with data policy_type
    var policy_typeData = {
        type: req.body.type,
        name: req.body.comment
    };
    
    Policy_typeModel.insertPolicy_type(policy_typeData, function (error, data)
    {
        //If saved policy_type Get data
        if (data && data.insertId)
        {
            //res.redirect("/policy-types/policy-type/" + data.insertId);
            res.status(200).json( {"insertId": data.insertId});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

/* Update policy_type that exist */
router.put('/policy-type/', function (req, res)
{
    //Save data into object
    var policy_typeData = {type: req.param('type'), name: req.param('name')};
    Policy_typeModel.updatePolicy_type(policy_typeData, function (error, data)
    {
        //If saved policy_type saved ok, get data
        if (data && data.msg)
        {
            //res.redirect("/policy-types/policy-type/" + req.param('type'));
            res.status(200).json( data.msg);
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});



/* Remove policy_type */
router.delete("/policy-type/", function (req, res)
{
    //Id from policy_type to remove
    var idfirewall = req.param('idfirewall');
    var type = req.param('type');
    Policy_typeModel.deletePolicy_typeidfirewall(idfirewall,type, function (error, data)
    {
        if (data && data.msg === "deleted" || data.msg === "notExist")
        {
            //res.redirect("/policy-types/");
            res.status(200).json( data.msg);
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

module.exports = router;