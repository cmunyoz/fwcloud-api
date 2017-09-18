var db = require('../db.js');
var async = require('async');

/**
 * Property Logger to manage App logs
 *
 * @property logger
 * @type log4js/app
 * 
 */
var logger = require('log4js').getLogger("app");

//create object
var fwc_treeModel = {};


var tableModel = "fwc_tree";
//var Node = require("tree-node");
var Tree = require('easy-tree');
var fwc_tree_node = require("./fwc_tree_node.js");


//Get fwc_tree by  id 
fwc_treeModel.getFwc_TreeId = function (iduser, id, callback) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE id = ' + connection.escape(id);
        connection.query(sql, function (error, row) {
            if (error)
                callback(error, null);
            else
                callback(null, row);
        });
    });
};

//Get FLAT TREE by user
fwc_treeModel.getFwc_TreeUser = function (iduser, callback) {

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE  id_user=' + connection.escape(iduser) + ' ORDER BY id_parent,node_order';

        connection.query(sql, function (error, rows) {
            if (error)
                callback(error, null);
            else
                callback(null, rows);
        });
    });
};

//Get firewall node by folder
fwc_treeModel.getFwc_TreeUserFolder = function (iduser, foldertype, callback) {

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE  id_user=' + connection.escape(iduser) + '  AND node_type=' + connection.escape(foldertype) + ' AND id_parent=0 ORDER BY id limit 1';

        connection.query(sql, function (error, rows) {
            if (error)
                callback(error, null);
            else
                callback(null, rows);
        });
    });
};

//Get firewall node ID
fwc_treeModel.getFwc_TreeId = function (iduser, id, callback) {

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE  id_user=' + connection.escape(iduser) + '  AND id=' + connection.escape(id);

        connection.query(sql, function (error, rows) {
            if (error)
                callback(error, null);
            else
                callback(null, rows);
        });
    });
};
//Get COMPLETE TREE by user
fwc_treeModel.getFwc_TreeUserFull = function (iduser, idparent, tree, objs, objc, AllDone) {

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        //FALTA CONTROLAR EN QUE FWCLOUD ESTA EL USUARIO
        var sqlfwcloud = "";
        if (objs === '1' && objc === '0')
            sqlfwcloud = " AND (fwcloud is null OR id_obj is null) ";   //Only Standard objects
        else if (objs === '0' && objc === '1')
            sqlfwcloud = " AND (fwcloud is not null OR id_obj is null) ";   //Only fwcloud objects


        //Get ALL CHILDREN NODES FROM idparent
        var sql = 'SELECT * FROM ' + tableModel + ' WHERE  id_user=' + connection.escape(iduser) + ' AND id_parent=' + connection.escape(idparent) + sqlfwcloud + ' ORDER BY node_order';

        connection.query(sql, function (error, rows) {
            if (error)
                callback(error, null);
            else {

                if (rows) {
                    //logger.debug("---> DENTRO de PADRE: " + idparent);

                    async.forEachSeries(rows,
                            function (row, callback) {
                                hasLines(row.id, function (t) {
                                    //logger.debug(row);
                                    var tree_node = new fwc_tree_node(row);
                                    if (!t) {
                                        //Añadimos nodo hijo

                                        //logger.debug("--->  AÑADIENDO NODO FINAL " + row.id + " con PADRE: " + idparent);

                                        tree.append([], tree_node);

                                        callback();
                                    } else {
                                        //dig(row.tree_id, treeArray, callback);
                                        //logger.debug("--->  AÑADIENDO NODO PADRE " + row.id + " con PADRE: " + idparent);
                                        //logger.debug("-------> LLAMANDO A HIJO: " + row.id);

                                        var treeP = new Tree(tree_node);
                                        tree.append([], treeP);
                                        fwc_treeModel.getFwc_TreeUserFull(iduser, row.id, treeP, objs, objc, callback);
                                    }
                                });
                            },
                            function (err) {
                                if (err)
                                    AllDone(err, tree);
                                else
                                    AllDone(null, tree);
                            });
                } else
                    AllDone(null, tree);
            }
        });

    });
};

