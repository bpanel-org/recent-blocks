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
import { pick } from 'underscore';

class RecentBlocks extends React.Component {
  constructor(props) {
    super(props);
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
    const { getRecentBlocks, recentBlocks, progress } = this.props;
    // use this to ensure order of columns
    // otherwise table just uses object keys
    const colHeaders = [
      'depth',
      'height',
      'hash',
      'version',
      'prevBlock',
      'merkleRoot',
      'time',
      'bits',
      'nonce',
      'txs'
    ];

    let table;
    if (Array.isArray(recentBlocks) && recentBlocks.length) {
      // structure data for use in the expanded row component
      recentBlocks.sort((a, b) => a - b);
      const expandedData = recentBlocks.map(block => ({
        mainData: pick(block, ['hash', 'prevBlock', 'merkleRoot']),
        subData: pick(block, ['bits', 'nonce', 'version'])
      }));
      table = (
        <Table
          colHeaders={colHeaders}
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
      </div>
    );
  }
}

export default widgetCreator(RecentBlocks);
