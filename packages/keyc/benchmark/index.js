import { Keyc, FastMemoryStore } from '../src';
const suite = new (require('benchmark').Suite)();
const keyc = new Keyc({
    store: new FastMemoryStore()
});
suite
    .add('set', {
    defer: true,
    fn: async (deferred) => {
        await keyc.set('test', 'value');
        deferred.resolve();
    }
})
    .add('get', {
    defer: true,
    fn: async (deferred) => {
        await keyc.get('test');
        deferred.resolve();
    }
})
    .on('cycle', (event) => {
    console.log(String(event.target));
})
    .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
})
    .run({ async: true });