//Get TREE by User and Parent
fwc_treeModel.getFwc_TreeUserParent = function (iduser, idparent, callback) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE id_user = ' + connection.escape(iduser) + ' AND id_parent=' + connection.escape(idparent);
        connection.query(sql, function (error, row) {
            if (error)
                callback(error, null);
            else
                callback(null, row);
        });
    });
};

//Get NODES by name 
fwc_treeModel.getFwc_TreeName = function (iduser, name, callback) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var namesql = '%' + name + '%';

        var sql = 'SELECT * FROM ' + tableModel + ' WHERE id_user = ' + connection.escape(iduser) + " AND name like " + connection.escape(namesql);

        connection.query(sql, function (error, row) {
            if (error)
                callback(error, null);
            else
                callback(null, row);
        });
    });
};

//FALTA CONTROLAR OBJETOS IP en INTERFACE DE TIPO <> 5
//Add new TREE FIREWALLS from user
fwc_treeModel.insertFwc_Tree_firewalls = function (iduser, folder, AllDone) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        //DELETE PREVIUS DATA
        sqldelete = "delete from fwc_tree where id>39";
        connection.query(sqldelete, function (error, result) {
            if (error) {
                AllDone(error, null);
            } else {

                //Select Parent Node by type   
                sql = 'SELECT T1.* FROM ' + tableModel + ' T1  where T1.node_type=' + connection.escape(folder) + ' and T1.id_parent=0 AND T1.id_user=' + connection.escape(iduser) + ' order by T1.node_order';
                //logger.debug(sql);
                connection.query(sql, function (error, rows) {
                    if (error) {
                        AllDone(error, null);
                    } else {
                        //For each node Select Objects by  type
                        if (rows) {
                            async.forEachSeries(rows, function (row, callback) {
                                //logger.debug(row);
                                //logger.debug("---> DENTRO de NODO: " + row.name + " - " + row.node_type);
                                var tree_node = new fwc_tree_node(row);
                                //Añadimos nodos hijos tipo firewall
                                sqlnodes = 'SELECT  F.id,F.name,F.fwcloud, F.comment FROM firewall F inner join user__firewall U on U.id_firewall=F.id and U.id_user=' + connection.escape(iduser);
                                //logger.debug(sqlnodes);
                                connection.query(sqlnodes, function (error, rowsnodes) {
                                    if (error)
                                        callback(error, null);
                                    else {
                                        var i = 0;
                                        if (rowsnodes) {
                                            async.forEachSeries(rowsnodes, function (rnode, callback2) {
                                                var idfirewall = rnode.id;
                                                i++;
                                                //Insertamos nodos Firewall
                                                sqlinsert = 'INSERT INTO ' + tableModel +
                                                        '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, `subfolders`, id_obj,obj_type,fwcloud) ' +
                                                        ' VALUES (' +
                                                        connection.escape(iduser) + ',' + connection.escape(rnode.name) + ',' +
                                                        connection.escape(rnode.comment) + ',' + connection.escape(row.id) + ',' +
                                                        i + ',' + (row.node_level + 1) + ',"FW",' +
                                                        '0,0,' + connection.escape(rnode.id) + ',0,' +
                                                        connection.escape(rnode.fwcloud) + ")";
                                                //logger.debug(sqlinsert);
                                                var parent_firewall;
                                                connection.query(sqlinsert, function (error, result) {
                                                    if (error) {
                                                        logger.debug("ERROR FIREWALL INSERT : " + rnode.id + " - " + rnode.name + " -> " + error);
                                                    } else {
                                                        //logger.debug("INSERT FIREWALL OK NODE: " + rnode.id + " - " + rnode.name);
                                                        parent_firewall = result.insertId;

                                                        //Insertamos nodo POLICY IN
                                                        sqlinsert = 'INSERT INTO ' + tableModel + '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, subfolders, id_obj,obj_type,fwcloud) ' +
                                                                ' VALUES (' + connection.escape(iduser) + ',"Policy IN","",' + parent_firewall + ',1,' + (row.node_level + 2) + ',"PI",0,0,null,null,' + connection.escape(rnode.fwcloud) + ")";
                                                        connection.query(sqlinsert, function (error, result) {
                                                            if (error)
                                                                logger.debug("ERROR PI : " + error);
                                                        });
                                                        //Insertamos nodo POLICY OUT
                                                        sqlinsert = 'INSERT INTO ' + tableModel + '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, subfolders, id_obj,obj_type,fwcloud) ' +
                                                                ' VALUES (' + connection.escape(iduser) + ',"Policy OUT","",' + parent_firewall + ',2,' + (row.node_level + 2) + ',"PO",0,0,null,null,' + connection.escape(rnode.fwcloud) + ")";
                                                        connection.query(sqlinsert, function (error, result) {
                                                            if (error)
                                                                logger.debug("ERROR PO : " + error);
                                                        });
                                                        //Insertamos nodo POLICY FORWARD
                                                        sqlinsert = 'INSERT INTO ' + tableModel + '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, subfolders, id_obj,obj_type,fwcloud) ' +
                                                                ' VALUES (' + connection.escape(iduser) + ',"Policy FORWARD","",' + parent_firewall + ',3,' + (row.node_level + 2) + ',"PF",0,0,null,null,' + connection.escape(rnode.fwcloud) + ")";
                                                        connection.query(sqlinsert, function (error, result) {
                                                            if (error)
                                                                logger.debug("ERROR PF: " + error);
                                                        });
                                                        //Insertamos nodo NAT
                                                        sqlinsert = 'INSERT INTO ' + tableModel + '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, subfolders, id_obj,obj_type,fwcloud) ' +
                                                                ' VALUES (' + connection.escape(iduser) + ',"NAT","",' + parent_firewall + ',4,' + (row.node_level + 2) + ',"NAT",0,0,null,null,' + connection.escape(rnode.fwcloud) + ")";
                                                        connection.query(sqlinsert, function (error, result) {
                                                            if (error)
                                                                logger.debug("ERROR NAT: " + error);
                                                        });
                                                        //Insertamos nodo ROUTING
                                                        sqlinsert = 'INSERT INTO ' + tableModel + '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, subfolders, id_obj,obj_type,fwcloud) ' +
                                                                ' VALUES (' + connection.escape(iduser) + ',"Routing","",' + parent_firewall + ',4,' + (row.node_level + 2) + ',"RR",0,0,null,null,' + connection.escape(rnode.fwcloud) + ")";
                                                        connection.query(sqlinsert, function (error, result) {
                                                            if (error)
                                                                logger.debug("ERROR RR : " + error);
                                                        });

                                                        var nodeInterfaces;
                                                        //Insertamos nodo INTERFACES FIREWALL
                                                        sqlinsert = 'INSERT INTO ' + tableModel + '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, subfolders, id_obj,obj_type,fwcloud) ' +
                                                                ' VALUES (' + connection.escape(iduser) + ',"Interfaces","",' + parent_firewall + ',5,' + (row.node_level + 2) + ',"FDI",0,0,null,10,' + connection.escape(rnode.fwcloud) + ")";
                                                        connection.query(sqlinsert, function (error, result) {
                                                            if (error)
                                                                logger.debug("ERROR FDI: " + error);
                                                            else
                                                                nodeInterfaces = result.insertId;
                                                        });


                                                        //Insertamos nodos hijos Interface
                                                        sqlInt = 'SELECT  id,name,labelName FROM interface where interface_type=10 AND  firewall=' + connection.escape(idfirewall);
                                                        connection.query(sqlInt, function (error, rowsnodesInt) {
                                                            if (error) {
                                                                logger.debug("Error Select interface");
                                                                callback2(error, null);
                                                            } else {
                                                                var j = 0;
                                                                if (rowsnodesInt) {
                                                                    logger.debug("INTERFACES: " + rowsnodesInt.length);
                                                                    async.forEachSeries(rowsnodesInt, function (rnodeInt, callback3) {
                                                                        j++;
                                                                        //Insertamos nodos Interfaces
                                                                        sqlinsert = 'INSERT INTO ' + tableModel +
                                                                                '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, `subfolders`, id_obj,obj_type,fwcloud) ' +
                                                                                ' VALUES (' +
                                                                                connection.escape(iduser) + ',' + connection.escape(rnodeInt.name) + ',' +
                                                                                connection.escape(rnodeInt.comment) + ',' + connection.escape(nodeInterfaces) + ',' +
                                                                                j + ',' + (row.node_level + 3) + ',"IFF",' +
                                                                                '0,0,' + connection.escape(rnodeInt.id) + ',10,' +
                                                                                connection.escape(rnode.fwcloud) + ")";

                                                                        connection.query(sqlinsert, function (error, result) {
                                                                            var idinterface;
                                                                            if (error) {
                                                                                logger.debug("ERROR INTERFACE INSERT : " + rnodeInt.id + " - " + rnodeInt.name + " -> " + error);
                                                                            } else {
                                                                                logger.debug("INSERT INTERFACE OK NODE: " + rnodeInt.id + " - " + rnodeInt.name);
                                                                                idinterface = result.insertId;
                                                                            }
                                                                            //Insertamos objetos IP de Interface
                                                                            //Insertamos nodos Interface
                                                                            sqlnodesIP = 'SELECT  O.id,O.name,O.type,O.fwcloud, O.comment, T.node_type FROM ipobj O inner join fwc_tree_node_types T on  T.obj_type=O.type where O.interface=' + connection.escape(rnodeInt.id);
                                                                            logger.debug(sqlnodesIP);
                                                                            connection.query(sqlnodesIP, function (error, rowsnodesIP) {
                                                                                if (error) {
                                                                                    logger.debug(error);
                                                                                } else {
                                                                                    var k = 0;
                                                                                    if (rowsnodesIP) {
                                                                                        logger.debug("OBJS IP: " + rowsnodesIP.length);
                                                                                        async.forEachSeries(rowsnodesIP, function (rnodeIP, callback4) {
                                                                                            k++;
                                                                                            //Insertamos nodos IP
                                                                                            sqlinsert = 'INSERT INTO ' + tableModel +
                                                                                                    '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, `subfolders`, id_obj,obj_type,fwcloud) ' +
                                                                                                    ' VALUES (' +
                                                                                                    connection.escape(iduser) + ',' + connection.escape(rnodeIP.name) + ',' +
                                                                                                    connection.escape(rnodeIP.comment) + ',' + connection.escape(idinterface) + ',' +
                                                                                                    k + ',' + (row.node_level + 4) + ',' + connection.escape(rnodeIP.node_type) + ',' +
                                                                                                    '0,0,' + connection.escape(rnodeIP.id) + ',5,' +
                                                                                                    connection.escape(rnode.fwcloud) + ")";
                                                                                            connection.query(sqlinsert, function (error, result) {
                                                                                                if (error) {
                                                                                                    logger.debug("ERROR IP OBJECT INSERT : " + rnodeIP.id + " - " + rnodeIP.name + " -> " + error);
                                                                                                } else {
                                                                                                    logger.debug("INSERT IPOBJ OK NODE: " + rnodeIP.id + " - " + rnodeIP.name);
                                                                                                }
                                                                                            });
                                                                                            callback4();
                                                                                        }
                                                                                        );
                                                                                    }

                                                                                }
                                                                            });
                                                                        });
                                                                        callback3();
                                                                    }
                                                                    );
                                                                }

                                                            }

                                                        });



                                                    }

                                                });
                                                callback2();
                                            }
                                            );
                                        }
                                    }
                                });
                                callback();
                            },
                                    function (err) {
                                        if (err)
                                            AllDone(err, null);
                                        else
                                            AllDone(null, {"msg": "ok"});
                                    });
                        } else
                            AllDone(null, {"msg": "ok"});
                    }
                });
            }
        });
    });

};


