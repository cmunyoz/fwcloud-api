/*!
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

import { User } from "../../../src/models/user/User";
import { testSuite, describeName } from "../../mocha/global-setup";
import { Application } from "../../../src/Application";
import { RepositoryService } from "../../../src/database/repository.service";
import { generateSession, attachSession } from "../../utils/utils";
import request = require("supertest");
import { _URL } from "../../../src/fonaments/http/router/router.service";

let app: Application;
let loggedUser: User;
let loggedUserSessionId: string;
let adminUser: User;
let adminUserSessionId: string;

beforeEach(async() => {
    app = testSuite.app;

    const repository: RepositoryService = await app.getService<RepositoryService>(RepositoryService.name);
    
    try {
        loggedUser = (await repository.for(User).find({
            where: {
                'email': 'loggedUser@fwcloud.test'
            }
        }))[0];
        loggedUserSessionId = generateSession(loggedUser);

        adminUser = (await repository.for(User).find({
            where: {
                'email': 'admin@fwcloud.test'
            }
        }))[0];
        adminUserSessionId = generateSession(adminUser);


    } catch (e) { console.error(e) }
});

describe(describeName('Version E2E tests'), () => {

    describe(describeName('VersionController@show'), () => {
        it('guest user should not see the version', async () => {
            return await request(app.express)
                .get(_URL().getURL('versions.show'))
                .expect(401);
        });

        it('regular user should not see version', async () => {
            return await request(app.express)
                .get(_URL().getURL('versions.show'))
                .set('Cookie', [attachSession(loggedUserSessionId)])
                .expect(401)
        });

        it('admin user should see the version', async () => {
            return await request(app.express)
                .get(_URL().getURL('versions.show'))
                .set('Cookie', [attachSession(adminUserSessionId)])
                .expect(200)
                .then(response => {
                    response.body.data = app.version.toResponse()
                });
        });
    });
})