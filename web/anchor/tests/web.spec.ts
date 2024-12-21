import * as anchor from '@coral-xyz/anchor'
import {Program} from '@coral-xyz/anchor'
import {Keypair} from '@solana/web3.js'
import {Web} from '../target/types/web'

describe('web', () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)
  const payer = provider.wallet as anchor.Wallet

  const program = anchor.workspace.Web as Program<Web>

  const webKeypair = Keypair.generate()

  it('Initialize Web', async () => {
    await program.methods
      .initialize()
      .accounts({
        web: webKeypair.publicKey,
        payer: payer.publicKey,
      })
      .signers([webKeypair])
      .rpc()

    const currentCount = await program.account.web.fetch(webKeypair.publicKey)

    expect(currentCount.count).toEqual(0)
  })

  it('Increment Web', async () => {
    await program.methods.increment().accounts({ web: webKeypair.publicKey }).rpc()

    const currentCount = await program.account.web.fetch(webKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Increment Web Again', async () => {
    await program.methods.increment().accounts({ web: webKeypair.publicKey }).rpc()

    const currentCount = await program.account.web.fetch(webKeypair.publicKey)

    expect(currentCount.count).toEqual(2)
  })

  it('Decrement Web', async () => {
    await program.methods.decrement().accounts({ web: webKeypair.publicKey }).rpc()

    const currentCount = await program.account.web.fetch(webKeypair.publicKey)

    expect(currentCount.count).toEqual(1)
  })

  it('Set web value', async () => {
    await program.methods.set(42).accounts({ web: webKeypair.publicKey }).rpc()

    const currentCount = await program.account.web.fetch(webKeypair.publicKey)

    expect(currentCount.count).toEqual(42)
  })

  it('Set close the web account', async () => {
    await program.methods
      .close()
      .accounts({
        payer: payer.publicKey,
        web: webKeypair.publicKey,
      })
      .rpc()

    // The account should no longer exist, returning null.
    const userAccount = await program.account.web.fetchNullable(webKeypair.publicKey)
    expect(userAccount).toBeNull()
  })
})