//Add new TREE OBJECTS from user
fwc_treeModel.insertFwc_Tree_objects = function (iduser, folder, AllDone) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        //Select Parent Node by type   
        sql = 'SELECT T1.* FROM ' + tableModel + ' T1 inner join fwc_tree T2 on T1.id_parent=T2.id where T2.node_type=' + connection.escape(folder) + ' and T2.id_parent=0 AND T1.id_user=' + connection.escape(iduser) + ' order by T1.node_order';
        logger.debug(sql);
        connection.query(sql,
                function (error, rows) {
                    if (error) {
                        callback(error, null);
                    } else {
                        //For each node Select Objects by  type
                        if (rows) {
                            async.forEachSeries(rows,
                                    function (row, callback) {
                                        //logger.debug(row);
                                        logger.debug("---> DENTRO de NODO: " + row.name + " - Node_Type:" + row.node_type + "  Obj_type:" + row.obj_type);
                                        var tree_node = new fwc_tree_node(row);
                                        //Añadimos nodos hijos del tipo
                                        if (row.node_type === "OIG" || row.node_type === "SOG") {
                                            sqlnodes = 'SELECT  id,name,type,fwcloud, comment FROM ipobj_g  where type=' + row.obj_type;
                                        } else
                                            sqlnodes = 'SELECT  id,name,type,fwcloud, comment FROM ipobj  where type=' + row.obj_type + ' AND interface is null';

                                        logger.debug(sqlnodes);
                                        connection.query(sqlnodes, function (error, rowsnodes) {
                                            if (error)
                                                callback(error, null);
                                            else {
                                                var i = 0;
                                                if (rowsnodes) {
                                                    async.forEachSeries(rowsnodes,
                                                            function (rnode, callback) {
                                                                i++;
                                                                //Insertamos nodo
                                                                sqlinsert = 'INSERT INTO ' + tableModel +
                                                                        '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, `subfolders`, id_obj,obj_type,fwcloud) ' +
                                                                        ' VALUES (' +
                                                                        connection.escape(iduser) + ',' + connection.escape(rnode.name) + ',' +
                                                                        connection.escape(rnode.comment) + ',' + connection.escape(row.id) + ',' +
                                                                        i + ',' + (row.node_level + 1) + ',' + connection.escape(row.node_type) + ',' +
                                                                        '0,0,' + connection.escape(rnode.id) + ',' + connection.escape(rnode.type) + ',' +
                                                                        connection.escape(rnode.fwcloud) + ")";
                                                                if (row.node_type === "OIG" || row.node_type === "SOG")
                                                                    logger.debug(sqlinsert);
                                                                connection.query(sqlinsert, function (error, result) {
                                                                    if (error) {
                                                                        logger.debug("ERROR INSERT : " + rnode.id + " - " + rnode.name + " Type: " + rnode.type + " --> " + error);

                                                                    } else {
                                                                        var NodeId = result.insertId;
                                                                        logger.debug("INSERT OK NODE Group: " + rnode.id + " - " + rnode.name + "  Type: " + rnode.type + "  NodeId:" + NodeId);
                                                                        //INSERT OBJECTS FROM GROUPS
                                                                        if (row.node_type === "OIG" || row.node_type === "SOG") {
                                                                            sqlinsert = 'INSERT INTO ' + tableModel +
                                                                                    '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, `subfolders`, id_obj,obj_type,fwcloud) ' +
                                                                                    ' SELECT ' + connection.escape(iduser) + ',O.name, O.comment,' + connection.escape(NodeId) + ',1,' + (row.node_level + 2) + ',' +
                                                                                    ' T.node_type,0,0,O.id, O.type, O.fwcloud ' +
                                                                                    ' FROM fwcloud_db.ipobj O ' +
                                                                                    ' INNER JOIN ipobj__ipobjg G on O.id=G.ipobj ' +
                                                                                    ' inner join fwc_tree_node_types T on T.obj_type=O.type ' +
                                                                                    ' WHERE G.ipobj_g=' + rnode.id;
                                                                            logger.debug(sqlinsert);
                                                                            connection.query(sqlinsert, function (error, result) {
                                                                                if (error) {
                                                                                    logger.debug("ERROR INSERT GROUP OBJECTS: " + rnode.id + " - " + rnode.name + " Type: " + rnode.type + " --> " + error);
                                                                                } else {
                                                                                    logger.debug("INSERT OK GROUP CHILD NODE Objects: " + result.affectedRows);
                                                                                }
                                                                            });
                                                                        }
                                                                        //INSERT INTERFACES FROM  HOST
                                                                        else if (row.node_type === "OIH") {
                                                                            sqlnodes = 'SELECT  O.id,O.name,O.interface_type, O.comment, T.node_type FROM interface O ' +
                                                                                    ' inner join interface__ipobj F on F.interface=O.id ' +
                                                                                    ' inner join fwc_tree_node_types T on T.obj_type=O.interface_type ' +
                                                                                    ' WHERE F.ipobj=' + rnode.id;
                                                                            connection.query(sqlnodes, function (error, rowsnodesObj) {
                                                                                if (error)
                                                                                    logger.debug(error);
                                                                                else {
                                                                                    var j = 0;
                                                                                    async.forEachSeries(rowsnodesObj,
                                                                                            function (rnodeObj, callback2) {
                                                                                                j++;

                                                                                                sqlinsert = 'INSERT INTO ' + tableModel +
                                                                                                        '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, `subfolders`, id_obj,obj_type,fwcloud) ' +
                                                                                                        ' SELECT ' + connection.escape(iduser) + ',O.name, O.comment,' + connection.escape(NodeId) + ',1,' + (row.node_level + 2) + ',' +
                                                                                                        ' T.node_type,0,0,O.id, O.interface_type, ' + rnode.fwcloud +
                                                                                                        ' FROM fwcloud_db.interface O ' +
                                                                                                        ' inner join interface__ipobj F on F.interface=O.id ' +
                                                                                                        ' inner join fwc_tree_node_types T on T.obj_type=O.interface_type ' +
                                                                                                        ' WHERE F.ipobj=' + rnode.id + ' AND O.id=' + rnodeObj.id;
                                                                                                logger.debug(sqlinsert);
                                                                                                connection.query(sqlinsert, function (error, result) {
                                                                                                    if (error) {
                                                                                                        logger.debug("ERROR INSERT HOST INTERFACES: " + rnode.id + " - " + rnode.name + " Type: " + rnode.type + " --> " + error);
                                                                                                    } else {
                                                                                                        idNodeinterface = result.insertId;
                                                                                                        logger.debug("INSERT OK CHILD NODE HOST: " + rnode.id + " - " + rnode.name + "  INTERFACE:" + rnodeObj.id + " - " + rnodeObj.name);
                                                                                                        sqlinsertObj = 'INSERT INTO ' + tableModel +
                                                                                                                '(id_user, name, comment, id_parent, node_order,node_level, node_type, expanded, `subfolders`, id_obj,obj_type,fwcloud) ' +
                                                                                                                ' SELECT ' + connection.escape(iduser) + ',O.name, O.comment,' + connection.escape(idNodeinterface) + ',1,' + (row.node_level + 3) + ',' +
                                                                                                                ' T.node_type,0,0,O.id, O.type,O.fwcloud ' +
                                                                                                                ' FROM fwcloud_db.ipobj O ' +                                                                                                                
                                                                                                                ' inner join fwc_tree_node_types T on T.obj_type=O.type ' +
                                                                                                                ' WHERE  O.interface=' + rnodeObj.id;
                                                                                                        logger.debug(sqlinsertObj);
                                                                                                        connection.query(sqlinsertObj, function (error, result) {
                                                                                                            if (error) {
                                                                                                                logger.debug("ERROR INSERT HOST INTERFACES: " + rnode.id + " - " + rnode.name + " Type: " + rnode.type + " --> " + error);
                                                                                                            } else {
                                                                                                                logger.debug("INSERT OK CHILD  OBJ NODE HOST INTERFACE:" + rnodeObj.id + " - " + rnodeObj.name);

                                                                                                            }
                                                                                                        });


                                                                                                    }
                                                                                                });
                                                                                                callback2();
                                                                                            });
                                                                                }
                                                                            });
                                                                        }

                                                                    }
                                                                });
                                                                callback();
                                                            }

                                                    );
                                                }
                                            }
                                        });


                                        callback();
                                    },
                                    function (err) {
                                        if (err)
                                            AllDone(err, null);
                                        else
                                            AllDone(null, {"msg": "ok"});
                                    });
                        } else
                            AllDone(null, {"msg": "ok"});
                    }
                });
    });
};

