import { ADD_RECENT_BLOCK, SET_RECENT_BLOCKS } from '../constants';

const initialState = {
  blocks: [],
  numBlocks: 10
};

function recentBlocksReducer(state = initialState, action) {
  const { type, payload } = action;
  let newState = { ...state };

  switch (type) {
    case SET_RECENT_BLOCKS: {
      if (payload.length) {
        newState.blocks = payload;
      }
      return newState;
    }

    case ADD_RECENT_BLOCK: {
      // get a copy of the blocks array
      let blocks = newState.blocks.slice();
      const block = payload;
      const { numBlocks } = newState;

      // skip if we already have the block for that height
      // or recentBlocks haven't been hydrated yet
      // reason is new block can be received multiple times
      if (
        (blocks && blocks.length && !blocks[block.height]) ||
        blocks[block.height].hash !== block.hash
      ) {
        blocks = [payload, ...blocks];

        // limit blocks array to numBlocks
        if (numBlocks && blocks.length >= numBlocks) {
          // pop the last block off the stack if block count is past limit
          blocks.pop();
        }

        // increase depth of blocks without having to query node for
        // updated block info
        blocks.forEach(
          block => (block.depth = block.depth ? block.depth + 1 : 1)
        );
      }

      newState.blocks = blocks;
      return newState;
    }

    default:
      return state;
  }
}

export default recentBlocksReducer;
