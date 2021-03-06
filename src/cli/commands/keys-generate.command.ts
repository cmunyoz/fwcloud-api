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
import { Application } from "../Application";
import * as path from "path";
import { promises as fs, Stats } from "fs";
import * as crypto from "crypto";
import { logger } from "../../fonaments/abstract-application";
import { Command } from "../command";
/**
 * Runs migration command.
 */
export class KeysGenerateCommand extends Command {
    
    static ENV_FILENAME: string = '.env';
    static KEY_LENGTH: number = 30;
    static SESSION_SECRET_ENV_VARIABLE = 'SESSION_SECRET';
    static CRYPT_SECRET_ENV_VARIABLE = 'CRYPT_SECRET';

    public name: string = "keys:generate";
    public description: string = "Generates random keys";

    async handle(args: yargs.Arguments) {
        const envFilePath: string = path.join(this._app.path, KeysGenerateCommand.ENV_FILENAME);

        const stat: Stats = await fs.stat(envFilePath)
        if (stat && !stat.isFile()) {
            throw new Error('File ' + envFilePath + ' does not exists');
        }
        
        const session_secret = await this.generateRandomString();
        const crypt_secret = await this.generateRandomString();

        let envContent: string = (await fs.readFile(envFilePath)).toString();

        envContent = envContent.replace(new RegExp('^SESSION_SECRET\\s*=.*\n', 'm'), `SESSION_SECRET=${session_secret}\n`);
        envContent = envContent.replace(new RegExp('^CRYPT_SECRET\\s*=.*\n', 'm'), `CRYPT_SECRET=${crypt_secret}\n`);

        await fs.writeFile(envFilePath, envContent);
        
        this.output.success(`Application key generated.`);
        return;
    }

    protected async generateRandomString(): Promise<String> {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(KeysGenerateCommand.KEY_LENGTH, (err: Error, buff: Buffer) => {
                if (err) {
                    throw err;
                }
    
                resolve(buff.toString('hex'));
            })
        });
    }
}