//Add new NODE from user
fwc_treeModel.insertFwc_Tree = function (fwc_treeData, callback) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        connection.query('INSERT INTO ' + tableModel + ' SET ?', fwc_treeData, function (error, result) {
            if (error) {
                callback(error, null);
            } else {
                //devolvemos la última id insertada
                callback(null, {"insertId": result.insertId});
            }
        });
    });
};

//Add new NODE from IPOBJ or Interface
fwc_treeModel.insertFwc_TreeOBJ = function (iduser, fwcloud, node_parent, node_order, node_type, node_Data, callback) {

    var fwc_treeData = {
        id: null,
        id_user: iduser,
        name: node_Data.name,
        id_parent: node_parent,
        node_order: node_order,
        node_icon: null,
        expanded: 0,
        node_type: node_type,
        api_call: null,
        obj_type: node_Data.type,
        id_obj: node_Data.id,
        node_level: 0,
        fwcloud: fwcloud,
        comment: node_Data.comment
    };

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        connection.query('INSERT INTO ' + tableModel + ' SET ?', fwc_treeData, function (error, result) {
            if (error) {
                callback(error, null);
            } else {
                if (result.affectedRows > 0) {
                    logger.debug("Insertado nuevo NODO id:" + result.insertId);
                    //devolvemos la última id insertada
                    callback(null, {"insertId": result.insertId});
                } else
                    callback(null, {"insertId": 0});
            }
        });
    });
};

