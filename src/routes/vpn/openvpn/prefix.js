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


var express = require('express');
var router = express.Router();
import { OpenVPNPrefix } from '../../../models/vpn/openvpn/OpenVPNPrefix';
import { PolicyCompilation } from '../../../models/policy/PolicyCompilation';
import { logger } from '../../../fonaments/abstract-application';
const restrictedCheck = require('../../../middleware/restricted');
const fwcError = require('../../../utils/error_table');


/**
 * Create a new crt prefix container.
 */
router.post('/', async (req, res) => {
	try {
		// We can only create prefixes for OpenVPN server configurations.
		if (req.openvpn.type!==2)
			throw fwcError.VPN_NOT_SER;

    // Verify that we are not creating a prefix that already exists for the same CA.
		if (await OpenVPNPrefix.existsPrefix(req.dbCon,req.body.openvpn,req.body.name)) 
			throw fwcError.ALREADY_EXISTS;

   	// Create the tree node.
		const id = await OpenVPNPrefix.createPrefix(req);

		// Apply the new CRT prefix container.
		await OpenVPNPrefix.applyOpenVPNPrefixes(req.dbCon,req.body.fwcloud,req.body.openvpn);

		res.status(200).json({insertId: id});
	} catch(error) {
		logger().error('Error creating a prefix: ' + JSON.stringify(error));
		res.status(400).json(error);
	}
});


/**
 * Modify an OpenVPN client prefix container.
 */
router.put('/', async (req, res) => {
	try {
		// Verify that the new prefix name doesn't already exists.
		req.body.ca = req.prefix.ca;
		if (await OpenVPNPrefix.existsPrefix(req.dbCon,req.prefix.openvpn,req.body.name))
			throw fwcError.ALREADY_EXISTS;

		// If we modify a prefix used in a rule or group, and the new prefix name has no openvpn clients, then don't allow it.
		const search = await OpenVPNPrefix.searchPrefixUsage(req.dbCon,req.body.fwcloud,req.body.prefix);
		if (search.result && (await OpenVPNPrefix.getOpenvpnClientesUnderPrefix(req.dbCon,req.prefix.openvpn,req.body.name)).length < 1)
			throw fwcError.IPOBJ_EMPTY_CONTAINER;

		// Invalidate the compilation of the rules that use this prefix.
		await PolicyCompilation.deleteRulesCompilation(req.body.fwcloud,search.restrictions.PrefixInRule);

		// Invalidate the compilation of the rules that use a group that use this prefix.
		await PolicyCompilation.deleteGroupsInRulesCompilation(req.dbCon,req.body.fwcloud,search.restrictions.PrefixInGroup);

   	// Modify the prefix name.
		await OpenVPNPrefix.modifyPrefix(req);

		// Apply the new CRT prefix container.
		await OpenVPNPrefix.applyOpenVPNPrefixes(req.dbCon, req.body.fwcloud, req.prefix.openvpn);

		res.status(204).end();
	} catch(error) {
		logger().error('Error updating a prefix: ' + JSON.stringify(error));
		res.status(400).json(error);
	}
});


/**
 * Get OpenVPN configuration metadata.
 */
router.put('/info/get', async(req, res) => {
	try {
		const data = await OpenVPNPrefix.getPrefixOpenvpnInfo(req.dbCon,req.body.fwcloud,req.body.prefix);
		res.status(200).json(data[0]);
	} catch(error) {
		logger().error('Error getting prefix metadata: ' + JSON.stringify(error));
		res.status(400).json(error) }
});


/**
 * Delete a CRT prefix container.
 */
router.put('/del', 
restrictedCheck.openvpn_prefix,
async (req, res) => {
	try {
		// Delete prefix.
		await OpenVPNPrefix.deletePrefix(req.dbCon,req.body.prefix);

		// Regenerate prefixes.
		await OpenVPNPrefix.applyOpenVPNPrefixes(req.dbCon,req.body.fwcloud,req.prefix.openvpn);
	
		res.status(204).end();
	} catch(error) {
		logger().error('Error removing prefix: ' + JSON.stringify(error));
		res.status(400).json(error);
	}
});


// API call for check deleting restrictions.
router.put('/restricted', restrictedCheck.openvpn_prefix, (req, res) => res.status(204).end());


router.put('/where', async (req, res) => {
	try {
		const data = await OpenVPNPrefix.searchPrefixUsage(req.dbCon,req.body.fwcloud,req.body.prefix);
		if (data.result)
			res.status(200).json(data);
		else
			res.status(204).end();
	} catch(error) {
		logger().error('Error getting prefix references: ' + JSON.stringify(error));
		res.status(400).json(error);
	}
});

module.exports = router;