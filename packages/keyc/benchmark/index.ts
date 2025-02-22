import { Keyc, FastMemoryStore } from '../src';
import type { Suite } from 'benchmark';

const suite = new (require('benchmark').Suite)();

const keyc = new Keyc<string>({
  store: new FastMemoryStore()
});

suite
  .add('set', {
    defer: true,
    fn: async (deferred: { resolve: () => void }) => {
      await keyc.set('test', 'value');
      deferred.resolve();
    }
  })
  .add('get', {
    defer: true,
    fn: async (deferred: { resolve: () => void }) => {
      await keyc.get('test');
      deferred.resolve();
    }
  })
  .on('cycle', (event: { target: unknown }) => {
    console.log(String(event.target));
  })
  .on('complete', function(this: Suite) {
    console.log('Fastest is ' + this.filter('fastest').map('name'));
  })
  .run({ async: true });