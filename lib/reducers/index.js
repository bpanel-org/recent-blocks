import { PLUGIN_NAMESPACE } from '../constants';
import recentBlocks from './recentBlocks';
function bp_hello(state = { foo: 'baz' }, action) {
  const newState = { ...state };
  switch (action.type) {
    case 'SET_HELLO':
      newState.hello = action.payload;
      return newState;
    default:
      return state;
  }
}

export default {
  [PLUGIN_NAMESPACE]: recentBlocks,
  bp_hello
};
