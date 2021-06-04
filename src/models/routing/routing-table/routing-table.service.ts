/*!
    Copyright 2021 SOLTECSIS SOLUCIONES TECNOLOGICAS, SLU
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

import { FindManyOptions, FindOneOptions, getCustomRepository, getRepository, Repository, SelectQueryBuilder } from "typeorm";
import { Application } from "../../../Application";
import db from "../../../database/database-manager";
import { Service } from "../../../fonaments/services/service";
import { Firewall } from "../../firewall/Firewall";
import { IPObj } from "../../ipobj/IPObj";
import { IPObjRepository } from "../../ipobj/IPObj.repository";
import { IPObjGroup } from "../../ipobj/IPObjGroup";
import { IPObjGroupRepository } from "../../ipobj/IPObjGroup.repository";
import { Tree } from "../../tree/Tree";
import { OpenVPN } from "../../vpn/openvpn/OpenVPN";
import { OpenVPNRepository } from "../../vpn/openvpn/openvpn-repository";
import { OpenVPNPrefix } from "../../vpn/openvpn/OpenVPNPrefix";
import { OpenVPNPrefixRepository } from "../../vpn/openvpn/OpenVPNPrefix.repository";
import { Route } from "../route/route.model";
import { RouteRepository } from "../route/route.repository";
import { AvailableDestinations, ItemForGrid, RouteItemForCompiler, RoutingRuleItemForCompiler, RoutingUtils } from "../shared";
import { RoutingTable } from "./routing-table.model";

interface IFindManyRoutingTablePath {
    firewallId?: number,
    fwCloudId?: number
}

interface IFindOneRoutingTablePath extends IFindManyRoutingTablePath {
    id: number
}

interface ICreateRoutingTable {
    firewallId: number;
    number: number;
    name: string;
    comment?: string;
}

interface IUpdateRoutingTable {
    name?: string;
    comment?: string;
}

export interface RouteData<T extends ItemForGrid | RouteItemForCompiler> extends Route {
    items: T[];
}
    
export class RoutingTableService extends Service {
    protected _repository: Repository<RoutingTable>;
    private _routeRepository: RouteRepository;
    private _ipobjRepository: IPObjRepository;
    private _ipobjGroupRepository: IPObjGroupRepository;   
    private _openvpnRepository: OpenVPNRepository;
    private _openvpnPrefixRepository: OpenVPNPrefixRepository; 

    constructor(app: Application) {
        super(app);
        this._repository = getRepository(RoutingTable);
        this._routeRepository = getCustomRepository(RouteRepository);
        this._ipobjRepository = getCustomRepository(IPObjRepository);
        this._ipobjGroupRepository = getCustomRepository(IPObjGroupRepository);
        this._openvpnRepository = getCustomRepository(OpenVPNRepository);
        this._openvpnPrefixRepository = getCustomRepository(OpenVPNPrefixRepository);
    }

    findManyInPath(path: IFindManyRoutingTablePath): Promise<RoutingTable[]> {
        return this._repository.find(this.getFindInPathOptions(path));
    }

    findOneInPath(path: IFindOneRoutingTablePath): Promise<RoutingTable | undefined> {
        return this._repository.findOne(this.getFindInPathOptions(path))
    }

    findOneInPathOrFail(path: IFindOneRoutingTablePath): Promise<RoutingTable> {
        return this._repository.findOneOrFail(this.getFindInPathOptions(path));
    }

    async create(data: ICreateRoutingTable): Promise<RoutingTable> {
        const routingTable: RoutingTable = await this._repository.save(data);
        const firewall: Firewall = await getRepository(Firewall).findOne(routingTable.firewallId, {relations: ['fwCloud']});

        const node: {id: number} = await Tree.getNodeUnderFirewall(db.getQuery(), firewall.fwCloud.id, firewall.id, 'RTS') as {id: number};
        await Tree.newNode(db.getQuery(), firewall.fwCloud.id, routingTable.name, node.id, 'RT', routingTable.id, null);


        return routingTable;
    }

    async update(id: number, data: IUpdateRoutingTable): Promise<RoutingTable> {
        let table: RoutingTable = await this._repository.preload(Object.assign(data, {id}));
        await this._repository.save(table);

        return table;
    }

    async remove(path: IFindOneRoutingTablePath): Promise<RoutingTable> {
        const table: RoutingTable =  await this.findOneInPath(path);
        
        await this._repository.remove(table);
        await Tree.deleteObjFromTree(path.fwCloudId, path.id, 'RT')

        return table;
    }

    protected getFindInPathOptions(path: Partial<IFindOneRoutingTablePath>): FindOneOptions<RoutingTable> | FindManyOptions<RoutingTable> {
        return {
            join: {
                alias: 'table',
                innerJoin: {
                    firewall: 'table.firewall',
                    fwcloud: 'firewall.fwCloud'
                }
            },
            where: (qb: SelectQueryBuilder<RoutingTable>) => {
                if (path.firewallId) {
                    qb.andWhere('firewall.id = :firewall', {firewall: path.firewallId})
                }

                if (path.fwCloudId) {
                    qb.andWhere('firewall.fwCloudId = :fwcloud', {fwcloud: path.fwCloudId})
                }

                if(path.id) {
                    qb.andWhere('table.id = :id', {id: path.id})
                }
            }
        }
    }
    

    /**
     * Returns an array of routes and in each route an array of items containing the information
     * required for compile the routes of the indicated routing table or for show the routing table routes
     * items in the FWCloud-UI.
     * @param dst 
     * @param fwcloud 
     * @param firewall 
     * @param routingTable 
     * @param route 
     * @returns 
     */
     public async getRoutingTableData<T extends ItemForGrid | RouteItemForCompiler>(dst: AvailableDestinations, fwcloud: number, firewall: number, routingTable: number, route?: number): Promise<RouteData<T>[]> {
        const routes: RouteData<T>[] = await this._routeRepository.getRoutingTableRoutes(fwcloud, firewall, routingTable, route) as RouteData<T>[];
         
        // Init the map for access the objects array for each route.
        let ItemsArrayMap = new Map<number, T[]>();
        for (let i=0; i<routes.length; i++) {
          routes[i].items = [];
    
          // Map each route with it's corresponding items array.
          // These items array will be filled with objects data in the Promise.all()
          ItemsArrayMap.set(routes[i].id, routes[i].items);
        }
    
        const sqls = (dst === 'grid') ? 
            this.buildSQLsForGrid(fwcloud, firewall, routingTable) : 
            this.buildSQLsForCompiler(fwcloud, firewall, routingTable, route);
        await Promise.all(sqls.map(sql => RoutingUtils.mapEntityData<T>(sql,ItemsArrayMap)));
        
        return routes;
    }

    private buildSQLsForCompiler(fwcloud: number, firewall: number, routingTable: number, route?: number): SelectQueryBuilder<IPObj>[] {
        return [
            this._ipobjRepository.getIpobjsInRouting_excludeHosts('route', fwcloud, firewall, routingTable, route),
            this._ipobjRepository.getIpobjsInRouting_onlyHosts('route', fwcloud, firewall, routingTable, route),
            this._ipobjRepository.getIpobjsInGroupsInRouting_excludeHosts('route', fwcloud, firewall, routingTable, route),
            this._ipobjRepository.getIpobjsInGroupsInRouting_onlyHosts('route', fwcloud, firewall, routingTable, route),
            this._ipobjRepository.getIpobjsInOpenVPNInRouting('route', fwcloud, firewall, routingTable, route),
            this._ipobjRepository.getIpobjsInOpenVPNInGroupsInRouting('route', fwcloud, firewall, routingTable, route),
            this._ipobjRepository.getIpobjsInOpenVPNPrefixesInRouting('route', fwcloud, firewall, routingTable, route),
            this._ipobjRepository.getIpobjsInOpenVPNPrefixesInGroupsInRouting('route', fwcloud, firewall, routingTable, route),
        ];
    }

    private buildSQLsForGrid(fwcloud: number, firewall: number, routingTable: number): SelectQueryBuilder<IPObj|IPObjGroup|OpenVPN|OpenVPNPrefix>[] {
        return [
            this._ipobjRepository.getIpobjsInRouting_ForGrid('route', fwcloud, firewall, routingTable),
            this._ipobjGroupRepository.getIpobjGroupsInRouting_ForGrid('route', fwcloud, firewall, routingTable),
            this._openvpnRepository.getOpenVPNInRouting_ForGrid('route', fwcloud, firewall, routingTable),
            this._openvpnPrefixRepository.getOpenVPNPrefixInRouting_ForGrid('route', fwcloud, firewall, routingTable),
        ];
    }

}