import '../../mocha/global-setup';
import { expect } from 'chai';

import { Firewall } from '../../../src/models/firewall/Firewall';
import { Application } from '../../../src/Application';
import modelEventService from '../../../src/models/ModelEventService'
import { FirewallTest } from './fixtures/FirewallTest';
import { FwCloud } from '../../../src/models/fwcloud/FwCloud';
import { randomString } from "../utils/../../utils/utils"
import { testSuite, describeName } from "../../mocha/global-setup";
import db from "../../../src/database/database-manager";
import { RepositoryService } from '../../../src/database/repository.service';

let app: Application;
let repository: RepositoryService;

beforeEach(async () => {
    app = testSuite.app;
    repository = await app.getService<RepositoryService>(RepositoryService.name);
})

describe(describeName('ModelEventService tests'), () => {
    it('emit model event with a callback should run the callback', async () => {
        const name = randomString();
        const fwcloud = await FwCloud.insertFwcloud({
            body: {
                name: name
            },
            dbCon: db.getQuery()
        });
        
        const id = await Firewall.insertFirewall({
            name: name,
            fwcloud: fwcloud
        });

        const newName = randomString();
        await modelEventService.emit('create', Firewall, id, async () => {
            return await repository.for(Firewall).update(id, { name: newName });
        });

        expect((await repository.for(Firewall).findOne(id)).name).to.be.deep.equal(newName);
    });

    it('emit model event over a model should run a model method if exists', async () => {
        const name = randomString();
        let firewall = repository.for(FirewallTest).create({ name: name });
        firewall = await repository.for(FirewallTest).save(firewall);

        await modelEventService.emit('create', FirewallTest, firewall.id);

        expect((await repository.for(Firewall).findOne(firewall.id)).name).to.be.deep.equal('onCreate called');
    });

    it('emit model event using where arguments should update the models with that where-clausules', async () => {
        const name = randomString();
        let firewall = repository.for(FirewallTest).create({ name: name });
        firewall = await repository.for(FirewallTest).save(firewall);

        await modelEventService.emit('create', FirewallTest, { name: name });

        expect((await repository.for(Firewall).findOne(firewall.id)).name).to.be.deep.equal('onCreate called');
    });

    it('emit model event using a model instance should update the instanced model', async() => {
        const name = randomString();
        let firewall = repository.for(FirewallTest).create({ name: name });
        firewall = await repository.for(FirewallTest).save(firewall);

        await modelEventService.emit('create', FirewallTest, firewall);

        expect((await repository.for(Firewall).findOne(firewall.id)).name).to.deep.equal('onCreate called');
    });

    it('emit model event using an empty criteria should not throw an exception', async () => {
        await modelEventService.emit('create', FirewallTest, null);
    });

    it('emit model event using an array of model instance should update all model instances', async() => {
        let firewall = repository.for(FirewallTest).create({ name: randomString() });
        let firewall2 = repository.for(FirewallTest).create({ name: randomString() });
        
        firewall = await repository.for(FirewallTest).save(firewall);
        firewall2 = await repository.for(FirewallTest).save(firewall2);

        const firewalls = await repository.for(FirewallTest).find({});

        await modelEventService.emit('create', FirewallTest, firewalls);

        expect((await repository.for(Firewall).findOne(firewall.id)).name).to.be.deep.equal('onCreate called');
        expect((await repository.for(Firewall).findOne(firewall2.id)).name).to.be.deep.equal('onCreate called');
    });
});