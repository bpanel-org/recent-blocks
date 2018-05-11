import { createSelector } from 'reselect';

const getBlocks = state => state.chain.recentBlocks;

const setTxCount = blocks =>
  blocks.map(block => {
    const txs = block.txs;
    const txCount = txs ? txs.length : '';
    block.txs = txCount;
    return block;
  });

const getBlocksWithTxCount = createSelector([getBlocks], setTxCount);

export default {
  getBlocksWithTxCount
};
