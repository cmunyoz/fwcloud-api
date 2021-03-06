import { Service } from "../fonaments/services/service";
import { FSHelper } from "../utils/fs-helper";
import { FwCloudExport } from "./fwcloud-export";
import { FwCloud } from "../models/fwcloud/FwCloud";
import { User } from "../models/user/User";

export type ExporterConfig = {
    data_dir: string,
    upload_dir: string
}

export class FwCloudExportService extends Service {
    get config(): ExporterConfig {
        return this._app.config.get('exporter');
    }

    public async build(): Promise<Service> {
        if (!FSHelper.directoryExistsSync(this.config.data_dir)) {
            FSHelper.mkdirSync(this.config.data_dir);
        }

        if (!FSHelper.directoryExistsSync(this.config.upload_dir)) {
            FSHelper.mkdirSync(this.config.upload_dir);
        }

        return this;
    }

    public async create(fwCloud: FwCloud, user: User, ttl: number = 0): Promise<FwCloudExport> {
        const fwCloudExport: FwCloudExport = await FwCloudExport.create(this.config.data_dir, fwCloud, user);
        await fwCloudExport.compress();
        FSHelper.rmDirectorySync(fwCloudExport.path);

        if (ttl > 0) {
            setTimeout(() => {
                if(FSHelper.fileExistsSync(fwCloudExport.exportPath)) {
                    FSHelper.remove(fwCloudExport.exportPath);
                }
            }, ttl);
        }
        return fwCloudExport;
    }

    public async import(filePath: string, user: User): Promise<FwCloud> {
        const fwCloudExport: FwCloudExport = await FwCloudExport.loadCompressed(filePath);

        const fwCloud: FwCloud = await fwCloudExport.import();

        user = await User.findOne({where: {id: user.id}, relations: ['fwClouds']})
        user.fwClouds.push(fwCloud);
        await user.save();

        return fwCloud;
    }
}