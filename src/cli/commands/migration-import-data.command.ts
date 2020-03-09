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

import * as yargs from "yargs";
import { Application } from "../../Application";
import { DatabaseService } from "../../database/database.service";


/**
 * Runs migration command.
 */
export class MigrationImportDataCommand implements yargs.CommandModule {

    command = "migration:data";
    describe = "Import default data";

    builder(args: yargs.Argv) {
        return args;
    }

    async handler(args: yargs.Arguments) {
        const app: Application = await Application.run();
        
        const databaseService: DatabaseService = await app.getService<DatabaseService>(DatabaseService.name);
        
        try {
            await databaseService.feedDefaultData();
            process.exit(0);
        } catch (err) {
            console.log("Error during migration run:");
            console.error(err);
            process.exit(1);
        }
    }

}