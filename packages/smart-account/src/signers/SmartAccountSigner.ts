import { BigNumber, ethers } from 'ethers'
import { BytesLike } from '@ethersproject/bytes'
import { JsonRpcProvider } from '@ethersproject/providers'
import { Wallet } from 'ethers'
import {
  TypedDataDomain,
  TypedDataField,
  TypedDataSigner,
  Signer as EthersSigner
} from '@ethersproject/abstract-signer'
import { ChainId } from '@biconomy/core-types'

// Might as well be RpcRelayer
// import { IRelayer, RestRelayer } from '@biconomy/relayer'
import { Deferrable } from 'ethers/lib/utils'
import { TransactionRequest } from '@ethersproject/providers'

export class SmartAccountSigner extends EthersSigner implements TypedDataSigner {
  readonly provider: JsonRpcProvider | any
  // todo : later
  //readonly sender: JsonRpcSender
  readonly defaultChainId: number | undefined
  readonly wallet: Wallet

  constructor(wallet: Wallet, defaultChainId?: number) {
    super()
    this.provider = wallet.provider
    this.wallet = wallet
    this.defaultChainId = defaultChainId
    // todo : later
    //this.sender = new JsonRpcSender(provider)
  }

  _address!: string

  // May have
  // _relayer

  // Might have
  // _context: not smartAccountContext but the addresses of contracts from SmartAccountState

  // todo : later
  /**
   * Note: When you do getAddress it could use provider.getAddress / provider.getSmartAccountAddress or directly access SmartAccountAPI
   */
  async getAddress(): Promise<string> {
    if (this._address) return this._address

    this._address = this.wallet.address
    return ethers.utils.getAddress(this._address)
  }

  async getChainId(): Promise<number> {
    return (await this.provider.getNetwork()).chainId
  }

  async signTransaction(transaction: Deferrable<TransactionRequest>): Promise<string> {
    if (!this.provider) {
      throw new Error('missing provider')
    }
    // const signature: any = await this.provider.send('eth_signTransaction', [transaction])
    const signature: any = await this.wallet.sendTransaction(transaction)
    return signature
  }

  // Review getProvider

  // todo : implement sendTransaction

  // signMessage matches implementation from ethers JsonRpcSigner for compatibility
  async signMessage(message: BytesLike): Promise<string> {
    if (!this.provider) {
      throw new Error('missing provider')
    }
    return await this.wallet.signMessage(message)
  }

  // signTypedData matches implementation from ethers JsonRpcSigner for compatibility
  async signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, any>,
    chainId?: ChainId
  ): Promise<string> {
    const activeChainId = chainId ? chainId : await this.getChainId()
    const domainChainId = domain.chainId ? BigNumber.from(domain.chainId).toNumber() : undefined
    if (domainChainId && domainChainId !== activeChainId) {
      throw new Error('Domain chainId is different from active chainId.')
    }
    const signature = await this.wallet._signTypedData(domain, types, message)
    return signature
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, any>,
    chainId?: ChainId
  ): Promise<string> {
    return this.signTypedData(domain, types, message, chainId)
  }

  connectUnchecked(): ethers.providers.JsonRpcSigner {
    throw new Error('connectUnchecked is unsupported')
  }

  connect(_provider: JsonRpcProvider): SmartAccountSigner {
    // if (provider) {
    //   return new SmartAccountSigner(provider)
    // }
    throw new Error('unsupported: cannot get JSON-RPC Signer connection')
  }
}
