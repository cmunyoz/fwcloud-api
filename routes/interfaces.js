var express = require('express');
var router = express.Router();
var InterfaceModel = require('../models/interface');

/**
* Property Logger to manage App logs
*
* @property logger
* @type log4js/app
* 
*/
var logger = require('log4js').getLogger("app");

/* Show form */
router.get('/interface', function (req, res)
{
    res.render('new_interface', {title: 'Crear nuevo interface'});
});

/* Get all interfaces by firewall*/
router.get('/:idfirewall', function (req, res)
{
    var idfirewall = req.params.idfirewall;
    InterfaceModel.getInterfaces(idfirewall,function (error, data)
    {
        //If exists interface get data
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

/* Get  interface by id and  by firewall*/
router.get('/:idfirewall/interface/:id', function (req, res)
{
    var idfirewall = req.params.idfirewall;
    var id = req.params.id;
    InterfaceModel.getInterface(idfirewall,id,function (error, data)
    {
        //If exists interface get data
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

/* Get all interfaces by nombre and by firewall*/
router.get('/:idfirewall/name/:name', function (req, res)
{
    var idfirewall = req.params.idfirewall;
    var name = req.params.name;
    InterfaceModel.getInterfaceName(idfirewall,name,function (error, data)
    {
        //If exists interface get data
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





/* Create New interface */
router.post("/interface", function (req, res)
{
    //Create New objet with data interface
    var interfaceData = {
        id: null,
        firewall: req.body.firewall,
        name: req.body.name,
        labelName: req.body.labelName,
        type: req.body.type,
        securityLevel: req.body.securityLevel
    };
    
    InterfaceModel.insertInterface(interfaceData, function (error, data)
    {
        //If saved interface Get data
        if (data && data.insertId)
        {
            //res.redirect("/interfaces/interface/" + data.insertId);
            res.status(200).json( {"insertId": data.insertId});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

/* Update interface that exist */
router.put('/interface/', function (req, res)
{
    //Save data into object
    var interfaceData = {id: req.param('id'), name: req.param('name'), firewall: req.param('firewall'), labelName: req.param('labelName'), type: req.param('type'), securityLevel: req.param('securityLevel')};
    InterfaceModel.updateInterface(interfaceData, function (error, data)
    {
        //If saved interface saved ok, get data
        if (data && data.msg)
        {
            //res.redirect("/interfaces/interface/" + req.param('id'));
            res.status(200).json( {"data": data.msg});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});



/* Remove interface */
router.delete("/interface/", function (req, res)
{
    //Id from interface to remove
    var idfirewall = req.param('idfirewall');
    var id = req.param('id');
    InterfaceModel.deleteInterfaceidfirewall(idfirewall,id, function (error, data)
    {
        if (data && data.msg === "deleted" || data.msg === "notExist")
        {
            //res.redirect("/interfaces/");
            res.status(200).json( {"data": data.msg});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

module.exports = router;