import { ChainEntry as BChainEntry, TX as BTX } from 'bcoin';
import { chain as chainUtils } from '@bpanel/bpanel-utils';
import { ChainEntry as HChainEntry, TX as HTX } from 'hsd';

import { ADD_RECENT_BLOCK, SET_RECENT_BLOCKS } from './constants';

// can also accept raw txs array
// as it is returned in payload
export function addRecentBlock(entry, txs) {
  return (dispatch, getState) => {
    const { currentClient } = getState().clients;
    let blockMeta;
    if (currentClient.chain === 'handshake') {
      blockMeta = HChainEntry.fromRaw(entry).toJSON();
      blockMeta.txs = txs.map(tx => HTX.fromRaw(tx));
    } else {
      blockMeta = BChainEntry.fromRaw(entry).toJSON();
      blockMeta.txs = txs.map(tx => BTX.fromRaw(tx));
    }

    return dispatch({
      type: ADD_RECENT_BLOCK,
      payload: blockMeta
    });
  };
}

// action creator to set recent blocks on state
// mapped to the state via `mapPanelDispatch`
// which allows plugins to call action creator to update the state
export function getRecentBlocks(n = 10) {
  return async (dispatch, getState) => {
    const { getBlocksInRange } = chainUtils;
    const { height } = getState().chain;
    let count = n;
    // if we have fewer blocks then the range we want to retrieve
    // then only retrieve up to height
    if (height <= n) {
      count = height;
    }
    const blocks = await getBlocksInRange(height, height - count, -1);
    dispatch({
      type: SET_RECENT_BLOCKS,
      payload: blocks
    });
  };
}

export default {
  addRecentBlock,
  getRecentBlocks
};
