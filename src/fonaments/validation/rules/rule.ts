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

export abstract class Rule {
    
    protected _data: object;

    constructor() {
        this._data = {};
    }

    public context(data: object) {
        this._data = data;
    }

    /**
     * Returns whether value is a valid value.
     * 
     * @param attribute 
     * @param value 
     */
    public abstract async passes(attribute: string, value: any): Promise<boolean>;
    
    /**
     * Returns the validation error message when value is not a valid value.
     * 
     * @param attribute 
     * @param value 
     */
    public abstract message(attribute: string, value: any): string;

}