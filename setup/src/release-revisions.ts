import type {OS, Tool} from './opts';

export type Revisions = Record<
  OS,
  Record<Tool, Array<{from: string; to: string}>>
>;

export const releaseRevisions: Revisions = {
  win32: {
    stack: [],
    ghc: [
      {from: '9.4.3', to: '9.4.3.1'},
      {from: '9.2.5', to: '9.2.5.1'},
      {from: '8.10.2', to: '8.10.2.2'},
      {from: '8.10.1', to: '8.10.1.1'},
      {from: '8.8.4', to: '8.8.4.1'},
      {from: '8.8.3', to: '8.8.3.1'},
      {from: '8.8.2', to: '8.8.2.1'},
      {from: '8.6.1', to: '8.6.1.1'},
      {from: '8.0.2', to: '8.0.2.2'},
      {from: '7.10.3', to: '7.10.3.2'},
      {from: '7.10.2', to: '7.10.2.1'},
      {from: '7.10.1', to: '7.10.1.1'},
      {from: '7.8.4', to: '7.8.4.1'},
      {from: '7.8.3', to: '7.8.3.1'},
      {from: '7.8.2', to: '7.8.2.1'},
      {from: '7.8.1', to: '7.8.1.1'},
      {from: '7.6.3', to: '7.6.3.1'},
      {from: '7.6.2', to: '7.6.2.1'},
      {from: '7.6.1', to: '7.6.1.1'}
    ],
    cabal: [{from: '3.10.1.0', to: '3.10.1.1'}]
  },
  // TODO
  darwin: {
    stack: [],
    ghc: [],
    cabal: []
  },
  linux: {
    stack: [],
    ghc: [],
    cabal: []
  }
};
