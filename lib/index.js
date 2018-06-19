import { helpers } from '@bpanel/bpanel-utils';
import modules from './plugins';
import RecentBlocks from './components/RecentBlocks';
import { addRecentBlock, getRecentBlocks } from './actions';
import {
  NEW_BLOCK,
  ADD_RECENT_BLOCK,
  SET_RECENT_BLOCKS,
  ADD_PLUGIN,
  APP_LOADED,
  PLUGIN_NAMESPACE
} from './constants';

import { recentBlocks } from './selectors';
const { getBlocksWithTxCount } = recentBlocks;
const { safeSet } = helpers;

const plugins = Object.keys(modules).map(name => modules[name]);

export const metadata = {
  name: '@bpanel/recent-blocks',
  pathName: '',
  displayName: 'Recent Blocks',
  author: 'bcoin-org',
  description:
    'A widget that shows the recent block information with expandable rows, optimized for bpanel dashboard',
  version: require('../package.json').version
};

export const pluginConfig = { plugins };

export const getRouteProps = {
  '@bpanel/dashboard': (parentProps, props) =>
    Object.assign(props, {
      chainHeight: parentProps.chainHeight,
      recentBlocks: parentProps.recentBlocks,
      getRecentBlocks: parentProps.getRecentBlocks,
      progress: parentProps.progress
    })
};

// This connects your plugin's component to the state's dispatcher
// Make sure to pass in an actual action to the dispatcher
export const mapComponentDispatch = {
  Panel: (dispatch, map) =>
    Object.assign(map, {
      getRecentBlocks: (n = 10) => dispatch(getRecentBlocks(n))
    })
};

// Tells the decorator what our plugin needs from the state
// This is available for container components that use an
// extended version of react-redux's connect to connect
// a container to the state and retrieve props
// make sure to replace the corresponding state mapping
// (e.g. `state.chain.height`) and prop names
export const mapComponentState = {
  Panel: (state, map) =>
    Object.assign(map, {
      chainHeight: state.chain.height,
      recentBlocks: state.plugins[PLUGIN_NAMESPACE].blocks
        ? getBlocksWithTxCount(state)
        : [],
      progress: state.chain.progress
    })
};

// custom middleware for our plugin. This gets
// added to the list of middlewares in the app's store creator
// Use this to intercept and act on dispatched actions
// e.g. for responding to socket events
export const middleware = ({ dispatch, getState }) => next => action => {
  const { type, payload } = action;
  const { progress } = getState().chain;
  const { plugins } = getState();
  let blocks;

  if (plugins && plugins[PLUGIN_NAMESPACE])
    blocks = plugins[PLUGIN_NAMESPACE].blocks;

  if (type === NEW_BLOCK && blocks && blocks.length && progress > 0.9) {
    // if dispatched action is NEW_BLOCK,
    // and recent blocks are already loaded
    // this middleware will intercept and dispatch addRecentBlock
    dispatch(addRecentBlock(...payload));
  } else if (action.type === APP_LOADED) {
    // register our plugin with the plugin store
    dispatch({
      type: ADD_PLUGIN,
      payload: {
        id: PLUGIN_NAMESPACE,
        blocks: [],
        numBlocks: 10
      }
    });
  }
  return next(action);
};

export const reducePlugins = (state, action) => {
  const { type, payload } = action;
  let newState = { ...state };

  switch (type) {
    case SET_RECENT_BLOCKS: {
      if (payload.length) {
        newState = safeSet(newState, `${PLUGIN_NAMESPACE}.blocks`, payload);
      }
      return newState;
    }

    case ADD_RECENT_BLOCK: {
      // get a copy of the blocks array
      const blocks = newState[PLUGIN_NAMESPACE].blocks.slice();
      const block = payload;
      const { numBlocks } = newState[PLUGIN_NAMESPACE];

      // skip if we already have the block for that height
      // or recentBlocks haven't been hydrated yet
      // reason is new block can be received multiple times
      if (
        (blocks && blocks.length && !blocks[block.height]) ||
        blocks[block.height].hash !== block.hash
      ) {
        blocks.unshift(payload);

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

      newState = safeSet(newState, `${PLUGIN_NAMESPACE}.blocks`, blocks);
      return newState;
    }

    default:
      return state;
  }
};

// very/exactly similar to normal decorators
// name can be anything, but must match it to target
// plugin name via decoratePlugin export below
const decorateDashboard = (Dashboard, { React, PropTypes }) => {
  return class extends React.PureComponent {
    constructor(props) {
      super(props);
      this.requestedBlocks = false;
      this.blockCount = 10;
    }

    static get displayName() {
      return metadata.displayName;
    }

    static get propTypes() {
      return {
        primaryWidget: PropTypes.oneOf([PropTypes.array, PropTypes.node]),
        chainHeight: PropTypes.number,
        recentBlocks: PropTypes.array,
        getRecentBlocks: PropTypes.func,
        progress: PropTypes.number
      };
    }

    componentWillMount() {
      const {
        recentBlocks,
        getRecentBlocks,
        chainHeight,
        progress
      } = this.props;
      this.recentBlocks = RecentBlocks({
        recentBlocks,
        getRecentBlocks,
        chainHeight,
        progress
      });
      if (!recentBlocks.length && !this.requestedBlocks) {
        getRecentBlocks(this.blockCount);
      }
    }

    componentWillUnmount() {
      this.requestedBlocks = false;
    }

    componentDidUpdate({ chainHeight: prevHeight }) {
      const { chainHeight, recentBlocks = [], getRecentBlocks } = this.props;

      if (
        chainHeight > prevHeight &&
        (!recentBlocks.length && !this.requestedBlocks)
      ) {
        // if chainHeight has increased and recentBlocks is not set,
        // get the most recent blocks
        // `getRecentBlocks` is attached to the store
        // and will dispatch action creators to udpate the state
        getRecentBlocks(this.blockCount);
        this.requestedBlocks = true;
      } else if (chainHeight > prevHeight || this.requestedBlocks) {
        this.recentBlocks = RecentBlocks(this.props);
        this.requestedBlocks = false;
      }
    }

    componentWillUpdate({
      chainHeight: nextHeight,
      recentBlocks: nextBlocks,
      progress
    }) {
      const { chainHeight, recentBlocks = [], getRecentBlocks } = this.props;
      if (recentBlocks.length && this.requestedBlocks)
        this.requestedBlocks = false;

      if (
        (progress > 0.9 && (nextHeight && nextHeight > chainHeight)) ||
        (recentBlocks[0] &&
          nextBlocks &&
          recentBlocks[0].hash !== nextBlocks[0].hash) ||
        (nextBlocks && recentBlocks && !recentBlocks[0] && nextBlocks[0])
      ) {
        // otherwise if we just have an update to the chainHeight
        // or recent blocks we should update the table
        this.recentBlocks = RecentBlocks({
          chainHeight: nextHeight,
          recentBlocks: nextBlocks,
          getRecentBlocks,
          progress
        });
      }
    }

    render() {
      const { primaryWidget = [] } = this.props;
      primaryWidget.push(this.recentBlocks);
      return <Dashboard {...this.props} primaryWidget={primaryWidget} />;
    }
  };
};

// `decoratePlugin` passes an object with properties to map to the
// plugins they will decorate. Must match target plugin name exactly
export const decoratePlugin = { '@bpanel/dashboard': decorateDashboard };
