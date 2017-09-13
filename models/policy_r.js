var db = require('../db.js');
var async = require('async');


//create object
var policy_rModel = {};
var tableModel = "policy_r";
var Policy_positionModel = require('../models/policy_position');
var Policy_r__ipobjModel = require('../models/policy_r__ipobj');
var IpobjModel = require('../models/ipobj');
var InterfaceModel = require('../models/interface');
var data_policy_r = require('../models/data_policy_r');
var data_policy_positions = require('../models/data_policy_positions');
var data_policy_position_ipobjs = require('../models/data_policy_position_ipobjs');


/**
* Property Logger to manage App logs
*
* @property logger
* @type log4js/app
* 
*/
var logger = require('log4js').getLogger("app");


//Get All policy_r by firewall and group
policy_rModel.getPolicy_rs = function (idfirewall, idgroup, callback) {

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var whereGroup = '';
        if (idgroup !== '') {
            whereGroup = ' AND idgroup=' + connection.escape(idgroup);
        }
        var sql = 'SELECT * FROM ' + tableModel + ' WHERE firewall=' + connection.escape(idfirewall) + whereGroup + ' ORDER BY rule_order';
        connection.query(sql, function (error, rows) {
            if (error)
                callback(error, null);
            else
                callback(null, rows);
        });
    });
};

