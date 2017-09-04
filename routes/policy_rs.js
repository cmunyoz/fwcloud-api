var express = require('express');
var router = express.Router();
var Policy_rModel = require('../models/policy_r');


/**
* Property Logger to manage App logs
*
* @property logger
* @type log4js/app
* 
*/
var logger = require('log4js').getLogger("app");

/* Show form */
router.get('/policy-r', function (req, res)
{
    res.render('new_policy_r', {title: 'Crear nuevo policy_r'});
});

/* Get all policy_rs by firewall and group*/
router.get('/:idfirewall/group/:idgroup', function (req, res)
{
    var idfirewall = req.params.idfirewall;
    var idgroup = req.params.idgroup;
    Policy_rModel.getPolicy_rs(idfirewall,idgroup,function (error, data)
    {
        //If exists policy_r get data
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
/* Get all policy_rs by firewall and type */
router.get('/:idfirewall/type/:type', function (req, res)
{
    var idfirewall = req.params.idfirewall;    
    var type = req.params.type;    
    var rule="";
    logger.debug("MOSTRANDO POLICY para firewall: " + idfirewall);
    Policy_rModel.getPolicy_rs_type(idfirewall,type,rule,function (error, data)
    {
        //If exists policy_r get data
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
/* Get all policy_rs by firewall and type and Rule */
router.get('/:idfirewall/type/:type/rule/:rule', function (req, res)
{
    var idfirewall = req.params.idfirewall;    
    var type = req.params.type;    
    var rule = req.params.rule;    
    
    logger.debug("MOSTRANDO POLICY para firewall: " + idfirewall + " REGLA: " + rule);
    logger.debug("MOSTRANDO POLICY para firewall: " + idfirewall + " REGLA: " + rule);
    Policy_rModel.getPolicy_rs_type(idfirewall,type,rule,function (error, data)
    {
        //If exists policy_r get data
        if (data !== null)
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

/* Get  policy_r by id and  by Id */
router.get('/:idfirewall/:id', function (req, res)
{
    var idfirewall = req.params.idfirewall;
    var id = req.params.id;
    
    Policy_rModel.getPolicy_r(idfirewall,id,function (error, data)
    {
        //If exists policy_r get data
        if (typeof data !== 'undefined')
        {
//            res.render("update_policy_r",{ 
//                    title : "FWBUILDER", 
//                    info : data
//                });  
            res.status(200).json( {"data": data});
        }
        //Get Error
        else
        {
            res.status(404).json( {"msg": "notExist"});
        }
    });
});

/* Get all policy_rs by nombre and by firewall*/
router.get('/:idfirewall/group/:idgroup/name/:name', function (req, res)
{
    var idfirewall = req.params.idfirewall;
    var name = req.params.name;
    var idgroup = req.params.idgroup;
    Policy_rModel.getPolicy_rName(idfirewall,idgroup,name,function (error, data)
    {
        //If exists policy_r get data
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





/* Create New policy_r */
router.post("/policy-r", function (req, res)
{
    //Create New objet with data policy_r
    var policy_rData = {
        id: null,
        idgroup: req.body.idgroup,
        firewall: req.body.firewall,        
        rule_order: req.body.rule_order,        
        action: req.body.action,
        time_start: req.body.time_start,
        time_end: req.body.time_end,
        active: req.body.active,
        options: req.body.options,
        comment: req.body.comment,
        type: req.body.type        
    };
    
    Policy_rModel.insertPolicy_r(policy_rData, function (error, data)
    {
        //If saved policy_r Get data
        if (data && data.insertId)
        {
            //res.redirect("/policy-rs/policy-r/" + data.insertId);
            res.status(200).json( {"insertId": data.insertId});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

/* Update policy_r that exist */
router.put('/policy-r/', function (req, res)
{
    //Save data into object
    var policy_rData = {id: req.param('id'), idgroup: req.param('idgroup'), firewall: req.param('firewall'),  rule_order: req.param('rule_order'),   options: req.param('options'), action: req.param('action'), time_start: req.param('time_start'), time_end: req.param('time_end'), comment: req.param('comment'), active: req.param('active'), type: req.param('type')};
    var old_order=req.param('old_order');
    Policy_rModel.updatePolicy_r(old_order,policy_rData, function (error, data)
    {
        //If saved policy_r saved ok, get data
        if (data && data.msg)
        {
            //res.redirect("/policy-rs/policy-r/" + req.param('id'));
            res.status(200).json( {"data": data.msg});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

/* Update ORDER de policy_r that exist */
router.put('/policy-r/', function (req, res)
{
    //Save data into object
    var idfirewall = req.param('idfirewall');
    var id = req.param('id');
    var rule_order = req.param('rule_order');    
    var old_order=req.param('old_order');
    
    Policy_rModel.updatePolicy_r_order(idfirewall,id, rule_order, old_order, function (error, data)
    {
        //If saved policy_r saved ok, get data
        if (data && data.msg)
        {
            //res.redirect("/policy-rs/policy-r/" + req.param('id'));
            res.status(200).json( {"data": data.msg});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});



/* Remove policy_r */
router.delete("/policy-r/", function (req, res)
{
    //Id from policy_r to remove
    var idfirewall = req.param('idfirewall');
    var id = req.param('id');
    var rule_order = req.param('rule_order');
    Policy_rModel.deletePolicy_r(idfirewall,id, function (error, data)
    {
        if (data && data.msg === "deleted" || data.msg === "notExist")
        {
            //res.redirect("/policy-rs/");
            res.status(200).json( {"data": data.msg});
        } else
        {
            res.status(500).json( {"msg": error});
        }
    });
});

module.exports = router;