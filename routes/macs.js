var express = require('express');
var router = express.Router();
var MacModel = require('../models/mac');

/**
* Property Logger to manage App logs
*
* @property logger
* @type log4js/app
* 
*/
var logger = require('log4js').getLogger("app");

/* get data para crear  nuevos */
router.get('/mac', function (req, res)
{
    res.render('new_mac', {title: 'Crear nuevo mac'});
});

/* Get all macs by intreface*/
router.get('/:interface', function (req, res)
{
    var interface = req.params.interface;
    MacModel.getMacs(interface,function (error, data)
    {
        //If exists mac get data
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

/* Get  mac by id and  by interface*/
router.get('/:interface/:id', function (req, res)
{
    var interface = req.params.interface;
    var id = req.params.id;
    MacModel.getMac(interface,id,function (error, data)
    {
        //If exists mac get data
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

/* Get all macs by nombre and by interface*/
router.get('/:interface/name/:name', function (req, res)
{
    var interface = req.params.interface;
    var name = req.params.name;
    MacModel.getMacName(interface,name,function (error, data)
    {
        //If exists mac get data
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

/* Get all macs by address and by interface*/
router.get('/:interface/address/:address', function (req, res)
{
    var interface = req.params.interface;
    var address = req.params.address;
    MacModel.getMacAddress(interface,address,function (error, data)
    {
        //If exists mac get data
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



/* Create New mac */
router.post("/mac", function (req, res)
{
    //Create New objet with data mac
    var macData = {
        id: null,
        interface: req.body.interface,
        name: req.body.name,
        address: req.body.address,
        comment: req.body.comment
    };
    var interface= req.body.interface;
    MacModel.insertMac(interface, macData, function (error, data)
    {
        //If saved mac Get data
        if (data && data.insertId)
        {
            //res.redirect("/macs/mac/" + data.insertId);
            res.status(200).json( {"insertId": data.insertId});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

/* Update mac that exist */
router.put('/mac/', function (req, res)
{
    //Save data into object
    var macData = {id: req.param('id'), name: req.param('name'), interface: req.param('interface'), address: req.param('address'), comment: req.param('comment')};
    MacModel.updateMac(macData, function (error, data)
    {
        //If saved mac saved ok, get data
        if (data && data.msg)
        {
            //res.redirect("/macs/mac/" + req.param('id'));
            res.status(200).json( data.msg);
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

/* Get mac by  id and lo mostramos en formulario para editar */
router.get('/:interface/mac/:id', function (req, res)
{
    var id = req.params.id;
    var interface = req.params.interface;
    //
    if (!isNaN(id))
    {
        MacModel.getMac(interface,id, function (error, data)
        {
            //If exists mac get data
            if (typeof data !== 'undefined' && data.length > 0)
            {

                res.status(200).json( {"data": data});

            }
            //Get Error
            else
            {
                res.status(404).json( {"msg": "notExist"});
            }
        });
    }
    //Id must be numeric
    else
    {
        res.status(500).json( {"msg": "The id must be numeric"});
    }
});

/* Get mac by  name and  */
router.get('/:interface/mac/name/:name', function (req, res)
{
    var interface = req.params.interface;
    var name = req.params.name;
    //
    if (name.length>0)
    {
        MacModel.getMacName(interface,name, function (error, data)
        {
            //If exists mac get data
            if (typeof data !== 'undefined' && data.length > 0)
            {
                res.status(200).json( {"data": data});

            }
            //Get Error
            else
            {
                res.status(404).json( {"msg": "notExist"});
            }
        });
    }
    //Id must be numeric
    else
    {
        res.status(500).json( {"msg": "The id must be numeric"});
    }
});



/* Remove mac */
router.delete("/mac/", function (req, res)
{
    //Id from mac to remove
    var id = req.param('id');
    var interface = req.param('interface');
    MacModel.deleteMac(interface,id, function (error, data)
    {
        if (data && data.msg === "deleted" || data.msg === "notExist")
        {
            //res.redirect("/macs/");
            res.status(200).json( data.msg);
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

module.exports = router;