//Get All policy_r by firewall and type
policy_rModel.getPolicy_rs_type = function (idfirewall, type, rule, AllDone) {

    var rule_type;
    switch (type) {
        case "I" :
            rule_type = "I";
            break;
        case "O":
            rule_type = "O";
            break;
        case "F":
            rule_type = "F";
            break;
        case "N":
            rule_type = "N";
            break;
        default:
            rule_type = "I";
            break;
    }
    var policy = [];
    var policy_cont = 0;
    var position_cont = 0;
    var ipobj_cont = 0;
    var i, j, k;
    var sqlRule = "";



    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        if (rule !== "") {
            sqlRule = " AND id=" + connection.escape(rule);
        }

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE firewall=' + connection.escape(idfirewall) + ' AND  type= ' + connection.escape(type) + sqlRule + ' ORDER BY rule_order';
        //logger.debug(sql);
        connection.query(sql, function (error, rows) {
            if (error)
                AllDone(error, null);
            else {
                if (rows.length > 0) {
                    i = 0;
                    policy_cont = rows.length;
                    //for (i = 0; i < rows.length; i++) {
                    //--------------------------------------------------------------------------------------------------
                    async.map(rows, function (row_rule, callback1) {
                        i++;
                        var policy_node = new data_policy_r(row_rule);


                        var rule_id = row_rule.id;
                        //logger.debug(i + " ---> DENTRO de REGLA: " + rule_id);

                        //Buscamos POSITIONS de REGLA
                        Policy_positionModel.getPolicy_positionsType(type, function (error, data_positions)
                        {
                            //If exists policy_position get data
                            if (typeof data_positions !== 'undefined')
                            {
                                //logger.debug("REGLA: " + rule_id + "  POSITIONS: " + data_positions.length);
                                j = 0;
                                //for (j = 0; j < data_positions.length; j++) {

                                position_cont = data_positions.length;
                                policy_node.positions = new Array();

                                //--------------------------------------------------------------------------------------------------
                                async.map(data_positions, function (row_position, callback2) {
                                    j++;
                                    logger.debug(j + " - DENTRO de POSITION: " + row_position.id + " - " + row_position.name + "     ORDER:" + row_position.position_order);
                                    var position_node = new data_policy_positions(row_position);

                                    //Buscamos IPOBJS por POSITION
                                    Policy_r__ipobjModel.getPolicy_r__ipobjs_interfaces_position(rule_id, row_position.id, function (error, data__rule_ipobjs)
                                    {
                                        //logger.debug(" IPOBJS PARA POSITION:" + row_position.id + " --> " + data__rule_ipobjs.length);
                                        //If exists policy_r__ipobj get data
                                        //if (typeof data__rule_ipobjs !== 'undefined' && data__rule_ipobjs.length > 0)
                                        if (typeof data__rule_ipobjs !== 'undefined')
                                        {

                                            //obtenemos IPOBJS o INTERFACES
                                            k = 0;
                                            //for (k = 0; k < data__rule_ipobjs.length; k++) {
                                            ipobj_cont = data__rule_ipobjs.length;
                                            //creamos array de ipobj
                                            position_node.ipobjs = new Array();
                                            //--------------------------------------------------------------------------------------------------
                                            async.map(data__rule_ipobjs, function (row_ipobj, callback3) {
                                                k++;
                                                logger.debug("BUCLE REGLA:" + rule_id + "  POSITION:" + row_position.id + "  IPOBJ ID: " + row_ipobj.ipobj + "  INTERFACE:" + row_ipobj.interface + "   ORDER:" + row_ipobj.position_order + "  NEGATE:" + row_ipobj.negate);
                                                if (row_ipobj.ipobj > 0 && row_ipobj.type==='O') {
                                                    IpobjModel.getIpobj(row_ipobj.ipobj, function (error, data_ipobjs)
                                                    {
                                                        //If exists ipobj get data
                                                        if (typeof data_ipobjs !== 'undefined' && data_ipobjs.length>0)
                                                        {
                                                            var ipobj = data_ipobjs[0];
                                                            var ipobj_node = new data_policy_position_ipobjs(ipobj, row_ipobj.position_order, row_ipobj.negate, true);
                                                            //Añadimos ipobj a array de position
                                                            position_node.ipobjs.push(ipobj_node);

                                                            callback3();
                                                        }
                                                        //Get Error
                                                        else
                                                        {
                                                            logger.debug("ERROR getIpobj: " + error);
                                                            callback3();
                                                        }
                                                    });
                                                }
                                                else if (row_ipobj.interface > 0 || row_ipobj.type==='I') {
                                                    var idInterface=row_ipobj.interface;
                                                    if (row_ipobj.type==='I')
                                                            idInterface=row_ipobj.ipobj;
                                                    InterfaceModel.getInterface(idfirewall,idInterface,function (error, data_interface)                                                    
                                                    {                                                        
                                                        if (typeof data_interface !== 'undefined')
                                                        {
                                                            var interface = data_interface[0];
                                                            //logger.debug(interface);
                                                            var ipobj_node = new data_policy_position_ipobjs(interface, row_ipobj.position_order, row_ipobj.negate, false);
                                                            //Añadimos ipobj a array de position
                                                            position_node.ipobjs.push(ipobj_node);

                                                            callback3();
                                                        }
                                                        //Get Error
                                                        else
                                                        {
                                                            logger.debug("ERROR getInterface: " + error);
                                                            callback3();
                                                        }
                                                    });
                                                }
                                                else{
                                                    callback3();
                                                }
                                            }, //Fin de bucle de IPOBJS
                                                    function (err) {
                                                        //logger.debug("añadiendo IPOBJS: " + ipobj_cont + "   IPOBJS_COUNT:" + position_node.ipobjs.length);
                                                        //logger.debug("-------------------------Añadiendo IPOBJS  en Regla:" + rule_id + "  Position:" + row_position.id);
                                                        //logger.debug(position_node);
                                                        policy_node.positions.push(position_node);

                                                        if (policy_node.positions.length >= position_cont) {
                                                            
                                                            policy_node.positions.sort(function(a, b){
                                                                return a.position_order-b.position_order;
                                                            });                                                            
                                                            policy.push(policy_node);
                                                            //logger.debug("------------------Añadiendo POLICY_NODE  en Regla:" + rule_id + "  Position:" + row_position.id);
                                                            if (policy.length >= policy_cont) {
                                                                //logger.debug("-------------------- HEMOS LLLEGADO aL FINAL BUCLE 3----------------");
                                                                
                                                                AllDone(null, policy);
                                                            }
                                                        }

                                                    });
                                        }

                                    });

                                    callback2();

                                }, //Fin de bucle Positions                                
                                        function (err) {
                                            //logger.debug("J=" + j + " ---------- FINAL BUCLE 2 --------");
                                            //logger.debug('iterating2 done   CONT=' + policy_cont);
//                                            if (err)
//                                                callback2(err, null);
//                                            else
//                                                callback2(null, policy);

                                            //logger.debug("añadiendo POLICY NODE");
                                            //policy.push(policy_node);
                                            //logger.debug("LENGHT E2: " + policy.length);
                                            if (policy.length >= policy_cont) {
                                                //logger.debug("-------------------- HEMOS LLLEGADO aL FINAL BUCLE 2   con I=" + i + " - J=" + j + " - K=" + k);
                                            }
                                        });


                                //logger.debug(policy);


                            }
                            //Get Error
                            else
                            {
                                logger.debug("ERROR getPolicy_positionsType: " + error);
                            }
                        });

                        callback1();


                    }, //Fin de bucle Reglas                    
                            function (err) {
                                //logger.debug("---------- FINAL BUCLE 1 --------");
                            });
                } else {
                    //NO existe regla
                    logger.debug("NO HAY REGLAS");
                    AllDone("", null);
                }

            }
        });
    });
};


