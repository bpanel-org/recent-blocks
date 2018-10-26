import { createSelector } from 'reselect';
import { PLUGIN_NAMESPACE } from '../constants';

const getBlocks = state => state.plugins[PLUGIN_NAMESPACE].blocks;

const setTxCount = blocks => {
  const copy = blocks.slice();
  return copy.map(_block => {
    const block = { ..._block };
    if (block && block.tx) {
      block.txs = block.tx.length;
    } else {
      block.txs = 0;
    }
    return block;
  });
};

const getBlocksWithTxCount = createSelector([getBlocks], setTxCount);

export default {
  getBlocksWithTxCount
};