//Update NODE from user
fwc_treeModel.updateFwc_Tree = function (nodeTreeData, callback) {

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var sql = 'UPDATE ' + tableModel + ' SET ' +
                'id_user = ' + connection.escape(nodeTreeData.iduser) + ',' +
                'name = ' + connection.escape(nodeTreeData.name) + ' ' +
                ' WHERE id = ' + nodeTreeData.id;

        connection.query(sql, function (error, result) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, {"msg": "success"});
            }
        });
    });
};

//Update NODE from IPOBJ or INTERFACE UPDATE
fwc_treeModel.updateFwc_Tree_OBJ = function (iduser, fwcloud, ipobjData, callback) {


    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var sql = 'UPDATE ' + tableModel + ' SET ' +
                ' name = ' + connection.escape(ipobjData.name) + ' , comment= ' + connection.escape(ipobjData.comment) +
                ' WHERE id_obj = ' + connection.escape(ipobjData.id) + ' AND obj_type=' + connection.escape(ipobjData.type) + ' AND fwcloud=' + connection.escape(fwcloud) + ' AND id_user=' + connection.escape(iduser);
        logger.debug(sql);
        connection.query(sql, function (error, result) {
            if (error) {
                callback(error, null);
            } else {
                if (result.affectedRows > 0)
                    callback(null, {"msg": "success"});
                else
                    callback(null, {"msg": "nothing"});
            }
        });
    });
};