//Get policy_r by  id  and firewall
policy_rModel.getPolicy_r = function (idfirewall, id, callback) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE id = ' + connection.escape(id) + ' AND firewall=' + connection.escape(idfirewall);
        connection.query(sql, function (error, row) {
            if (error)
                callback(error, null);
            else
                callback(null, row);
        });
    });
};

//Get routing by name and firewall and group
policy_rModel.getPolicy_rName = function (idfirewall, idgroup, name, callback) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var namesql = '%' + name + '%';
        var whereGroup = '';
        if (idgroup !== '') {
            whereGroup = ' AND group=' + connection.escape(idgroup);
        }
        var sql = 'SELECT * FROM ' + tableModel + ' WHERE name like  ' + connection.escape(namesql) + ' AND firewall=' + connection.escape(idfirewall) + whereGroup;
        logger.debug(sql);
        connection.query(sql, function (error, row) {
            if (error)
                callback(error, null);
            else
                callback(null, row);
        });
    });
};



//Add new policy_r from user
policy_rModel.insertPolicy_r = function (policy_rData, callback) {
    OrderList(policy_rData.rule_order, policy_rData.firewall, 999999);
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        connection.query('INSERT INTO ' + tableModel + ' SET ?', policy_rData, function (error, result) {
            if (error) {
                logger.debug(error);
                callback(error, null);
            } else {
                //devolvemos la última id insertada
                callback(null, {"insertId": result.insertId});
            }
        });
    });
};

//Update policy_r from user
policy_rModel.updatePolicy_r = function (old_order, policy_rData, callback) {

    OrderList(policy_rData.rule_order, policy_rData.firewall, old_order);

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var sql = 'UPDATE ' + tableModel + ' SET ' +
                'idgroup = ' + connection.escape(policy_rData.idgroup) + ',' +
                'firewall = ' + connection.escape(policy_rData.firewall) + ',' +
                'rule_order = ' + connection.escape(policy_rData.rule_order) + ',' +
                'action = ' + connection.escape(policy_rData.action) + ',' +
                'time_start = ' + connection.escape(policy_rData.time_start) + ',' +
                'time_end = ' + connection.escape(policy_rData.time_end) + ',' +
                'options = ' + connection.escape(policy_rData.options) + ',' +
                'active = ' + connection.escape(policy_rData.active) + ',' +
                'comment = ' + connection.escape(policy_rData.comment) + ', ' +
                'type = ' + connection.escape(policy_rData.type) + ' ' +
                ' WHERE id = ' + policy_rData.id;
        logger.debug(sql);
        connection.query(sql, function (error, result) {
            if (error) {
                logger.error(error);
                callback(error, null);
            } else {
                callback(null, {"msg": "success"});
            }
        });
    });
};

//Update ORDER de policy_r 
policy_rModel.updatePolicy_r_order = function (idfirewall, id, rule_order, old_order, callback) {

    OrderList(rule_order, idfirewall, old_order);

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var sql = 'UPDATE ' + tableModel + ' SET ' +
                'rule_order = ' + connection.escape(rule_order) + ' ' +
                ' WHERE id = ' + id;

        connection.query(sql, function (error, result) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, {"msg": "success"});
            }
        });
    });
};

function OrderList(new_order, idfirewall, old_order) {
    var increment = '+1';
    var order1 = new_order;
    var order2 = old_order;
    if (new_order > old_order) {
        increment = '-1';
        order1 = old_order;
        order2 = new_order;
    }

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var sql = 'UPDATE ' + tableModel + ' SET ' +
                'rule_order = rule_order' + increment +
                ' WHERE firewall = ' + connection.escape(idfirewall) +
                ' AND rule_order>=' + order1 + ' AND rule_order<=' + order2;
        connection.query(sql);

    });

}
;

//Remove policy_r with id to remove
policy_rModel.deletePolicy_r = function (idfirewall, id, rule_order, callback) {
    OrderList(999999, idfirewall, rule_order);
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var sqlExists = 'SELECT * FROM ' + tableModel + '  WHERE id = ' + connection.escape(id) + ' AND firewall=' + connection.escape(idfirewall);
        connection.query(sqlExists, function (error, row) {
            //If exists Id from policy_r to remove
            if (row) {
                db.get(function (error, connection) {
                    var sql = 'DELETE FROM ' + tableModel + ' WHERE id = ' + connection.escape(id);
                    connection.query(sql, function (error, result) {
                        if (error) {
                            callback(error, null);
                        } else {
                            callback(null, {"msg": "deleted"});
                        }
                    });
                });
            } else {
                callback(null, {"msg": "notExist"});
            }
        });
    });
};

//Export the object
module.exports = policy_rModel;