import React from 'react';
import PropTypes from 'prop-types';
import {
  Header,
  Button,
  widgetCreator,
  Table,
  ExpandedDataRow,
  Text
} from '@bpanel/bpanel-ui';
import { pick, omit } from 'lodash';
import { getClient } from '@bpanel/bpanel-utils';

class RecentBlocks extends React.Component {
  constructor(props) {
    super(props);
    // use this to ensure order of columns
    // otherwise table just uses object keys
    this.colHeaders = [
      'confirmations',
      'height',
      'versionHex',
      'weight',
      'merkleroot',
      'time',
      'bits',
      'txs'
    ];
    this.mainData = ['hash', 'prevblockhash', 'merkleroot', 'coinbase'];
    this.SPVomit = ['txs', 'coinbase', 'weight', 'size'];
    this.bcashSwap = { weight: 'size' };
  }

  static get displayName() {
    return 'Recent Blocks Widget';
  }

  static get propTypes() {
    return {
      chainHeight: PropTypes.number,
      recentBlocks: PropTypes.array,
      getRecentBlocks: PropTypes.func,
      progress: PropTypes.number
    };
  }

  render() {
    const isSPV = getClient().isSPV;
    const clientChain = getClient().chain;
    const { getRecentBlocks, recentBlocks, progress } = this.props;
    let table;
    if (Array.isArray(recentBlocks) && recentBlocks.length) {
      // structure data for use in the expanded row component
      recentBlocks.sort((a, b) => b.height - a.height).forEach(block => {
        // some blocks come back with coinbase split up into an array
        // for these situations we want to join the data for display purposes
        block.coinbase = Array.isArray(block.coinbase)
          ? block.coinbase.join('')
          : block.coinbase;

        // convert unix timestamp to human readable string
        block.time = Number.isInteger(block.time)
          ? new Date(block.time * 1000)
              .toISOString()
              .replace(/T/, ' ')
              .replace(/\..+/, '')
          : block.time;
      });

      if (isSPV)
        this.colHeaders = this.colHeaders.filter(
          header => !this.SPVomit.includes(header)
        );

      if (clientChain === 'bitcoincash')
        this.colHeaders = swap(this.colHeaders, this.bcashSwap);

      const expandedData = recentBlocks.map(block => {
        if (isSPV) block = omit(block, this.SPVomit);
        return {
          mainData: pick(block, this.mainData),
          subData: omit(block, this.mainData)
        };
      });
      table = (
        <Table
          colHeaders={this.colHeaders}
          ExpandedComponent={ExpandedDataRow}
          expandedData={expandedData}
          expandedHeight={240}
          tableData={recentBlocks}
        />
      );
    } else {
      table = <p>Loading...</p>;
    }

    return (
      <div className="col">
        <Header type="h3">Recent Blocks</Header>
        {table}
        {progress < 0.97 && (
          <div className="row mt-3">
            <Text type="p" className="col">
              While your node is syncing you can use this button to get more
              recent blocks as they come in. Once your node is at 100% this
              button will go away and the table will update automatically
            </Text>
            <Button
              type="primary"
              className="col-xl-3"
              onClick={() => getRecentBlocks(this.blockCount)}
            >
              Get Blocks
            </Button>
          </div>
        )}
        {isSPV && <Text>Limited information is available in SPV mode</Text>}
      </div>
    );
  }
}

// Utility: Swaps out an array item with a new value if contained in object.
function swap(array, object) {
  for (let i = 0; i < array.length; i++)
    if (object[array[i]]) array[i] = object[array[i]];

  return array;
}

export default widgetCreator(RecentBlocks);