//FALTA BORRADO EN CASCADA
//Remove NODE with id to remove
fwc_treeModel.deleteFwc_Tree = function (iduser, fwcloud, id, type, callback) {
    db.get(function (error, connection) {
        if (error)
            return done('Database problem');
        var sqlExists = 'SELECT * FROM ' + tableModel + '  WHERE id_user = ' + connection.escape(iduser) + ' AND id = ' + connection.escape(id) + ' AND obj_type=' + connection.escape(type);
        connection.query(sqlExists, function (error, row) {
            //If exists Id from ipobj to remove
            if (row) {
                db.get(function (error, connection) {
                    var sql = 'DELETE FROM ' + tableModel + ' WHERE id_user = ' + connection.escape(iduser) + ' AND id_obj = ' + connection.escape(id) + ' AND obj_type=' + connection.escape(type);
                    logger.debug(sql);
                    connection.query(sql, function (error, result) {
                        if (error) {
                            callback(error, null);
                        } else {
                            if (result.affectedRows > 0)
                                callback(null, {"msg": "deleted"});
                            else
                                callback(null, {"msg": "nothing"});
                        }
                    });
                });
            } else {
                callback(null, {"msg": "notExist"});
            }
        });
    });
};

function hasLines(id, callback) {
    var ret;

    db.get(function (error, connection) {
        if (error)
            return done('Database problem');

        var sql = 'SELECT * FROM  ' + tableModel + '  where id_parent = ' + id;
        connection.query(sql, function (error, rows) {
            if (rows.length > 0) {
                ret = true;
            } else {
                ret = false;
            }
            callback(ret);
        });
    });

}

//Export the object
module.exports = fwc_treeModel;