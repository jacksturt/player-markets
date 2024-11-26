'use client';

import '@dialectlabs/react-ui/index.css';
import { DialectSolanaSdk } from '@dialectlabs/react-sdk-blockchain-solana';
import { NotificationsButton } from '@dialectlabs/react-ui';

/* Set DAPP_ADDRESS variable to the public key generated in previous section */
const DAPP_ADDRESS = process.env.NEXT_PUBLIC_DIALECT_DAPP_ADDRESS!;

export const DialectNotificationComponent = () => {
  return (
    <DialectSolanaSdk
        dappAddress={DAPP_ADDRESS}
        config={{
            environment: 'development',
        }}
    >
      <NotificationsButton theme='dark' />
    </DialectSolanaSdk>
  );
};