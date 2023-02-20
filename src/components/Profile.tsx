import {
  useAccount, useConnect, useDisconnect, useEnsName,
} from 'wagmi'
import styles from '@/styles/Home.module.css'
import SignInButton from '@/components/SignInButton'
import React from 'react'
import Image from 'next/image'
 
export default function Profile() {
  const { address, connector, isConnected } = useAccount()
  const { data: ensName } = useEnsName({ address })
  const { connect, connectors, error, isLoading, pendingConnector } =
    useConnect()
  const { disconnect } = useDisconnect()
 
  const [state, setState] = React.useState<{
    address?: string
    userData?: {
      signature: string,
      address: string,
      nonce: string,
      issuedAt: string,
    }
    error?: Error
    loading?: boolean
  }>({})
 
  // Fetch user when:
  React.useEffect(() => {
    const handler = async () => {
      try {
        const res = await fetch('/api/user')
        const json = await res.json()
        setState((x) => ({ ...x, address: json.address , userData: json.userData}))
      } catch (_error) {}
    }
    // 1. page loads
    handler()
 
    // 2. window is focused (in case user logs out of another window)
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  }, [])
 
  if (isConnected) {
    return (
      <div className={styles.userContainer}>
        
        <div className={styles.walletContainer}>
          <div className={styles.profileInfo}>
            <div className={styles.addressString}>{ensName ? `${ensName} (${address})` : address}</div>
            <div>Connected to {connector?.name}</div>
          </div>
          <button onClick={() => disconnect()} className={styles.disconnectButton}>Disconnect</button>
        </div>
 
        {state.address ? (
          <>
          <div className={styles.walletContainer}>
            <div className={styles.addressString}>Signed in as {state.address}</div>
            <button className={styles.disconnectButton} onClick={async () => {
                await fetch('/api/logout')
                setState({})
              }}
            >
              Sign Out
            </button>
          </div>
          
          <div className={styles.walletContainer}>
            <div className={styles.addressString}>Data from db<br /> 
            signature: {state.userData?.signature}<br />
            address: {state.userData?.address} <br />
            nonce: {state.userData?.nonce} <br />
            issuedAt: {state.userData?.issuedAt} <br /></div>
          </div>
          </>
        ) : (
          <SignInButton
            onSuccess={({ address }) => setState((x) => ({ ...x, address }))}
            onError={({ error }) => setState((x) => ({ ...x, error }))}
          />
        )}
      </div>
    )
  }
 
  return (
    <div>
      {connectors.map((connector) => (
        <button
          className={styles.loginButton}
          key={connector.id}
          onClick={() => connect({ connector })}
        ><Image
            src='/MetaMask.png'
            width={25}
            height={25}
            alt='Metamask Logo' 
          />
          {connector.name}
          {isLoading &&
            connector.id === pendingConnector?.id &&
            ' (connecting)'}
        </button>
      ))}

      {error && <div>{error.message}</div>}
    </div>
  )
}