import { ChainEntry as BChainEntry } from 'bcoin';
import { getClient, chain as chainUtils } from '@bpanel/bpanel-utils';
import { ChainEntry as HChainEntry } from 'hsd';

import { ADD_RECENT_BLOCK, SET_RECENT_BLOCKS } from './constants';

// can also accept raw txs array
// as it is returned in payload
export function addRecentBlock(entry) {
  return async (dispatch, getState) => {
    const { currentClient } = getState().clients;
    let blockMeta;
    if (currentClient.chain === 'handshake')
      blockMeta = HChainEntry.fromRaw(entry).toJSON();
    else blockMeta = BChainEntry.fromRaw(entry).toJSON();

    const block = getClient().isSPV
      ? await chainUtils.getBlockHeaderInfo(blockMeta.hash)
      : await chainUtils.getBlockInfo(blockMeta.hash);
    return dispatch({
      type: ADD_RECENT_BLOCK,
      payload: block
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
    try {
      const blocks = await getBlocksInRange(
        height,
        height - count,
        -1,
        getClient().isSPV
      );
      dispatch({
        type: SET_RECENT_BLOCKS,
        payload: blocks
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Could not retrieve blocks:', e);
      dispatch({
        type: SET_RECENT_BLOCKS,
        payload: []
      });
    }
  };
}

export default {
  addRecentBlock,
  getRecentBlocks
};
