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

import { Service } from "../../services/service";
import { PathParams } from "express-serve-static-core"
import { Request, Response, NextFunction } from "express";
import { Controller } from "../controller";
import { FunctionHelper } from "../../../utils/FunctionHelper";
import { AbstractApplication, app } from "../../abstract-application";
import { RouteCollection } from "./route-collection";
import { Routes } from "../../../routes/routes";
import { RequestValidation } from "../../validation/request-validation";
import { ValidationException } from "../../exceptions/validation-exception";

export type httpMethod = "ALL" | "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "OPTIONS" | "HEAD";
export type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
declare function optionalParams(params:number, params2: string): void;


export class RouterService extends Service {
    protected _express: Express.Application;
    protected _router: Express.Application

    protected _routes: RouteCollection;

    protected _list: Array<{httpMethod: string, path: PathParams, destination: string}>

    constructor(_app: AbstractApplication) {
        super(_app);
        this._express = this._app.express;
        this._router = this._express;
        this._list = [];
    }

    public registerRoutes() {
        this._routes = new Routes(this._app, this);
    }

    public post(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public post(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public post(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('POST', pathParams, controller, method, validation);
    }

    public get(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public get(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public get(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('GET', pathParams, controller, method, validation);
    }

    public all(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public all(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public all(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('ALL', pathParams, controller, method, validation);
    }

    public options(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public options(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public options(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('OPTIONS', pathParams, controller, method, validation);
    }

    public delete(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public delete(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public delete(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('DELETE', pathParams, controller, method, validation);
    }

    public head(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public head(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public head(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('HEAD', pathParams, controller, method, validation);
    }

    public patch(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public patch(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public patch(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('PATCH', pathParams, controller, method, validation);
    }

    public put(pathParams: PathParams, controller: typeof Controller, method: string, validation?: typeof RequestValidation): any
    public put(pathParams: PathParams, controller: (req: Request, res: Response) => void): any
    public put(pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        return this.addRoute('PUT', pathParams, controller, method, validation);
    }

    private addRoute(httpMethod: httpMethod, pathParams: PathParams, controller: any, method?: string, validation?: typeof RequestValidation): any {
        if (FunctionHelper.isCallback(controller)) {
            this.callWithCallback(httpMethod, pathParams, controller);
            this._list.push({httpMethod: httpMethod, path: pathParams, destination: 'callback'});
            return;
        }

        this.callWithController(httpMethod, pathParams, controller, method, validation);    
        this._list.push({httpMethod: httpMethod, path: pathParams, destination: controller.name + '@' + method});
        return;
    }

    private async callWithCallback(httpMethod: httpMethod, pathParams: PathParams, callback: (req: Request, res: Response) => void): Promise<void> {
        return this._router[httpMethod.toLowerCase()](pathParams, callback);
    }
    
    private async callWithController(httpMethod: httpMethod, pathParams, controller: typeof Controller, method: string, validation?: any): Promise<void> {
        return this._router[httpMethod.toLowerCase()](pathParams, async (req: Request, res: Response, next?: NextFunction) => {
            
            if (!controller.methodExists(method)) {
                throw new Error('Method ' + method + ' does not exist in controller: ' + controller.name);
            }

            if (validation) {
                const validationRequest: RequestValidation = new validation(req);
                try {
                    await validationRequest.validate();
                } catch(e) {
                    return next(new ValidationException(e));
                }
            }

            return (new controller(this._app))[method](req,res);
            
        });
    }
}